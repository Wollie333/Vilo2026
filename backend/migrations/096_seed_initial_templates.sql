-- Migration: 096_seed_initial_templates.sql
-- Description: Seed initial website templates for property websites
-- Date: 2026-01-17

-- ============================================================================
-- SEED WEBSITE TEMPLATES
-- ============================================================================

-- Modern Hotel Template
INSERT INTO website_templates (
  name,
  description,
  category_id,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
)
SELECT
  'Modern Luxe',
  'A sleek, contemporary design with bold typography and immersive imagery perfect for luxury hotels and modern accommodations.',
  id,
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
  true,
  true
FROM template_categories
WHERE name = 'Hotel'
ON CONFLICT DO NOTHING;

-- Classic B&B Template
INSERT INTO website_templates (
  name,
  description,
  category_id,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
)
SELECT
  'Classic Elegance',
  'Timeless design with refined details, perfect for boutique bed & breakfasts and heritage properties.',
  id,
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
  jsonb_build_object(
    'features', jsonb_build_array(
      'Classic layout design',
      'Elegant typography',
      'Room showcase section',
      'Contact forms',
      'Guest testimonials',
      'Breakfast menu display',
      'Local attractions guide'
    ),
    'pages', jsonb_build_array('home', 'about', 'accommodation', 'contact', 'blog'),
    'layout', 'classic',
    'style', 'traditional'
  ),
  jsonb_build_object(
    'primaryColor', '#8B4513',
    'secondaryColor', '#2C1810',
    'accentColor', '#D4AF37',
    'fontFamily', 'Georgia, serif',
    'headingFont', 'Cormorant Garamond, serif'
  ),
  true,
  true
FROM template_categories
WHERE name = 'B&B'
ON CONFLICT DO NOTHING;

-- Minimal Villa Template
INSERT INTO website_templates (
  name,
  description,
  category_id,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
)
SELECT
  'Minimal Zen',
  'Clean, minimalist design that puts your villa imagery and content front and center with maximum impact.',
  id,
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
  jsonb_build_object(
    'features', jsonb_build_array(
      'Minimalist layout',
      'White space focus',
      'Fast loading speed',
      'Mobile-first design',
      'Simple navigation',
      'High-quality imagery',
      'Clean typography'
    ),
    'pages', jsonb_build_array('home', 'about', 'accommodation', 'contact'),
    'layout', 'minimal',
    'style', 'zen'
  ),
  jsonb_build_object(
    'primaryColor', '#1F2937',
    'secondaryColor', '#F3F4F6',
    'accentColor', '#047857',
    'fontFamily', 'Inter, sans-serif',
    'headingFont', 'Inter, sans-serif'
  ),
  true,
  false
FROM template_categories
WHERE name = 'Villa'
ON CONFLICT DO NOTHING;

-- Luxury Resort Template
INSERT INTO website_templates (
  name,
  description,
  category_id,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
)
SELECT
  'Luxury Resort',
  'Premium design for high-end resorts and exclusive accommodations featuring rich visuals and immersive experiences.',
  id,
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  jsonb_build_object(
    'features', jsonb_build_array(
      'Video background support',
      'Premium animations',
      '360° virtual tours',
      'Amenities showcase',
      'Multi-language support',
      'Spa & dining menus',
      'Activities calendar',
      'Concierge services'
    ),
    'pages', jsonb_build_array('home', 'about', 'accommodation', 'contact', 'blog'),
    'layout', 'luxury',
    'style', 'premium'
  ),
  jsonb_build_object(
    'primaryColor', '#1E3A8A',
    'secondaryColor', '#93C5FD',
    'accentColor', '#FBBF24',
    'fontFamily', 'Lato, sans-serif',
    'headingFont', 'Cinzel, serif'
  ),
  true,
  true
FROM template_categories
WHERE name = 'Resort'
ON CONFLICT DO NOTHING;

-- Cozy Guesthouse Template
INSERT INTO website_templates (
  name,
  description,
  category_id,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
)
SELECT
  'Cozy Haven',
  'Warm and welcoming design perfect for guesthouses, with a friendly and approachable aesthetic.',
  id,
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop',
  jsonb_build_object(
    'features', jsonb_build_array(
      'Warm color palette',
      'Friendly typography',
      'Room details & pricing',
      'Guest reviews section',
      'Local area guide',
      'House rules display',
      'Booking calendar'
    ),
    'pages', jsonb_build_array('home', 'about', 'accommodation', 'contact', 'blog'),
    'layout', 'cozy',
    'style', 'welcoming'
  ),
  jsonb_build_object(
    'primaryColor', '#DC2626',
    'secondaryColor', '#FEF2F2',
    'accentColor', '#F59E0B',
    'fontFamily', 'Open Sans, sans-serif',
    'headingFont', 'Merriweather, serif'
  ),
  true,
  false
FROM template_categories
WHERE name = 'Guesthouse'
ON CONFLICT DO NOTHING;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully seeded 5 initial website templates';
END $$;
