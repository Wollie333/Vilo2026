-- Migration: 109_simplify_storage_policies.sql
-- Description: Simplify storage bucket policies - allow all authenticated users
-- Date: 2026-01-17

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to upload property assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update property assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete property assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read property assets" ON storage.objects;

-- ============================================================================
-- CREATE SIMPLIFIED POLICIES
-- ============================================================================

-- Policy: Allow ALL authenticated users to insert files
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-website-assets'
);

-- Policy: Allow ALL authenticated users to update files
CREATE POLICY "Authenticated users can update assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-website-assets'
);

-- Policy: Allow ALL authenticated users to delete files
CREATE POLICY "Authenticated users can delete assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-website-assets'
);

-- Policy: Allow public to read all files
CREATE POLICY "Public can read assets"
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
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname IN (
    'Authenticated users can upload assets',
    'Authenticated users can update assets',
    'Authenticated users can delete assets',
    'Public can read assets'
  );

  RAISE NOTICE 'Active storage policies: %', policy_count;

  IF policy_count = 4 THEN
    RAISE NOTICE '✓ All 4 storage policies successfully created';
  ELSE
    RAISE WARNING '⚠ Expected 4 policies, found %', policy_count;
  END IF;
END $$;
