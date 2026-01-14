-- =====================================================
-- MIGRATION: 078_add_payment_proof_columns.sql
-- Description: Add payment proof and recovery tracking columns
-- Author: Claude
-- Date: 2026-01-14
-- Phase: Booking Management Phase 2 - Task 1
-- =====================================================

-- ============================================================================
-- STEP 1: ADD PAYMENT PROOF COLUMNS
-- ============================================================================

-- Add payment proof URL (stored in Supabase Storage)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add payment proof upload timestamp
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ;

-- Add payment verification timestamp
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

-- Add who verified the payment (property owner or admin)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES public.users(id);

-- Add rejection reason if payment proof was rejected
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- Comments
COMMENT ON COLUMN public.bookings.payment_proof_url IS 'URL to uploaded payment proof file in storage';
COMMENT ON COLUMN public.bookings.payment_proof_uploaded_at IS 'When guest uploaded payment proof';
COMMENT ON COLUMN public.bookings.payment_verified_at IS 'When payment was verified by property owner';
COMMENT ON COLUMN public.bookings.payment_verified_by IS 'User ID of who verified the payment';
COMMENT ON COLUMN public.bookings.payment_rejection_reason IS 'Reason for payment proof rejection (if rejected)';

-- ============================================================================
-- STEP 2: ADD ABANDONED CART RECOVERY COLUMNS
-- ============================================================================

-- Track if recovery email was sent for abandoned cart
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recovery_email_sent BOOLEAN DEFAULT false;

-- Track when recovery email was sent
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMPTZ;

-- Link to original abandoned booking if this is a recovered booking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recovered_from_abandoned_cart_id UUID REFERENCES public.bookings(id);

-- Comments
COMMENT ON COLUMN public.bookings.recovery_email_sent IS 'Whether recovery email was sent for abandoned cart';
COMMENT ON COLUMN public.bookings.recovery_email_sent_at IS 'When recovery email was sent';
COMMENT ON COLUMN public.bookings.recovered_from_abandoned_cart_id IS 'Original abandoned booking ID if this booking recovered it';

-- ============================================================================
-- STEP 3: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding bookings awaiting payment verification
CREATE INDEX IF NOT EXISTS idx_bookings_payment_verification
ON public.bookings(payment_status)
WHERE payment_status = 'verification_pending';

-- Index for finding failed checkouts that need recovery emails
CREATE INDEX IF NOT EXISTS idx_bookings_failed_checkout_recovery
ON public.bookings(payment_status, recovery_email_sent)
WHERE payment_status = 'failed_checkout' AND recovery_email_sent = false;

-- Index for tracking recovered bookings
CREATE INDEX IF NOT EXISTS idx_bookings_recovered_carts
ON public.bookings(recovered_from_abandoned_cart_id)
WHERE recovered_from_abandoned_cart_id IS NOT NULL;

-- ============================================================================
-- STEP 4: ADD RLS POLICIES FOR PAYMENT PROOFS
-- ============================================================================

-- Property owners can view payment proofs for their properties
-- Guests can view their own payment proofs
-- (Existing booking RLS policies should handle this, but adding note for clarity)

-- Note: Payment proof files in storage will need separate RLS policies
-- These will be added when setting up the storage bucket

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  -- Check payment proof columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_proof_url'
  ) THEN
    RAISE EXCEPTION 'Migration failed: payment_proof_url column not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'recovery_email_sent'
  ) THEN
    RAISE EXCEPTION 'Migration failed: recovery_email_sent column not added';
  END IF;

  RAISE NOTICE '✅ Migration 078 completed successfully';
  RAISE NOTICE '   - Added 8 new columns to bookings table';
  RAISE NOTICE '   - Added 3 performance indexes';
  RAISE NOTICE '   - Ready for payment proof upload feature';
END $$;
