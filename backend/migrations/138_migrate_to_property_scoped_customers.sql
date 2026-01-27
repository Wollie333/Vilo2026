-- Migration: 138_migrate_to_property_scoped_customers.sql
-- Description: Refactor customers from company-scoped to property-scoped
-- Date: 2026-01-25
--
-- CRITICAL CHANGE: This migration transforms the customer model from:
--   ONE customer record per email per COMPANY
-- To:
--   ONE customer record per email per PROPERTY
--
-- Why: A guest can be a customer of multiple properties with separate lifecycles,
--      but maintains one user account (portal) for authentication.
--
-- Impact:
-- - Existing customers will be duplicated per property they have bookings for
-- - customer_properties junction table becomes redundant (will be removed)
-- - All customer queries must now filter by property_id instead of company_id

-- ============================================================================
-- STEP 1: CREATE NEW PROPERTY-SCOPED CUSTOMERS TABLE
-- ============================================================================

-- Create new table with property_id as the primary scope
CREATE TABLE customers_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- CHANGED: Property association (property-scoped, not company-scoped)
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Keep company_id for convenient querying (derived from property)
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Contact information (unchanged)
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),

  -- Origin tracking (unchanged)
  source customer_source NOT NULL DEFAULT 'booking',
  first_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- Customer lifecycle (unchanged)
  status customer_status NOT NULL DEFAULT 'lead',
  status_mode VARCHAR(20) DEFAULT 'auto' CHECK (status_mode IN ('auto', 'manual')),

  -- Denormalized booking stats (now per property, not per company)
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'ZAR',
  first_booking_date DATE,
  last_booking_date DATE,

  -- Engagement tracking (unchanged)
  last_contact_date TIMESTAMPTZ,
  last_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- CRM fields (unchanged)
  tags TEXT[],
  notes TEXT,
  internal_notes TEXT,

  -- Preferences (unchanged)
  preferred_room_types TEXT[],
  special_requirements TEXT,
  marketing_consent BOOLEAN DEFAULT FALSE,

  -- Relationship to User Account (unchanged)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: MIGRATE EXISTING DATA TO PROPERTY-SCOPED MODEL
-- ============================================================================

-- For each existing customer, create one customer record per property they have bookings for
DO $$
DECLARE
  migration_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting customer data migration from company-scoped to property-scoped...';

  -- Insert one customer record per property the guest has bookings for
  INSERT INTO customers_new (
    property_id,
    company_id,
    email,
    full_name,
    phone,
    source,
    first_booking_id,
    status,
    status_mode,
    total_bookings,
    total_spent,
    currency,
    first_booking_date,
    last_booking_date,
    last_contact_date,
    last_booking_id,
    tags,
    notes,
    internal_notes,
    preferred_room_types,
    special_requirements,
    marketing_consent,
    user_id,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (LOWER(c.email), b.property_id)
    b.property_id,                    -- NEW: Property association
    p.company_id,                      -- Derived from property
    c.email,
    c.full_name,
    c.phone,
    c.source,
    (
      SELECT id FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(c.email)
      AND b2.property_id = b.property_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
      ORDER BY b2.check_in_date ASC
      LIMIT 1
    ) as first_booking_id,
    -- Recalculate status per property
    CASE
      WHEN EXISTS (
        SELECT 1 FROM bookings b2
        WHERE LOWER(b2.guest_email) = LOWER(c.email)
        AND b2.property_id = b.property_id
        AND b2.booking_status IN ('confirmed', 'checked_in')
      ) THEN 'active'::customer_status
      WHEN EXISTS (
        SELECT 1 FROM bookings b2
        WHERE LOWER(b2.guest_email) = LOWER(c.email)
        AND b2.property_id = b.property_id
        AND b2.booking_status = 'completed'
      ) THEN 'past_guest'::customer_status
      ELSE 'lead'::customer_status
    END as status,
    c.status_mode,
    -- Recalculate stats per property
    (
      SELECT COUNT(*)
      FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(c.email)
      AND b2.property_id = b.property_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ) as total_bookings,
    (
      SELECT COALESCE(SUM(b2.total_amount), 0)
      FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(c.email)
      AND b2.property_id = b.property_id
      AND b2.payment_status = 'paid'
    ) as total_spent,
    c.currency,
    (
      SELECT MIN(b2.check_in_date)
      FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(c.email)
      AND b2.property_id = b.property_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ) as first_booking_date,
    (
      SELECT MAX(b2.check_in_date)
      FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(c.email)
      AND b2.property_id = b.property_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ) as last_booking_date,
    c.last_contact_date,
    (
      SELECT id FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(c.email)
      AND b2.property_id = b.property_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
      ORDER BY b2.check_in_date DESC
      LIMIT 1
    ) as last_booking_id,
    c.tags,
    c.notes,
    c.internal_notes,
    c.preferred_room_types,
    c.special_requirements,
    c.marketing_consent,
    c.user_id,
    c.created_at,
    NOW() as updated_at  -- Mark as updated during migration
  FROM customers c
  JOIN bookings b ON LOWER(b.guest_email) = LOWER(c.email)
  JOIN properties p ON p.id = b.property_id
  WHERE c.company_id = p.company_id
  AND b.booking_status NOT IN ('cancelled', 'no_show')
  ORDER BY LOWER(c.email), b.property_id, b.check_in_date ASC;

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % customer records from company-scoped to property-scoped', migration_count;

  -- Handle customers with NO bookings (lead status, created manually or from chat)
  -- These customers don't have a property_id, so we'll link them to first_property_id if available
  INSERT INTO customers_new (
    property_id,
    company_id,
    email,
    full_name,
    phone,
    source,
    status,
    status_mode,
    tags,
    notes,
    internal_notes,
    marketing_consent,
    user_id,
    created_at,
    updated_at
  )
  SELECT
    COALESCE(c.first_property_id, (
      SELECT id FROM properties WHERE company_id = c.company_id LIMIT 1
    )) as property_id,  -- Use first_property_id or any property from company
    c.company_id,
    c.email,
    c.full_name,
    c.phone,
    c.source,
    c.status,
    c.status_mode,
    c.tags,
    c.notes,
    c.internal_notes,
    c.marketing_consent,
    c.user_id,
    c.created_at,
    NOW() as updated_at
  FROM customers c
  WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE LOWER(b.guest_email) = LOWER(c.email)
    AND b.booking_status NOT IN ('cancelled', 'no_show')
  )
  AND (c.first_property_id IS NOT NULL OR EXISTS (
    SELECT 1 FROM properties WHERE company_id = c.company_id
  ));

  GET DIAGNOSTICS migration_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % lead customers (no bookings) to property-scoped', migration_count;

END $$;

-- ============================================================================
-- STEP 3: CREATE INDEXES ON NEW TABLE
-- ============================================================================

-- CRITICAL: Case-insensitive unique email per PROPERTY (not company)
CREATE UNIQUE INDEX idx_customers_new_email_property_unique
ON customers_new (LOWER(email), property_id);

-- Query performance indexes
CREATE INDEX idx_customers_new_property ON customers_new(property_id);
CREATE INDEX idx_customers_new_company ON customers_new(company_id);  -- Still useful for company-wide queries
CREATE INDEX idx_customers_new_status ON customers_new(status);
CREATE INDEX idx_customers_new_source ON customers_new(source);
CREATE INDEX idx_customers_new_last_booking ON customers_new(last_booking_date DESC NULLS LAST);
CREATE INDEX idx_customers_new_total_spent ON customers_new(total_spent DESC);
CREATE INDEX idx_customers_new_user_id ON customers_new(user_id) WHERE user_id IS NOT NULL;

-- Array indexes for tags
CREATE INDEX idx_customers_new_tags ON customers_new USING gin(tags);

-- Full-text search index for name and notes
CREATE INDEX idx_customers_new_search ON customers_new
USING gin(to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(notes, '')));

-- ============================================================================
-- STEP 4: DROP OLD TRIGGERS AND FUNCTIONS
-- ============================================================================

DROP TRIGGER IF EXISTS auto_create_customer_trigger ON bookings;
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON bookings;
DROP TRIGGER IF EXISTS update_customer_stats_on_delete_trigger ON bookings;
DROP FUNCTION IF EXISTS auto_create_customer_from_booking();
DROP FUNCTION IF EXISTS update_customer_booking_stats();

-- ============================================================================
-- STEP 5: CREATE NEW PROPERTY-SCOPED TRIGGERS
-- ============================================================================

-- Trigger 1: Auto-update updated_at timestamp
CREATE TRIGGER update_customers_new_updated_at
  BEFORE UPDATE ON customers_new
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Auto-create PROPERTY-SCOPED customer from booking
CREATE OR REPLACE FUNCTION auto_create_customer_from_booking_property_scoped()
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

  -- Insert or update customer FOR THIS PROPERTY
  INSERT INTO customers_new (
    property_id, company_id, email, full_name, phone,
    source, first_booking_id, status, total_bookings,
    first_booking_date, last_booking_date, last_booking_id, user_id
  )
  VALUES (
    NEW.property_id,  -- PROPERTY-SCOPED
    v_company_id,
    LOWER(NEW.guest_email),
    NEW.guest_name,
    NEW.guest_phone,
    'booking',
    NEW.id,
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
  ON CONFLICT (LOWER(email), property_id)  -- PROPERTY-SCOPED UNIQUE CONSTRAINT
  DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, customers_new.full_name),
    phone = COALESCE(EXCLUDED.phone, customers_new.phone),
    total_bookings = customers_new.total_bookings + 1,
    last_booking_date = CASE
      WHEN EXCLUDED.last_booking_date > customers_new.last_booking_date
      THEN EXCLUDED.last_booking_date
      ELSE customers_new.last_booking_date
    END,
    last_booking_id = NEW.id,
    user_id = COALESCE(NEW.guest_id, customers_new.user_id),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_customer_trigger_property_scoped
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION auto_create_customer_from_booking_property_scoped();

-- Trigger 3: Update PROPERTY-SCOPED customer stats on booking changes
CREATE OR REPLACE FUNCTION update_customer_booking_stats_property_scoped()
RETURNS TRIGGER AS $$
DECLARE
  v_property_id UUID;
  v_guest_email VARCHAR(255);
  v_customer_id UUID;
BEGIN
  -- Get property, email, and customer from the booking
  SELECT b.property_id, b.guest_email, c.id
  INTO v_property_id, v_guest_email, v_customer_id
  FROM bookings b
  LEFT JOIN customers_new c ON LOWER(c.email) = LOWER(b.guest_email) AND c.property_id = b.property_id
  WHERE b.id = COALESCE(NEW.id, OLD.id);

  -- Skip if no customer or email found
  IF v_customer_id IS NULL OR v_guest_email IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Recalculate customer stats from all bookings FOR THIS PROPERTY
  UPDATE customers_new SET
    total_bookings = (
      SELECT COUNT(*) FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
      AND b2.property_id = v_property_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ),
    total_spent = (
      SELECT COALESCE(SUM(b2.total_amount), 0)
      FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
      AND b2.property_id = v_property_id
      AND b2.payment_status = 'paid'
    ),
    first_booking_date = (
      SELECT MIN(b2.check_in_date)
      FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
      AND b2.property_id = v_property_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ),
    last_booking_date = (
      SELECT MAX(b2.check_in_date)
      FROM bookings b2
      WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
      AND b2.property_id = v_property_id
      AND b2.booking_status NOT IN ('cancelled', 'no_show')
    ),
    status = CASE
      WHEN status_mode = 'manual' THEN status
      ELSE CASE
        WHEN EXISTS (
          SELECT 1 FROM bookings b2
          WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
          AND b2.property_id = v_property_id
          AND b2.booking_status IN ('confirmed', 'checked_in')
        ) THEN 'active'::customer_status
        WHEN EXISTS (
          SELECT 1 FROM bookings b2
          WHERE LOWER(b2.guest_email) = LOWER(v_guest_email)
          AND b2.property_id = v_property_id
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

CREATE TRIGGER update_customer_stats_trigger_property_scoped
AFTER UPDATE OF booking_status, payment_status, total_amount ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_booking_stats_property_scoped();

-- Trigger 4: Also update stats on booking deletion
CREATE TRIGGER update_customer_stats_on_delete_trigger_property_scoped
AFTER DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_booking_stats_property_scoped();

-- ============================================================================
-- STEP 6: UPDATE RLS POLICIES FOR PROPERTY-SCOPED ACCESS
-- ============================================================================

-- Enable RLS on new table
ALTER TABLE customers_new ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Property-aware access control
CREATE POLICY customers_new_select_policy ON customers_new
FOR SELECT TO authenticated
USING (
  -- Super admin can see all
  is_super_admin()
  OR
  -- Company owner can see all customers across their properties
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
  OR
  -- Property owner can see customers for their property
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
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

-- INSERT policy: Property-aware creation
CREATE POLICY customers_new_insert_policy ON customers_new
FOR INSERT TO authenticated
WITH CHECK (
  is_super_admin()
  OR
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
  OR
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
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
CREATE POLICY customers_new_update_policy ON customers_new
FOR UPDATE TO authenticated
USING (
  is_super_admin()
  OR
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
  OR
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
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
CREATE POLICY customers_new_delete_policy ON customers_new
FOR DELETE TO authenticated
USING (
  is_super_admin()
  OR
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
  OR
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT ctm.company_id FROM company_team_members ctm
    WHERE ctm.user_id = auth.uid()
    AND ctm.is_active = TRUE
    AND has_permission('customers', 'manage')
  )
);

-- ============================================================================
-- STEP 7: SWAP TABLES (CRITICAL - POINT OF NO RETURN)
-- ============================================================================

DO $$
DECLARE
  old_customer_count INTEGER;
  new_customer_count INTEGER;
  property_count INTEGER;
BEGIN
  -- Get counts before swap
  SELECT COUNT(*) INTO old_customer_count FROM customers;
  SELECT COUNT(*) INTO new_customer_count FROM customers_new;

  -- Rename old table to backup
  ALTER TABLE customers RENAME TO customers_old_company_scoped;

  -- Rename new table to customers
  ALTER TABLE customers_new RENAME TO customers;

  -- Drop the now-redundant customer_properties junction table
  DROP TABLE IF EXISTS customer_properties;

  RAISE NOTICE '✅ Customer migration complete: customers are now property-scoped';
  RAISE NOTICE '⚠️  Old table kept as customers_old_company_scoped for rollback if needed';
  RAISE NOTICE '⚠️  Junction table customer_properties has been removed (no longer needed)';

  -- ============================================================================
  -- STEP 8: VERIFICATION
  -- ============================================================================

  SELECT COUNT(DISTINCT property_id) INTO property_count FROM customers;

  RAISE NOTICE '📊 Migration Statistics:';
  RAISE NOTICE '  - Old customer records (company-scoped): %', old_customer_count;
  RAISE NOTICE '  - New customer records (property-scoped): %', new_customer_count;
  RAISE NOTICE '  - Properties with customers: %', property_count;
  RAISE NOTICE '  - Multiplication factor: %x', ROUND(new_customer_count::NUMERIC / NULLIF(old_customer_count, 0), 2);

  -- Verify no orphaned customers
  IF EXISTS (
    SELECT 1 FROM customers c
    WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = c.property_id)
  ) THEN
    RAISE WARNING '⚠️  Some customers have invalid property_id references!';
  ELSE
    RAISE NOTICE '✅ All customers have valid property_id references';
  END IF;

  -- Verify unique constraint working
  IF EXISTS (
    SELECT LOWER(email), property_id, COUNT(*)
    FROM customers
    GROUP BY LOWER(email), property_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE WARNING '⚠️  Duplicate customers found for same email+property!';
  ELSE
    RAISE NOTICE '✅ No duplicate customers per property (unique constraint working)';
  END IF;

  RAISE NOTICE '🎉 Property-scoped customer migration completed successfully!';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (In case of issues)
-- ============================================================================

-- To rollback this migration, run:
-- DROP TABLE customers;
-- ALTER TABLE customers_old_company_scoped RENAME TO customers;
-- Then restore old triggers from migration 085
