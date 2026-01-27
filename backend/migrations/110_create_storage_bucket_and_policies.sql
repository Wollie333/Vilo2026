-- Migration: 110_create_storage_bucket_and_policies.sql
-- Description: Create storage bucket and set up RLS policies (complete setup)
-- Date: 2026-01-17

-- ============================================================================
-- CREATE STORAGE BUCKET (if it doesn't exist)
-- ============================================================================

-- Insert bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-website-assets',
  'property-website-assets',
  true,  -- Public bucket for read access
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon']::text[];

-- ============================================================================
-- DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to upload property assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update property assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete property assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read property assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can read assets" ON storage.objects;

-- ============================================================================
-- CREATE NEW SIMPLIFIED POLICIES
-- ============================================================================

-- Allow authenticated users to INSERT (upload) files
CREATE POLICY "property_assets_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-website-assets'
);

-- Allow authenticated users to UPDATE (replace) files
CREATE POLICY "property_assets_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-website-assets'
);

-- Allow authenticated users to DELETE files
CREATE POLICY "property_assets_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-website-assets'
);

-- Allow public to SELECT (read) all files
CREATE POLICY "property_assets_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'property-website-assets'
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  bucket_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'property-website-assets'
  ) INTO bucket_exists;

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'property_assets%';

  IF bucket_exists THEN
    RAISE NOTICE '✓ Bucket "property-website-assets" exists';
  ELSE
    RAISE WARNING '⚠ Bucket "property-website-assets" not found';
  END IF;

  RAISE NOTICE 'Active storage policies: %', policy_count;

  IF policy_count = 4 THEN
    RAISE NOTICE '✓ All 4 storage policies created successfully';
  ELSE
    RAISE WARNING '⚠ Expected 4 policies, found %', policy_count;
  END IF;
END $$;
