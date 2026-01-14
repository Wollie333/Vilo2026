-- ============================================================================
-- Migration 027: Create Invoice Storage Bucket
-- Creates Supabase storage bucket for invoice PDFs (private)
-- ============================================================================

-- Create invoices storage bucket (private - requires auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'invoices',
    'invoices',
    false,  -- Private bucket - requires authentication
    10485760,  -- 10MB file size limit
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf']::text[];

-- ============================================================================
-- Storage Policies
-- ============================================================================

-- Users can read their own invoices (path: {user_id}/{filename}.pdf)
CREATE POLICY "Users can read their own invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read all invoices
CREATE POLICY "Admins can read all invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'invoices'
    AND public.is_admin_or_super()
);

-- Service role has full access to invoices bucket
CREATE POLICY "Service role full access to invoices"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');
