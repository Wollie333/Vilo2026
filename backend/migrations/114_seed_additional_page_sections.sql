-- Migration: 114_seed_additional_page_sections.sql
-- Description: Add default sections for About, Contact, and Accommodation pages
-- Date: 2026-01-18

-- ============================================================================
-- ABOUT PAGE SECTIONS
-- ============================================================================

-- Story Section (hero-style with image and text)
INSERT INTO template_page_sections (
  property_website_id,
  page_type,
  section_type,
  section_name,
  layout_variant,
  sort_order,
  is_visible,
  content
)
SELECT
  id as property_website_id,
  'about' as page_type,
  'story' as section_type,
  'Our Story' as section_name,
  'split-left' as layout_variant,
  1 as sort_order,
  true as is_visible,
  jsonb_build_object(
    'title', 'Welcome to Our Story',
    'subtitle', 'Discover the history and passion behind our property',
    'content', 'Share your unique story here. Tell guests about the history of your property, what makes it special, and why they should choose you for their stay.',
    'image', NULL,
    'imagePosition', 'left'
  ) as content
FROM property_websites
WHERE NOT EXISTS (
  SELECT 1 FROM template_page_sections
  WHERE property_website_id = property_websites.id
  AND page_type = 'about'
  AND section_type = 'story'
);

-- Values Section (grid of core values)
INSERT INTO template_page_sections (
  property_website_id,
  page_type,
  section_type,
  section_name,
  layout_variant,
  sort_order,
  is_visible,
  content
)
SELECT
  id as property_website_id,
  'about' as page_type,
  'values' as section_type,
  'Our Values' as section_name,
  'grid-3col' as layout_variant,
  2 as sort_order,
  true as is_visible,
  jsonb_build_object(
    'title', 'What We Stand For',
    'values', jsonb_build_array(
      jsonb_build_object(
        'icon', 'heart',
        'title', 'Hospitality',
        'description', 'We treat every guest like family'
      ),
      jsonb_build_object(
        'icon', 'star',
        'title', 'Quality',
        'description', 'Excellence in every detail'
      ),
      jsonb_build_object(
        'icon', 'shield',
        'title', 'Trust',
        'description', 'Your comfort is our priority'
      )
    )
  ) as content
FROM property_websites
WHERE NOT EXISTS (
  SELECT 1 FROM template_page_sections
  WHERE property_website_id = property_websites.id
  AND page_type = 'about'
  AND section_type = 'values'
);

-- Location Section
INSERT INTO template_page_sections (
  property_website_id,
  page_type,
  section_type,
  section_name,
  layout_variant,
  sort_order,
  is_visible,
  content
)
SELECT
  id as property_website_id,
  'about' as page_type,
  'location' as section_type,
  'Our Location' as section_name,
  'map-left' as layout_variant,
  3 as sort_order,
  true as is_visible,
  jsonb_build_object(
    'title', 'Find Us Here',
    'description', 'Conveniently located with easy access to local attractions',
    'showMap', true
  ) as content
FROM property_websites
WHERE NOT EXISTS (
  SELECT 1 FROM template_page_sections
  WHERE property_website_id = property_websites.id
  AND page_type = 'about'
  AND section_type = 'location'
);

-- ============================================================================
-- CONTACT PAGE SECTIONS
-- ============================================================================

-- Contact Info Section
INSERT INTO template_page_sections (
  property_website_id,
  page_type,
  section_type,
  section_name,
  layout_variant,
  sort_order,
  is_visible,
  content
)
SELECT
  id as property_website_id,
  'contact' as page_type,
  'contact-info' as section_type,
  'Contact Information' as section_name,
  'grid' as layout_variant,
  1 as sort_order,
  true as is_visible,
  jsonb_build_object(
    'title', 'Get In Touch',
    'subtitle', 'We''d love to hear from you',
    'showPhone', true,
    'showEmail', true,
    'showAddress', true,
    'showSocial', true
  ) as content
FROM property_websites
WHERE NOT EXISTS (
  SELECT 1 FROM template_page_sections
  WHERE property_website_id = property_websites.id
  AND page_type = 'contact'
  AND section_type = 'contact-info'
);

-- Contact Form Section
INSERT INTO template_page_sections (
  property_website_id,
  page_type,
  section_type,
  section_name,
  layout_variant,
  sort_order,
  is_visible,
  content
)
SELECT
  id as property_website_id,
  'contact' as page_type,
  'contact-form' as section_type,
  'Contact Form' as section_name,
  'simple' as layout_variant,
  2 as sort_order,
  true as is_visible,
  jsonb_build_object(
    'title', 'Send Us a Message',
    'subtitle', 'Fill out the form below and we''ll get back to you soon',
    'requirePhone', false
  ) as content
FROM property_websites
WHERE NOT EXISTS (
  SELECT 1 FROM template_page_sections
  WHERE property_website_id = property_websites.id
  AND page_type = 'contact'
  AND section_type = 'contact-form'
);

-- Map Section
INSERT INTO template_page_sections (
  property_website_id,
  page_type,
  section_type,
  section_name,
  layout_variant,
  sort_order,
  is_visible,
  content
)
SELECT
  id as property_website_id,
  'contact' as page_type,
  'map' as section_type,
  'Location Map' as section_name,
  'full-width' as layout_variant,
  3 as sort_order,
  true as is_visible,
  jsonb_build_object(
    'title', 'Visit Us',
    'showDirections', true,
    'mapHeight', '400px'
  ) as content
FROM property_websites
WHERE NOT EXISTS (
  SELECT 1 FROM template_page_sections
  WHERE property_website_id = property_websites.id
  AND page_type = 'contact'
  AND section_type = 'map'
);

-- ============================================================================
-- ACCOMMODATION PAGE SECTIONS
-- ============================================================================

-- Intro Section
INSERT INTO template_page_sections (
  property_website_id,
  page_type,
  section_type,
  section_name,
  layout_variant,
  sort_order,
  is_visible,
  content
)
SELECT
  id as property_website_id,
  'accommodation' as page_type,
  'intro' as section_type,
  'Introduction' as section_name,
  'center' as layout_variant,
  1 as sort_order,
  true as is_visible,
  jsonb_build_object(
    'title', 'Our Accommodations',
    'subtitle', 'Find Your Perfect Stay',
    'content', 'Discover our range of comfortable and well-appointed rooms designed for your perfect stay. Each room features modern amenities and thoughtful touches to make you feel at home.'
  ) as content
FROM property_websites
WHERE NOT EXISTS (
  SELECT 1 FROM template_page_sections
  WHERE property_website_id = property_websites.id
  AND page_type = 'accommodation'
  AND section_type = 'intro'
);

-- Amenities Section
INSERT INTO template_page_sections (
  property_website_id,
  page_type,
  section_type,
  section_name,
  layout_variant,
  sort_order,
  is_visible,
  content
)
SELECT
  id as property_website_id,
  'accommodation' as page_type,
  'amenities' as section_type,
  'Amenities' as section_name,
  'grid-4col' as layout_variant,
  2 as sort_order,
  true as is_visible,
  jsonb_build_object(
    'title', 'Room Amenities',
    'amenities', jsonb_build_array(
      jsonb_build_object('icon', 'wifi', 'label', 'Free WiFi'),
      jsonb_build_object('icon', 'tv', 'label', 'Flat Screen TV'),
      jsonb_build_object('icon', 'coffee', 'label', 'Coffee Maker'),
      jsonb_build_object('icon', 'air-conditioner', 'label', 'Air Conditioning'),
      jsonb_build_object('icon', 'safe', 'label', 'In-room Safe'),
      jsonb_build_object('icon', 'shower', 'label', 'Private Bathroom'),
      jsonb_build_object('icon', 'bed', 'label', 'Premium Bedding'),
      jsonb_build_object('icon', 'desk', 'label', 'Work Desk')
    )
  ) as content
FROM property_websites
WHERE NOT EXISTS (
  SELECT 1 FROM template_page_sections
  WHERE property_website_id = property_websites.id
  AND page_type = 'accommodation'
  AND section_type = 'amenities'
);

-- Note: Rooms section will be automatically rendered from database rooms
-- No need to create a rooms section entry

COMMENT ON COLUMN template_page_sections.section_type IS 'Section types: hero, features, rooms, reviews, cta, story, values, location, contact-info, contact-form, map, intro, amenities';
