-- Migration: 112_create_template_sections_schema.sql
-- Description: Create schema for section-based homepage builder
-- Date: 2026-01-17

-- ============================================================================
-- CREATE TEMPLATE PAGE SECTIONS TABLE
-- ============================================================================

-- Table to store sections for each page of a property website
-- Sections can be reordered (sort_order), shown/hidden (is_visible),
-- and have different layout variants
CREATE TABLE IF NOT EXISTS template_page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to property website
  property_website_id UUID NOT NULL REFERENCES property_websites(id) ON DELETE CASCADE,

  -- Which page this section belongs to
  page_type VARCHAR(50) NOT NULL CHECK (page_type IN ('home', 'about', 'contact', 'accommodation', 'blog')),

  -- Section type (hero, features, rooms, reviews, cta, etc.)
  section_type VARCHAR(50) NOT NULL,

  -- User-friendly display name for the section
  section_name VARCHAR(200) NOT NULL,

  -- Order of sections on the page (for drag-and-drop)
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Whether the section is visible on the public website
  is_visible BOOLEAN NOT NULL DEFAULT true,

  -- Layout variant for this section (center, left-aligned, split-screen, grid, etc.)
  layout_variant VARCHAR(50) NOT NULL DEFAULT 'default',

  -- Section-specific content stored as JSONB
  -- Structure varies by section_type
  content JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fetching sections by website and page type
CREATE INDEX IF NOT EXISTS idx_template_page_sections_website_page
  ON template_page_sections(property_website_id, page_type);

-- Index for ordering sections
CREATE INDEX IF NOT EXISTS idx_template_page_sections_sort_order
  ON template_page_sections(property_website_id, page_type, sort_order);

-- Unique constraint: each sort_order must be unique per website per page
-- This ensures no two sections can have the same position
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_page_sections_unique_order
  ON template_page_sections(property_website_id, page_type, sort_order);

-- ============================================================================
-- FUNCTION: CREATE DEFAULT HOMEPAGE SECTIONS
-- ============================================================================

-- Function to create default sections when a website is activated
-- This will be called from the activateWebsite service method
CREATE OR REPLACE FUNCTION create_default_homepage_sections(p_property_website_id UUID)
RETURNS void AS $$
BEGIN
  -- Only create sections if none exist for this website's homepage
  IF NOT EXISTS (
    SELECT 1 FROM template_page_sections
    WHERE property_website_id = p_property_website_id
    AND page_type = 'home'
  ) THEN

    -- 1. Hero Section
    INSERT INTO template_page_sections (
      property_website_id, page_type, section_type, section_name,
      sort_order, is_visible, layout_variant, content
    ) VALUES (
      p_property_website_id,
      'home',
      'hero',
      'Hero Banner',
      1,
      true,
      'center',
      jsonb_build_object(
        'backgroundImage', null,
        'title', 'Welcome to Your Perfect Getaway',
        'subtitle', 'Discover comfort and luxury in every stay',
        'ctaButtonText', 'Book Now',
        'ctaButtonLink', '#rooms'
      )
    );

    -- 2. Features Section
    INSERT INTO template_page_sections (
      property_website_id, page_type, section_type, section_name,
      sort_order, is_visible, layout_variant, content
    ) VALUES (
      p_property_website_id,
      'home',
      'features',
      'Our Features',
      2,
      true,
      'grid-3col',
      jsonb_build_object(
        'title', 'Why Choose Us',
        'features', jsonb_build_array(
          jsonb_build_object(
            'icon', 'wifi',
            'title', 'Free WiFi',
            'description', 'Stay connected with high-speed internet throughout your stay'
          ),
          jsonb_build_object(
            'icon', 'utensils',
            'title', 'Delicious Breakfast',
            'description', 'Start your day with a complimentary breakfast buffet'
          ),
          jsonb_build_object(
            'icon', 'map-pin',
            'title', 'Prime Location',
            'description', 'Centrally located near major attractions and restaurants'
          )
        )
      )
    );

    -- 3. Rooms Section
    INSERT INTO template_page_sections (
      property_website_id, page_type, section_type, section_name,
      sort_order, is_visible, layout_variant, content
    ) VALUES (
      p_property_website_id,
      'home',
      'rooms',
      'Our Rooms',
      3,
      true,
      'grid',
      jsonb_build_object(
        'title', 'Comfortable Accommodations',
        'showPricing', true,
        'roomsToShow', 6
      )
    );

    -- 4. Reviews Section
    INSERT INTO template_page_sections (
      property_website_id, page_type, section_type, section_name,
      sort_order, is_visible, layout_variant, content
    ) VALUES (
      p_property_website_id,
      'home',
      'reviews',
      'Guest Reviews',
      4,
      true,
      'carousel',
      jsonb_build_object(
        'title', 'What Our Guests Say',
        'reviewsToShow', 6,
        'showRating', true
      )
    );

    -- 5. CTA Section
    INSERT INTO template_page_sections (
      property_website_id, page_type, section_type, section_name,
      sort_order, is_visible, layout_variant, content
    ) VALUES (
      p_property_website_id,
      'home',
      'cta',
      'Call to Action',
      5,
      true,
      'center',
      jsonb_build_object(
        'backgroundImage', null,
        'backgroundColor', '#047857',
        'title', 'Ready to Book Your Stay?',
        'subtitle', 'Experience exceptional hospitality and comfort',
        'buttonText', 'Check Availability',
        'buttonLink', '/booking'
      )
    );

  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE template_page_sections IS 'Stores customizable sections for property website pages with drag-and-drop ordering';
COMMENT ON COLUMN template_page_sections.section_type IS 'Type of section: hero, features, rooms, reviews, cta, gallery, location, etc.';
COMMENT ON COLUMN template_page_sections.layout_variant IS 'Layout variant: center, left-aligned, split-screen, grid-3col, carousel, etc.';
COMMENT ON COLUMN template_page_sections.content IS 'Section-specific content as JSONB. Structure varies by section_type.';
COMMENT ON FUNCTION create_default_homepage_sections IS 'Creates default sections for a new property website homepage';
