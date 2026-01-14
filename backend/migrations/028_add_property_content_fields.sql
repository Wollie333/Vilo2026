-- =====================================================
-- MIGRATION: 028_add_property_content_fields.sql
-- Description: Add content fields to properties for marketing/display
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ADD NEW CONTENT FIELDS TO PROPERTIES
-- =====================================================

-- Long description for detailed property information
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS long_description TEXT;

COMMENT ON COLUMN public.properties.long_description IS 'Detailed property description for property pages';

-- Excerpt for short summaries in listings
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS excerpt VARCHAR(500);

COMMENT ON COLUMN public.properties.excerpt IS 'Short summary for property cards and listings (max 500 chars)';

-- Featured image URL
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

COMMENT ON COLUMN public.properties.featured_image_url IS 'Main hero image URL for the property';

-- Property logo URL
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.properties.logo_url IS 'Property logo/brand image URL';

-- =====================================================
-- 2. CREATE STORAGE BUCKETS FOR PROPERTY IMAGES
-- =====================================================

-- Create bucket for property featured images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create bucket for property logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-logos',
    'property-logos',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- =====================================================
-- 3. STORAGE POLICIES FOR PROPERTY IMAGES
-- =====================================================

-- Property Images: Anyone can view
CREATE POLICY "Public can view property images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'property-images');

-- Property Images: Authenticated users can upload
CREATE POLICY "Authenticated users can upload property images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'property-images');

-- Property Images: Owners can update/delete
CREATE POLICY "Users can update their property images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'property-images');

CREATE POLICY "Users can delete their property images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'property-images');

-- Property Logos: Anyone can view
CREATE POLICY "Public can view property logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'property-logos');

-- Property Logos: Authenticated users can upload
CREATE POLICY "Authenticated users can upload property logos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'property-logos');

-- Property Logos: Owners can update/delete
CREATE POLICY "Users can update their property logos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'property-logos');

CREATE POLICY "Users can delete their property logos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'property-logos');

-- =====================================================
-- Done!
-- =====================================================
