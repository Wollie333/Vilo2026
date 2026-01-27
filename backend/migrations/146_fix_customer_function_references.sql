-- Migration: 146_fix_customer_function_references.sql
-- Description: Fix hardcoded customers_new references in functions after table rename
-- Date: 2026-01-26
--
-- Problem: Migration 138 renamed customers_new → customers, but the trigger functions
--          still reference "customers_new" directly, causing errors.
--
-- Solution: Recreate all customer-related functions to use "customers" table name

-- ============================================================================
-- FIX 1: Auto-create customer from booking (property-scoped)
-- ============================================================================

DROP FUNCTION IF EXISTS auto_create_customer_from_booking_property_scoped() CASCADE;

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
  INSERT INTO customers (
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

-- Recreate trigger
DROP TRIGGER IF EXISTS auto_create_customer_trigger_property_scoped ON bookings;
CREATE TRIGGER auto_create_customer_trigger_property_scoped
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION auto_create_customer_from_booking_property_scoped();

-- ============================================================================
-- FIX 2: Update customer booking stats (property-scoped)
-- ============================================================================

DROP FUNCTION IF EXISTS update_customer_booking_stats_property_scoped() CASCADE;

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
  LEFT JOIN customers c ON LOWER(c.email) = LOWER(b.guest_email) AND c.property_id = b.property_id
  WHERE b.id = COALESCE(NEW.id, OLD.id);

  -- Skip if no customer or email found
  IF v_customer_id IS NULL OR v_guest_email IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Recalculate customer stats from all bookings FOR THIS PROPERTY
  UPDATE customers SET
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

-- Recreate trigger
DROP TRIGGER IF EXISTS update_customer_booking_stats_trigger_property_scoped ON bookings;
CREATE TRIGGER update_customer_booking_stats_trigger_property_scoped
AFTER UPDATE OF booking_status, payment_status, total_amount ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_customer_booking_stats_property_scoped();

-- ============================================================================
-- FIX 3: Sync customer portal user_id changes
-- ============================================================================

DROP FUNCTION IF EXISTS sync_customer_user_id_property_scoped() CASCADE;

CREATE OR REPLACE FUNCTION sync_customer_user_id_property_scoped()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking's guest_id (user_id) changes, update all customer records for that email
  IF NEW.guest_id IS DISTINCT FROM OLD.guest_id AND NEW.guest_email IS NOT NULL THEN
    UPDATE customers
    SET user_id = NEW.guest_id,
        updated_at = NOW()
    WHERE LOWER(email) = LOWER(NEW.guest_email)
      AND property_id = NEW.property_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS sync_customer_user_id_trigger_property_scoped ON bookings;
CREATE TRIGGER sync_customer_user_id_trigger_property_scoped
AFTER UPDATE OF guest_id ON bookings
FOR EACH ROW
EXECUTE FUNCTION sync_customer_user_id_property_scoped();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Customer function references fixed - all functions now use "customers" table';
  RAISE NOTICE '✅ Triggers recreated and attached to bookings table';
  RAISE NOTICE '🎉 Migration 146 completed successfully!';
END $$;
