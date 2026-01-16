-- Migration: 050_create_review_storage_policies_only.sql
-- Description: Create RLS policies for review-photos storage bucket
-- Date: 2026-01-11
--
-- NOTE: The storage bucket itself should be created manually via Supabase Dashboard
--       due to permission restrictions in SQL Editor.
--       This file only contains the RLS policies.

-- ============================================================================
-- STORAGE POLICIES FOR REVIEW PHOTOS
-- ============================================================================

-- Anyone can view review photos (public access)
CREATE POLICY "Anyone can view review photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

-- Authenticated users can upload review photos
CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-photos' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own review photos
CREATE POLICY "Users can update their own review photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'review-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'review-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own review photos
CREATE POLICY "Users can delete their own review photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all review photos
CREATE POLICY "Admins can manage all review photos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'review-photos' AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'property_admin')
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================

-- Storage structure:
-- /review-photos/{user_id}/{review_id}/{timestamp}_{filename}.{ext}
--
-- Example:
-- /review-photos/550e8400-e29b-41d4-a716-446655440000/7d3a4b2c-1234-5678-abcd-ef1234567890/1704963200000_vacation_photo_1.jpg
--
-- This structure ensures:
-- 1. Photos are organized by user and review
-- 2. Unique filenames prevent collisions (timestamp + original filename)
-- 3. RLS policies can verify ownership via user_id in path
-- 4. Easy cleanup when reviews are deleted (cascade via review_id)
