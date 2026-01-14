-- Migration 041: Create Receipts and Invoice Logos Storage Buckets
-- This migration creates the missing storage buckets for receipts and invoice logos

-- ===========================================================================
-- CREATE RECEIPTS BUCKET
-- ===========================================================================

-- Create receipts bucket (private, PDF only, 10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- CREATE INVOICE-LOGOS BUCKET
-- ===========================================================================

-- Create invoice-logos bucket (public, images only, 2MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoice-logos', 'invoice-logos', true, 2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- RLS POLICIES FOR RECEIPTS BUCKET
-- ===========================================================================

-- Policy: Users can read receipts for their company's properties
CREATE POLICY "Users can read their company's receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id::text = (storage.foldername(name))[1]
    AND companies.user_id = auth.uid()
  )
);

-- Policy: Admins can read all receipts
CREATE POLICY "Admins can read all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  public.is_admin_or_super()
);

-- Policy: Service role can manage receipts (for backend operations)
CREATE POLICY "Service role can manage receipts"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'receipts');

-- ===========================================================================
-- RLS POLICIES FOR INVOICE-LOGOS BUCKET
-- ===========================================================================

-- Policy: Anyone can read logos (public bucket)
CREATE POLICY "Anyone can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoice-logos');

-- Policy: Authenticated users can read logos
CREATE POLICY "Authenticated users can read logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-logos');

-- Policy: Admins can upload/update logos
CREATE POLICY "Admins can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoice-logos' AND
  public.is_admin_or_super()
);

-- Policy: Admins can update logos
CREATE POLICY "Admins can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoice-logos' AND
  public.is_admin_or_super()
);

-- Policy: Admins can delete logos
CREATE POLICY "Admins can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoice-logos' AND
  public.is_admin_or_super()
);

-- Policy: Service role can manage logos (for backend operations)
CREATE POLICY "Service role can manage invoice logos"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'invoice-logos');

-- ===========================================================================
-- COMMENTS
-- ===========================================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets for file management';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 041 completed: Created receipts and invoice-logos storage buckets with RLS policies';
END $$;
