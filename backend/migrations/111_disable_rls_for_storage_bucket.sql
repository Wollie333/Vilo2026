-- Migration: 111_disable_rls_for_storage_bucket.sql
-- Description: Disable RLS enforcement for property-website-assets bucket
-- Date: 2026-01-17
-- Note: This bucket is public, so we allow all authenticated users to upload

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "property_assets_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_assets_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_assets_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_assets_select_policy" ON storage.objects;

-- ============================================================================
-- CREATE PERMISSIVE POLICIES
-- ============================================================================

-- Allow anyone (authenticated or not) to SELECT from this bucket
CREATE POLICY "property_assets_public_select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'property-website-assets'
);

-- Allow authenticated users to INSERT into this bucket
CREATE POLICY "property_assets_auth_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-website-assets'
);

-- Allow authenticated users to UPDATE in this bucket
CREATE POLICY "property_assets_auth_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'property-website-assets')
WITH CHECK (bucket_id = 'property-website-assets');

-- Allow authenticated users to DELETE from this bucket
CREATE POLICY "property_assets_auth_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-website-assets'
);

-- ============================================================================
-- ENSURE RLS IS ENABLED ON STORAGE.OBJECTS
-- ============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if RLS is enabled
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'property_assets%';

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Storage Configuration Status';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RLS Enabled on storage.objects: %', rls_enabled;
  RAISE NOTICE 'Active policies for property-website-assets: %', policy_count;

  IF rls_enabled AND policy_count = 4 THEN
    RAISE NOTICE '✓ Storage configuration successful';
  ELSE
    RAISE WARNING '⚠ Configuration incomplete - RLS: %, Policies: %', rls_enabled, policy_count;
  END IF;
  RAISE NOTICE '===========================================';
END $$;
