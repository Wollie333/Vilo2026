-- Migration: 098_cleanup_proof_tracking.sql
-- Description: Remove duplicate proof tracking from booking_payments table
-- Date: 2026-01-16
-- Author: Database Cleanup Phase 3
-- Risk: LOW - Proof tracking consolidated in bookings table

-- ============================================================================
-- PRE-FLIGHT CHECKS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 098: Cleanup Proof Tracking';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This migration will:';
  RAISE NOTICE '  - Remove proof_url from booking_payments table';
  RAISE NOTICE '  - Remove proof_verified_by from booking_payments table';
  RAISE NOTICE '  - Remove proof_verified_at from booking_payments table';
  RAISE NOTICE '';
  RAISE NOTICE 'Proof tracking will remain in bookings table:';
  RAISE NOTICE '  - payment_proof_url';
  RAISE NOTICE '  - payment_proof_uploaded_at';
  RAISE NOTICE '  - payment_verified_at';
  RAISE NOTICE '  - payment_verified_by';
  RAISE NOTICE '  - payment_rejection_reason';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: BACKUP DATA (safety measure)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 1: Creating backup table...';
END $$;

-- Create backup table for any payments with proof data
DROP TABLE IF EXISTS booking_payments_proof_backup;
CREATE TABLE booking_payments_proof_backup AS
SELECT
  id,
  booking_id,
  proof_url,
  proof_verified_by,
  proof_verified_at,
  created_at,
  updated_at
FROM booking_payments
WHERE proof_url IS NOT NULL OR proof_verified_by IS NOT NULL;

DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM booking_payments_proof_backup;
  RAISE NOTICE '✓ Backup created: booking_payments_proof_backup (% rows)', backup_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: MIGRATE DATA TO BOOKINGS TABLE (if needed)
-- ============================================================================

DO $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Step 2: Migrating proof data to bookings table...';
  RAISE NOTICE '';

  -- Update bookings where payment has proof but booking doesn't
  UPDATE bookings b
  SET
    payment_proof_url = bp.proof_url,
    payment_verified_by = bp.proof_verified_by,
    payment_verified_at = bp.proof_verified_at,
    updated_at = NOW()
  FROM booking_payments bp
  WHERE b.id = bp.booking_id
    AND bp.proof_url IS NOT NULL
    AND b.payment_proof_url IS NULL;

  GET DIAGNOSTICS migrated_count = ROW_COUNT;

  IF migrated_count > 0 THEN
    RAISE NOTICE '✓ Migrated proof data for % booking(s)', migrated_count;
  ELSE
    RAISE NOTICE '→ No proof data to migrate';
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: REMOVE DUPLICATE COLUMNS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 3: Removing duplicate proof tracking columns...';
  RAISE NOTICE '';
END $$;

-- Drop proof_url column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'booking_payments'
    AND column_name = 'proof_url'
  ) THEN
    ALTER TABLE booking_payments DROP COLUMN proof_url;
    RAISE NOTICE '✓ Removed column: proof_url';
  ELSE
    RAISE NOTICE '→ Column proof_url already removed';
  END IF;
END $$;

-- Drop proof_verified_by column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'booking_payments'
    AND column_name = 'proof_verified_by'
  ) THEN
    ALTER TABLE booking_payments DROP COLUMN proof_verified_by;
    RAISE NOTICE '✓ Removed column: proof_verified_by';
  ELSE
    RAISE NOTICE '→ Column proof_verified_by already removed';
  END IF;
END $$;

-- Drop proof_verified_at column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'booking_payments'
    AND column_name = 'proof_verified_at'
  ) THEN
    ALTER TABLE booking_payments DROP COLUMN proof_verified_at;
    RAISE NOTICE '✓ Removed column: proof_verified_at';
  ELSE
    RAISE NOTICE '→ Column proof_verified_at already removed';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  remaining_columns TEXT[];
  bookings_with_proof INTEGER;
BEGIN
  RAISE NOTICE 'Step 4: Verification...';
  RAISE NOTICE '';

  -- Check if any duplicate columns still exist
  SELECT ARRAY_AGG(column_name) INTO remaining_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'booking_payments'
    AND column_name IN ('proof_url', 'proof_verified_by', 'proof_verified_at');

  IF remaining_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Migration failed: Duplicate columns still exist: %', remaining_columns;
  ELSE
    RAISE NOTICE '✓ All duplicate proof columns removed from booking_payments';
  END IF;

  -- Verify bookings table still has proof tracking columns
  SELECT COUNT(*) INTO bookings_with_proof
  FROM bookings
  WHERE payment_proof_url IS NOT NULL;

  RAISE NOTICE '✓ Bookings with proof tracking: %', bookings_with_proof;

  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 098: Cleanup Proof Tracking - COMPLETED';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  ✓ Removed columns: proof_url, proof_verified_by, proof_verified_at';
  RAISE NOTICE '  ✓ Proof tracking consolidated in bookings table';
  RAISE NOTICE '  ✓ Backup table: booking_payments_proof_backup';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Verify proof upload/verification flows work correctly';
  RAISE NOTICE '  2. Test payment proof upload as guest';
  RAISE NOTICE '  3. Test payment verification as property owner';
  RAISE NOTICE '  4. Monitor for 30 days';
  RAISE NOTICE '  5. After 30 days of stable operation:';
  RAISE NOTICE '     DROP TABLE booking_payments_proof_backup;';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Rollback Instructions (if needed within 30 days):';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '  ALTER TABLE booking_payments ADD COLUMN proof_url TEXT;';
  RAISE NOTICE '  ALTER TABLE booking_payments ADD COLUMN proof_verified_by UUID;';
  RAISE NOTICE '  ALTER TABLE booking_payments ADD COLUMN proof_verified_at TIMESTAMPTZ;';
  RAISE NOTICE '';
  RAISE NOTICE '  UPDATE booking_payments bp';
  RAISE NOTICE '  SET proof_url = b.proof_url,';
  RAISE NOTICE '      proof_verified_by = b.proof_verified_by,';
  RAISE NOTICE '      proof_verified_at = b.proof_verified_at';
  RAISE NOTICE '  FROM booking_payments_proof_backup b WHERE bp.id = b.id;';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
END $$;
