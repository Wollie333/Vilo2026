-- Migration: 085_create_customers_schema.sql
-- Description: Create customers table and related infrastructure for CRM feature
-- Date: 2026-01-15
--
-- This migration creates a company-scoped customer management system that:
-- - Tracks customers across all properties in a company
-- - Auto-creates customers from bookings via database triggers
-- - Maintains booking statistics automatically
-- - Supports team member access via RLS policies
-- - Prevents duplicate customers with case-insensitive email matching

-- ============================================================================
-- CREATE ENUMS
-- ============================================================================

-- Customer status lifecycle
CREATE TYPE customer_status AS ENUM (
  'lead',         -- Inquired but no booking yet
  'active',       -- Has upcoming or current booking
  'past_guest',   -- Has completed booking(s)
  'inactive',     -- No activity in 12+ months
  'blocked'       -- Blocked by property owner
);

-- Customer source tracking
CREATE TYPE customer_source AS ENUM (
  'booking',          -- Created from booking
  'chat',             -- Created from chat interaction
  'website_inquiry',  -- Created from website form
  'manual',           -- Manually created by owner
  'import',           -- Imported from external source
  'referral'          -- Referred by another customer
);

-- ============================================================================
-- CREATE MAIN CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Company association (CRITICAL: company-scoped, not owner-scoped)
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Contact information
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),

  -- Origin tracking
  source customer_source NOT NULL DEFAULT 'booking',
  first_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Customer lifecycle
  status customer_status NOT NULL DEFAULT 'lead',
  status_mode VARCHAR(20) DEFAULT 'auto' CHECK (status_mode IN ('auto', 'manual')),

  -- Denormalized booking stats (updated by trigger)
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'ZAR',
  first_booking_date DATE,
  last_booking_date DATE,

  -- Engagement tracking
  last_contact_date TIMESTAMPTZ,
  last_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- CRM fields
  tags TEXT[],
  notes TEXT,
  internal_notes TEXT, -- Staff-only notes

  -- Preferences
  preferred_room_types TEXT[],
  special_requirements TEXT,
  marketing_consent BOOLEAN DEFAULT FALSE,

  -- Relationship to User Account (if guest has registered account)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE JUNCTION TABLE FOR PER-PROPERTY STATS
-- ============================================================================

CREATE TABLE customer_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Per-property booking stats
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  first_booking_date DATE,
  last_booking_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(customer_id, property_id)
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- CRITICAL: Case-insensitive unique email per company
-- This prevents duplicates like john@email.com and John@Email.com
CREATE UNIQUE INDEX idx_customers_email_company_unique
ON customers (LOWER(email), company_id);

-- Query performance indexes
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_source ON customers(source);
CREATE INDEX idx_customers_last_booking ON customers(last_booking_date DESC NULLS LAST);
CREATE INDEX idx_customers_total_spent ON customers(total_spent DESC);
CREATE INDEX idx_customers_user_id ON customers(user_id) WHERE user_id IS NOT NULL;

-- Array indexes for tags
CREATE INDEX idx_customers_tags ON customers USING gin(tags);

-- Full-text search index for name and notes
CREATE INDEX idx_customers_search ON customers
USING gin(to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(notes, '')));

-- Junction table indexes
CREATE INDEX idx_customer_properties_customer ON customer_properties(customer_id);
CREATE INDEX idx_customer_properties_property ON customer_properties(property_id);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger 1: Auto-update updated_at timestamp
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_properties_updated_at
  BEFORE UPDATE ON customer_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Auto-create customer from booking
CREATE OR REPLACE FUNCTION auto_create_customer_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Skip if guest_email is missing or booking is cancelled/no-show
  IF NEW.guest_email IS NULL OR NEW.booking_status IN ('cancelled', 'no_show') THEN
    RETURN NEW;
  END IF;

  -- Get company_id from property
  SELECT company_id INTO v_company_id
  FROM properties WHERE id = NEW.property_id;

  -- Skip if property or company not found
  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert or update customer
  INSERT INTO customers (
    email, full_name, phone, company_id,
    first_property_id, source, status, total_bookings,
    first_booking_date, last_booking_date, last_booking_id, user_id
  )
  VALUES (
    LOWER(NEW.guest_email),
    NEW.guest_name,
    NEW.guest_phone,
    v_company_id,
    NEW.property_id,
    'booking',
    CASE
      WHEN NEW.booking_status IN ('confirmed', 'checked_in') THEN 'active'::customer_status
      WHEN NEW.booking_status = 'completed' THEN 'past_guest'::customer_status
      ELSE 'lead'::customer_status
    END,
    1,
    NEW.check_in_date,
    NEW.check_in_date,
    NEW.id,
    NEW.guest_id
  )
  ON CONFLICT (LOWER(email), company_id)
  DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
    phone = COALESCE(EXCLUDED.phone, customers.phone),
    total_bookings = customers.total_bookings + 1,
    last_booking_date = CASE
      WHEN EXCLUDED.last_booking_date > customers.last_booking_date
      THEN EXCLUDED.last_booking_date
      ELSE customers.last_booking_date
    END,
    last_booking_id = NEW.id,
    user_id = COALESCE(NEW.guest_id, customers.user_id),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_customer_trigger
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION auto_create_customer_from_booking();

-- Trigger 3: Update customer stats on booking changes
CREATE OR REPLACE FUNCTION update_customer_booking_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_guest_email VARCHAR(255);
  v_customer_id UUID;
BEGIN
  -- Get company, email, and customer from the booking
  SELECT p.company_id, b.guest_email, c.id
  INTO v_company_id, v_guest_email, v_customer_id
  FROM properties p
  JOIN bookings b ON b.property_id = p.id
  LEFT JOIN customers c ON LOWER(c.email) = LOWER(b.guest_email) AND c.company_id = p.company_id
  WHERE b.id = COALESCE(NEW.id, OLD.id);

  -- Skip if no customer or email found
  IF v_customer_id IS NULL OR v_guest_email IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Recalculate customer stats from all bookings
  UPDATE customers SET
    total_bookings = (
      SELECT COUNT(*) FROM bookings b2
      JOIN properties p2 ON b2.property_id = p2.id
      WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
      AND p2.company_id = v_company_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ),
    total_spent = (
      SELECT COALESCE(SUM(b2.total_amount), 0)
      FROM bookings b2
      JOIN properties p2 ON b2.property_id = p2.id
      WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
      AND p2.company_id = v_company_id
      AND b2.payment_status = 'paid'
    ),
    first_booking_date = (
      SELECT MIN(b2.check_in_date)
      FROM bookings b2
      JOIN properties p2 ON b2.property_id = p2.id
      WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
      AND p2.company_id = v_company_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ),
    last_booking_date = (
      SELECT MAX(b2.check_in_date)
      FROM bookings b2
      JOIN properties p2 ON b2.property_id = p2.id
      WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
      AND p2.company_id = v_company_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ),
    status = CASE
      WHEN status_mode = 'manual' THEN status  -- Don't auto-update if manually set
      ELSE CASE
        WHEN EXISTS (
          SELECT 1 FROM bookings b2
          JOIN properties p2 ON b2.property_id = p2.id
          WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
          AND p2.company_id = v_company_id
          AND b2.booking_status IN ('confirmed', 'checked_in')
        ) THEN 'active'::customer_status
        WHEN EXISTS (
          SELECT 1 FROM bookings b2
          JOIN properties p2 ON b2.property_id = p2.id
          WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
          AND p2.company_id = v_company_id
          AND b2.booking_status = 'completed'
        ) THEN 'past_guest'::customer_status
        ELSE 'lead'::customer_status
      END
    END,
    updated_at = NOW()
  WHERE id = v_customer_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_trigger
AFTER UPDATE OF booking_status, payment_status, total_amount ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_booking_stats();

-- Trigger 4: Also update stats on booking deletion
CREATE TRIGGER update_customer_stats_on_delete_trigger
AFTER DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_booking_stats();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_properties ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Company owner, team members with read permission, or super admin
CREATE POLICY customers_select_policy ON customers
FOR SELECT TO authenticated
USING (
  -- Super admin can see all
  is_super_admin()
  OR
  -- Company owner can see their customers
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
  OR
  -- Team members with customers:read permission can see company customers
  company_id IN (
    SELECT ctm.company_id FROM company_team_members ctm
    WHERE ctm.user_id = auth.uid()
    AND ctm.is_active = TRUE
    AND has_permission('customers', 'read')
  )
);

-- INSERT policy: Company owner, team members with manage permission, or super admin
CREATE POLICY customers_insert_policy ON customers
FOR INSERT TO authenticated
WITH CHECK (
  is_super_admin()
  OR
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT ctm.company_id FROM company_team_members ctm
    WHERE ctm.user_id = auth.uid()
    AND ctm.is_active = TRUE
    AND has_permission('customers', 'manage')
  )
);

-- UPDATE policy: Same as INSERT
CREATE POLICY customers_update_policy ON customers
FOR UPDATE TO authenticated
USING (
  is_super_admin()
  OR
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT ctm.company_id FROM company_team_members ctm
    WHERE ctm.user_id = auth.uid()
    AND ctm.is_active = TRUE
    AND has_permission('customers', 'manage')
  )
);

-- DELETE policy: Same as INSERT
CREATE POLICY customers_delete_policy ON customers
FOR DELETE TO authenticated
USING (
  is_super_admin()
  OR
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT ctm.company_id FROM company_team_members ctm
    WHERE ctm.user_id = auth.uid()
    AND ctm.is_active = TRUE
    AND has_permission('customers', 'manage')
  )
);

-- Junction table policies (same logic as customers)
CREATE POLICY customer_properties_select_policy ON customer_properties
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = customer_properties.customer_id
    AND (
      is_super_admin()
      OR c.company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR c.company_id IN (
        SELECT ctm.company_id FROM company_team_members ctm
        WHERE ctm.user_id = auth.uid()
        AND ctm.is_active = TRUE
        AND has_permission('customers', 'read')
      )
    )
  )
);

CREATE POLICY customer_properties_modify_policy ON customer_properties
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = customer_properties.customer_id
    AND (
      is_super_admin()
      OR c.company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
      OR c.company_id IN (
        SELECT ctm.company_id FROM company_team_members ctm
        WHERE ctm.user_id = auth.uid()
        AND ctm.is_active = TRUE
        AND has_permission('customers', 'manage')
      )
    )
  )
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to enum types
GRANT USAGE ON TYPE customer_status TO authenticated;
GRANT USAGE ON TYPE customer_source TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    RAISE EXCEPTION 'customers table was not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_properties') THEN
    RAISE EXCEPTION 'customer_properties table was not created';
  END IF;
  RAISE NOTICE 'Customer CRM schema created successfully';
END$$;
