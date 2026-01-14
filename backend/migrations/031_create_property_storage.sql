-- Migration: 031_create_property_storage.sql
-- Description: Create storage buckets and policies for property images and logos
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================
-- 1. CREATE THE PROPERTY-IMAGES BUCKET
-- ============================================

-- Insert the bucket into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,  -- Public bucket (images can be accessed via URL)
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 2. CREATE THE PROPERTY-LOGOS BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-logos',
  'property-logos',
  true,  -- Public bucket (logos can be accessed via URL)
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- ============================================
-- 3. STORAGE POLICIES FOR PROPERTY-IMAGES
-- ============================================

-- Policy: Allow service role full access (for backend operations via admin client)
DROP POLICY IF EXISTS "Service role full access to property-images" ON storage.objects;
CREATE POLICY "Service role full access to property-images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'property-images')
WITH CHECK (bucket_id = 'property-images');

-- Policy: Allow public read access to all property images (since bucket is public)
DROP POLICY IF EXISTS "Public read access for property-images" ON storage.objects;
CREATE POLICY "Public read access for property-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Policy: Allow authenticated users to upload to property-images
-- Path pattern: {property_id}/{filename} or {property_id}/gallery/{filename}
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Policy: Allow authenticated users to update property images
DROP POLICY IF EXISTS "Authenticated users can update property images" ON storage.objects;
CREATE POLICY "Authenticated users can update property images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images')
WITH CHECK (bucket_id = 'property-images');

-- Policy: Allow authenticated users to delete property images
DROP POLICY IF EXISTS "Authenticated users can delete property images" ON storage.objects;
CREATE POLICY "Authenticated users can delete property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');

-- ============================================
-- 4. STORAGE POLICIES FOR PROPERTY-LOGOS
-- ============================================

-- Policy: Allow service role full access (for backend operations via admin client)
DROP POLICY IF EXISTS "Service role full access to property-logos" ON storage.objects;
CREATE POLICY "Service role full access to property-logos"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'property-logos')
WITH CHECK (bucket_id = 'property-logos');

-- Policy: Allow public read access to all property logos (since bucket is public)
DROP POLICY IF EXISTS "Public read access for property-logos" ON storage.objects;
CREATE POLICY "Public read access for property-logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-logos');

-- Policy: Allow authenticated users to upload to property-logos
DROP POLICY IF EXISTS "Authenticated users can upload property logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload property logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-logos');

-- Policy: Allow authenticated users to update property logos
DROP POLICY IF EXISTS "Authenticated users can update property logos" ON storage.objects;
CREATE POLICY "Authenticated users can update property logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'property-logos')
WITH CHECK (bucket_id = 'property-logos');

-- Policy: Allow authenticated users to delete property logos
DROP POLICY IF EXISTS "Authenticated users can delete property logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete property logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-logos');

-- ============================================
-- NOTES
-- ============================================
--
-- After running this migration:
-- 1. Go to Supabase Dashboard > Storage
-- 2. You should see 'property-images' and 'property-logos' buckets listed
-- 3. Both buckets should be marked as 'Public'
--
-- Property Image URL format:
-- https://<project-ref>.supabase.co/storage/v1/object/public/property-images/<property-id>/<timestamp>.jpg
--
-- Gallery Image URL format:
-- https://<project-ref>.supabase.co/storage/v1/object/public/property-images/<property-id>/gallery/<timestamp>.jpg
--
-- Property Logo URL format:
-- https://<project-ref>.supabase.co/storage/v1/object/public/property-logos/<property-id>/<timestamp>.png
