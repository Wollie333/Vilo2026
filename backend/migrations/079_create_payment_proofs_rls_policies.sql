-- =====================================================
-- MIGRATION: 079_create_payment_proofs_rls_policies.sql
-- Description: Create RLS policies for payment-proofs storage bucket
-- Author: Claude
-- Date: 2026-01-14
-- Phase: Booking Management Phase 2 - Task 1
--
-- PREREQUISITE: The 'payment-proofs' bucket must exist!
-- See: 079_CREATE_BUCKET_MANUALLY.md for bucket creation instructions
-- =====================================================

-- ============================================================================
-- VERIFY BUCKET EXISTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs') THEN
    RAISE EXCEPTION 'The payment-proofs bucket does not exist. Please create it manually in Supabase Dashboard first. See 079_CREATE_BUCKET_MANUALLY.md for instructions.';
  END IF;
END $$;

-- ============================================================================
-- CREATE RLS POLICIES FOR PAYMENT PROOFS
-- ============================================================================

-- Policy 1: Guests can upload payment proofs for their own bookings
CREATE POLICY "Guests can upload payment proofs for their bookings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid() IN (
    SELECT guest_id FROM public.bookings
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy 2: Guests can view their own payment proofs
CREATE POLICY "Guests can view their own payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() IN (
    SELECT guest_id FROM public.bookings
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Policy 3: Property owners can view payment proofs for their properties
CREATE POLICY "Property owners can view payment proofs for their properties"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() IN (
    SELECT p.owner_id
    FROM public.bookings b
    JOIN public.properties p ON b.property_id = p.id
    WHERE b.id::text = (storage.foldername(name))[1]
  )
);

-- Policy 4: Property owners can delete payment proofs (if needed for re-upload)
CREATE POLICY "Property owners can delete payment proofs for their properties"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() IN (
    SELECT p.owner_id
    FROM public.bookings b
    JOIN public.properties p ON b.property_id = p.id
    WHERE b.id::text = (storage.foldername(name))[1]
  )
);

-- Policy 5: Admins and super admins can view all payment proofs
CREATE POLICY "Admins can view all payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE u.id = auth.uid()
    AND ut.name IN ('saas_admin', 'saas_super_admin')
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 079 RLS policies completed successfully';
  RAISE NOTICE '   - Created 5 RLS policies for payment-proofs bucket';
  RAISE NOTICE '   - Guest upload policy: ✓';
  RAISE NOTICE '   - Guest view policy: ✓';
  RAISE NOTICE '   - Property owner view policy: ✓';
  RAISE NOTICE '   - Property owner delete policy: ✓';
  RAISE NOTICE '   - Admin view policy: ✓';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Payment proof files are now secured with Row Level Security';
END $$;
