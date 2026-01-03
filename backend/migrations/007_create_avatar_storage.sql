-- Migration: 007_create_avatar_storage.sql
-- Description: Create storage bucket and policies for user avatars
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================
-- 1. CREATE THE AVATARS BUCKET
-- ============================================

-- Insert the bucket into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket (images can be accessed via URL)
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 2. CREATE STORAGE POLICIES
-- ============================================

-- Policy: Allow authenticated users to upload avatars to their own folder
-- Path pattern: {user_id}/{filename}
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all avatars (since bucket is public)
CREATE POLICY "Public read access for avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "Service role full access to avatars"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- ============================================
-- NOTES
-- ============================================
--
-- After running this migration:
-- 1. Go to Supabase Dashboard > Storage
-- 2. You should see the 'avatars' bucket listed
-- 3. The bucket should be marked as 'Public'
--
-- Avatar URL format will be:
-- https://<project-ref>.supabase.co/storage/v1/object/public/avatars/<user-id>/<timestamp>.jpg
--
-- If you need to drop and recreate policies (for troubleshooting):
--
-- DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Service role full access to avatars" ON storage.objects;
