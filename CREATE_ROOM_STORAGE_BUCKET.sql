-- Create room-images storage bucket and policies
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- ============================================
-- 1. CREATE THE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 2. CREATE RLS POLICIES (drop first if exists)
-- ============================================

-- Service role policy
DROP POLICY IF EXISTS "Service role full access to room-images" ON storage.objects;
CREATE POLICY "Service role full access to room-images"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'room-images')
WITH CHECK (bucket_id = 'room-images');

-- Public read policy
DROP POLICY IF EXISTS "Public read access for room-images" ON storage.objects;
CREATE POLICY "Public read access for room-images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'room-images');

-- Authenticated upload policy
DROP POLICY IF EXISTS "Authenticated users can upload room images" ON storage.objects;
CREATE POLICY "Authenticated users can upload room images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'room-images');

-- Authenticated update policy
DROP POLICY IF EXISTS "Authenticated users can update room images" ON storage.objects;
CREATE POLICY "Authenticated users can update room images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'room-images')
WITH CHECK (bucket_id = 'room-images');

-- Authenticated delete policy
DROP POLICY IF EXISTS "Authenticated users can delete room images" ON storage.objects;
CREATE POLICY "Authenticated users can delete room images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'room-images');

-- Success message
SELECT 'Room storage bucket created successfully!' AS message;
