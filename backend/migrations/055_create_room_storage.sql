-- Migration: 055_create_room_storage.sql
-- Description: Create storage bucket and policies for room images
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================
-- 1. CREATE THE ROOM-IMAGES BUCKET
-- ============================================

-- Insert the bucket into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,  -- Public bucket (images can be accessed via URL)
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 2. STORAGE POLICIES FOR ROOM-IMAGES
-- ============================================

-- Policy: Allow service role full access (for backend operations via admin client)
DROP POLICY IF EXISTS "Service role full access to room-images" ON storage.objects;
CREATE POLICY "Service role full access to room-images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'room-images')
WITH CHECK (bucket_id = 'room-images');

-- Policy: Allow public read access to all room images (since bucket is public)
DROP POLICY IF EXISTS "Public read access for room-images" ON storage.objects;
CREATE POLICY "Public read access for room-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'room-images');

-- Policy: Allow authenticated users to upload to room-images
-- Path pattern: {room_id}/{filename} or {room_id}/gallery/{filename}
DROP POLICY IF EXISTS "Authenticated users can upload room images" ON storage.objects;
CREATE POLICY "Authenticated users can upload room images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'room-images');

-- Policy: Allow authenticated users to update room images
DROP POLICY IF EXISTS "Authenticated users can update room images" ON storage.objects;
CREATE POLICY "Authenticated users can update room images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'room-images')
WITH CHECK (bucket_id = 'room-images');

-- Policy: Allow authenticated users to delete room images
DROP POLICY IF EXISTS "Authenticated users can delete room images" ON storage.objects;
CREATE POLICY "Authenticated users can delete room images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'room-images');

-- ============================================
-- NOTES
-- ============================================
--
-- After running this migration:
-- 1. Go to Supabase Dashboard > Storage
-- 2. You should see 'room-images' bucket listed
-- 3. The bucket should be marked as 'Public'
--
-- Room Featured Image URL format:
-- https://<project-ref>.supabase.co/storage/v1/object/public/room-images/<room-id>/<timestamp>.jpg
--
-- Room Gallery Image URL format:
-- https://<project-ref>.supabase.co/storage/v1/object/public/room-images/<room-id>/gallery/<timestamp>.jpg
--

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 055 completed: Created room-images storage bucket with RLS policies';
END $$;
