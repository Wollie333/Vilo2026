-- =====================================================
-- MIGRATION: 077_A_add_enum_values.sql
-- Description: Part 1 - Add new enum values for booking/payment statuses
-- Author: Claude
-- Date: 2026-01-14
--
-- IMPORTANT: Run this first, then run 077_B separately
-- =====================================================

-- Add 'pending_modification' to booking_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pending_modification'
    AND enumtypid = 'booking_status'::regtype
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'pending_modification';
    RAISE NOTICE 'Added pending_modification to booking_status';
  ELSE
    RAISE NOTICE 'pending_modification already exists in booking_status';
  END IF;
END $$;

-- Add 'failed_checkout' to payment_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'failed_checkout'
    AND enumtypid = 'payment_status'::regtype
  ) THEN
    ALTER TYPE payment_status ADD VALUE 'failed_checkout';
    RAISE NOTICE 'Added failed_checkout to payment_status';
  ELSE
    RAISE NOTICE 'failed_checkout already exists in payment_status';
  END IF;
END $$;

-- Add 'verification_pending' to payment_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'verification_pending'
    AND enumtypid = 'payment_status'::regtype
  ) THEN
    ALTER TYPE payment_status ADD VALUE 'verification_pending';
    RAISE NOTICE 'Added verification_pending to payment_status';
  ELSE
    RAISE NOTICE 'verification_pending already exists in payment_status';
  END IF;
END $$;

-- Add 'partially_refunded' to payment_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'partially_refunded'
    AND enumtypid = 'payment_status'::regtype
  ) THEN
    ALTER TYPE payment_status ADD VALUE 'partially_refunded';
    RAISE NOTICE 'Added partially_refunded to payment_status';
  ELSE
    RAISE NOTICE 'partially_refunded already exists in payment_status';
  END IF;
END $$;

-- Add comments
COMMENT ON TYPE booking_status IS 'Booking status: pending, confirmed, pending_modification, checked_in, checked_out, completed, cancelled, no_show';
COMMENT ON TYPE payment_status IS 'Payment status: pending, failed_checkout, verification_pending, partial, paid, refunded, partially_refunded, failed';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration 077_A completed successfully!';
  RAISE NOTICE 'New enum values added and committed.';
  RAISE NOTICE 'Now run migration 077_B_add_columns_functions.sql';
  RAISE NOTICE '===========================================';
END $$;
