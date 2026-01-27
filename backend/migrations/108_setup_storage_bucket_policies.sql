-- Migration: 108_setup_storage_bucket_policies.sql
-- Description: Set up RLS policies for property-website-assets storage bucket
-- Date: 2026-01-17

-- ============================================================================
-- STORAGE BUCKET RLS POLICIES
-- ============================================================================

-- Note: The bucket should already exist in Supabase Storage.
-- If it doesn't exist, create it in Supabase Dashboard:
--   1. Go to Storage → Create bucket
--   2. Name: property-website-assets
--   3. Public: Yes (for public read access)

-- ============================================================================
-- ALLOW AUTHENTICATED USERS TO UPLOAD TO THEIR OWN PROPERTY FOLDERS
-- ============================================================================

-- Policy: Allow authenticated users to insert files
CREATE POLICY "Allow authenticated users to upload property assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-website-assets'
  AND (storage.foldername(name))[1] IN (
    -- Allow upload if the folder name matches a property_id assigned to the user
    SELECT up.property_id::text
    FROM user_properties up
    WHERE up.user_id = auth.uid()
  )
);

-- ============================================================================
-- ALLOW AUTHENTICATED USERS TO UPDATE THEIR OWN PROPERTY FILES
-- ============================================================================

-- Policy: Allow authenticated users to update/replace files
CREATE POLICY "Allow authenticated users to update property assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-website-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT up.property_id::text
    FROM user_properties up
    WHERE up.user_id = auth.uid()
  )
);

-- ============================================================================
-- ALLOW AUTHENTICATED USERS TO DELETE THEIR OWN PROPERTY FILES
-- ============================================================================

-- Policy: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete property assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-website-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT up.property_id::text
    FROM user_properties up
    WHERE up.user_id = auth.uid()
  )
);

-- ============================================================================
-- ALLOW PUBLIC READ ACCESS TO ALL ASSETS
-- ============================================================================

-- Policy: Allow public to read all files in this bucket
CREATE POLICY "Allow public to read property assets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'property-website-assets'
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%property assets%';

  RAISE NOTICE 'Created % RLS policies for property-website-assets bucket', policy_count;

  IF policy_count >= 4 THEN
    RAISE NOTICE '✓ Storage bucket policies successfully created';
  ELSE
    RAISE WARNING '⚠ Expected 4 policies, found %', policy_count;
  END IF;
END $$;
