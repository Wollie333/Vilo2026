-- Migration: 097_add_simple_templates.sql
-- Description: Add simplified template system to existing property_websites
-- Date: 2026-01-17

-- ============================================================================
-- TEMPLATE CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- WEBSITE TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.website_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- Simple string: 'hotel', 'bb', 'villa', 'guesthouse', 'resort'
  preview_image_url TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ADD TEMPLATE_ID TO PROPERTY_WEBSITES (if column doesn't exist)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'property_websites'
    AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.property_websites
    ADD COLUMN template_id UUID REFERENCES public.website_templates(id) ON DELETE SET NULL;

    RAISE NOTICE 'Added template_id column to property_websites';
  ELSE
    RAISE NOTICE 'template_id column already exists in property_websites';
  END IF;
END $$;

-- ============================================================================
-- SEED INITIAL TEMPLATES
-- ============================================================================

-- Modern Hotel Template
INSERT INTO website_templates (
  name,
  description,
  category,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
) VALUES (
  'Modern Luxe',
  'A sleek, contemporary design with bold typography and immersive imagery perfect for luxury hotels and modern accommodations.',
  'hotel',
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
)
ON CONFLICT DO NOTHING;

-- Classic B&B Template
INSERT INTO website_templates (
  name,
  description,
  category,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
) VALUES (
  'Classic Elegance',
  'Timeless design with refined details, perfect for boutique bed & breakfasts and heritage properties.',
  'bb',
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
)
ON CONFLICT DO NOTHING;

-- Minimal Villa Template
INSERT INTO website_templates (
  name,
  description,
  category,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
) VALUES (
  'Minimal Zen',
  'Clean, minimalist design that puts your villa imagery and content front and center with maximum impact.',
  'villa',
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
)
ON CONFLICT DO NOTHING;

-- Luxury Resort Template
INSERT INTO website_templates (
  name,
  description,
  category,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
) VALUES (
  'Luxury Resort',
  'Premium design for high-end resorts and exclusive accommodations featuring rich visuals and immersive experiences.',
  'resort',
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
)
ON CONFLICT DO NOTHING;

-- Cozy Guesthouse Template
INSERT INTO website_templates (
  name,
  description,
  category,
  preview_image_url,
  config,
  default_theme,
  is_active,
  is_featured
) VALUES (
  'Cozy Haven',
  'Warm and welcoming design perfect for guesthouses, with a friendly and approachable aesthetic.',
  'guesthouse',
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
)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created template tables and seeded 5 templates';
END $$;
