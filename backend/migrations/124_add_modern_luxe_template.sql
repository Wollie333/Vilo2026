-- Migration: 124_add_modern_luxe_template.sql
-- Description: Add Modern Luxe template using new schema (category VARCHAR)
-- Date: 2026-01-18

-- ============================================================================
-- ADD MODERN LUXE TEMPLATE
-- ============================================================================

-- Delete any existing Modern Luxe (in case of re-run)
DELETE FROM website_templates WHERE name = 'Modern Luxe';

-- Insert Modern Luxe template with new schema (category as VARCHAR)
INSERT INTO website_templates (
  name,
  category,
  description,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
)
VALUES (
  'Modern Luxe',
  'Hotel',
  'A sleek, contemporary design with bold typography and immersive imagery perfect for luxury hotels and modern accommodations.',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  jsonb_build_object(
    'features', jsonb_build_array(
      'Full-width hero section',
      'Parallax scrolling effects',
      'Photo gallery grid',
      'Integrated booking widget',
      'Blog & news section',
      'Testimonials carousel',
      'Google Maps integration'
    ),
    'pages', jsonb_build_array('home', 'about', 'accommodation', 'contact', 'blog'),
    'layout', 'modern',
    'style', 'contemporary'
  ),
  jsonb_build_object(
    'primaryColor', '#047857',
    'secondaryColor', '#000000',
    'accentColor', '#F59E0B',
    'fontFamily', 'Inter, sans-serif',
    'headingFont', 'Playfair Display, serif'
  ),
  true,  -- is_active
  true   -- is_featured
);

-- Log completion
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count
  FROM website_templates
  WHERE is_active = true;

  RAISE NOTICE 'Modern Luxe template added successfully';
  RAISE NOTICE 'Total active templates: %', template_count;
END $$;

-- Verify both templates exist
SELECT
  name,
  category,
  is_active,
  is_featured
FROM website_templates
ORDER BY name;
