-- =====================================================
-- MIGRATION: 079_create_payment_proofs_storage.sql
-- Description: Create storage bucket for payment proof uploads
-- Author: Claude
-- Date: 2026-01-14
-- Phase: Booking Management Phase 2 - Task 1
-- =====================================================

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKET
-- ============================================================================

-- Create payment-proofs bucket for storing EFT payment proof files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false, -- Not public, requires authentication
  5242880, -- 5MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE RLS POLICIES FOR PAYMENT PROOFS
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
-- STEP 3: ADD HELPFUL COMMENTS
-- ============================================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Check bucket was created
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs'
  ) THEN
    RAISE EXCEPTION 'Migration failed: payment-proofs bucket not created';
  END IF;

  RAISE NOTICE '✅ Migration 079 completed successfully';
  RAISE NOTICE '   - Created payment-proofs storage bucket';
  RAISE NOTICE '   - 5MB file size limit';
  RAISE NOTICE '   - Allowed: PDF, JPG, JPEG, PNG, WebP';
  RAISE NOTICE '   - Added 5 RLS policies for secure access';
END $$;
