-- Migration: 117_seed_serengeti_template_fixed.sql
-- Description: Seed Serengeti Lodge template data (adapted for existing schema)
-- Date: 2026-01-18

-- ============================================================================
-- CREATE TEMPLATE CATEGORY (IF NEEDED)
-- ============================================================================

-- Insert "Safari Lodge" category if it doesn't exist
INSERT INTO template_categories (name, slug, description, sort_order, is_active)
VALUES (
  'Safari Lodge',
  'safari-lodge',
  'Safari lodge and wilderness retreat templates',
  6,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- INSERT SERENGETI TEMPLATE
-- ============================================================================

-- First, clear any existing Serengeti template (in case of re-run)
DELETE FROM website_templates WHERE slug = 'serengeti-lodge';

-- Insert the template (using EXISTING schema columns)
INSERT INTO website_templates (
  name,
  slug,
  category_id,
  description,
  thumbnail_url,
  preview_url,
  config,
  default_theme,
  version,
  is_active,
  is_featured
)
SELECT
  'Serengeti Lodge',
  'serengeti-lodge',
  (SELECT id FROM template_categories WHERE slug = 'safari-lodge'),
  'Modern safari lodge template with clean design, generous whitespace, and subtle animations. Perfect for luxury lodges, boutique hotels, and safari properties.',
  '/templates/serengeti/preview.jpg',
  'https://serengeti-demo.vilo.com',
  '{}'::jsonb, -- Empty config for now
  '{"primaryColor": "#F97316", "secondaryColor": "#22c55e", "fontFamily": "Inter", "fonts": {"headingFont": "Inter", "bodyFont": "Inter"}}'::jsonb,
  '1.0.0',
  true,
  true;

-- ============================================================================
-- CREATE TEMPLATE PAGES
-- ============================================================================

DO $$
DECLARE
  v_template_id UUID;
  v_homepage_id UUID;
  v_about_id UUID;
  v_accommodation_id UUID;
  v_room_single_id UUID;
  v_contact_id UUID;
  v_blog_id UUID;
  v_post_single_id UUID;
  v_checkout_id UUID;
BEGIN
  -- Get the template ID
  SELECT id INTO v_template_id FROM website_templates WHERE slug = 'serengeti-lodge';

  -- Homepage
  INSERT INTO website_template_pages (template_id, page_type, title, slug, sort_order, is_default_enabled)
  VALUES (v_template_id, 'homepage', 'Home', '/', 1, true)
  RETURNING id INTO v_homepage_id;

  -- About
  INSERT INTO website_template_pages (template_id, page_type, title, slug, sort_order, is_default_enabled)
  VALUES (v_template_id, 'about', 'About Us', '/about', 2, true)
  RETURNING id INTO v_about_id;

  -- Accommodation
  INSERT INTO website_template_pages (template_id, page_type, title, slug, sort_order, is_default_enabled)
  VALUES (v_template_id, 'accommodation', 'Accommodation', '/accommodation', 3, true)
  RETURNING id INTO v_accommodation_id;

  -- Room Single
  INSERT INTO website_template_pages (template_id, page_type, title, slug, sort_order, is_default_enabled)
  VALUES (v_template_id, 'room-single', 'Room Details', '/rooms/:slug', 4, true)
  RETURNING id INTO v_room_single_id;

  -- Contact
  INSERT INTO website_template_pages (template_id, page_type, title, slug, sort_order, is_default_enabled)
  VALUES (v_template_id, 'contact', 'Contact Us', '/contact', 5, true)
  RETURNING id INTO v_contact_id;

  -- Blog
  INSERT INTO website_template_pages (template_id, page_type, title, slug, sort_order, is_default_enabled)
  VALUES (v_template_id, 'blog', 'Blog', '/blog', 6, true)
  RETURNING id INTO v_blog_id;

  -- Post Single
  INSERT INTO website_template_pages (template_id, page_type, title, slug, sort_order, is_default_enabled)
  VALUES (v_template_id, 'post-single', 'Blog Post', '/blog/:slug', 7, true)
  RETURNING id INTO v_post_single_id;

  -- Checkout
  INSERT INTO website_template_pages (template_id, page_type, title, slug, sort_order, is_default_enabled)
  VALUES (v_template_id, 'checkout', 'Checkout', '/checkout', 8, true)
  RETURNING id INTO v_checkout_id;

  -- ============================================================================
  -- CREATE HOMEPAGE SECTIONS
  -- ============================================================================

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_homepage_id,
    'serengeti-hero-fullscreen',
    'Hero Section',
    1,
    '{"heading": "{property.name}", "subheading": "Experience luxury in the wild", "ctaText": "Discover Now", "ctaLink": "/accommodation", "backgroundImage": "{property.hero_image}", "showSearchWidget": true, "overlayOpacity": 50}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_homepage_id,
    'serengeti-features-3col',
    'Why Choose Us',
    2,
    '{"sectionTitle": "Why Choose Us", "sectionSubtitle": "Experience the best safari adventure", "features": [{"icon": "compass", "title": "Expert Guides", "description": "Our experienced guides ensure unforgettable wildlife encounters"}, {"icon": "star", "title": "Luxury Accommodation", "description": "Elegant rooms with stunning views and modern amenities"}, {"icon": "heart", "title": "Personalized Service", "description": "Tailored experiences to match your preferences"}]}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_homepage_id,
    'serengeti-room-cards',
    'Featured Rooms',
    3,
    '{"sectionTitle": "Our Accommodations", "sectionSubtitle": "Comfortable, elegant rooms with stunning views", "showAllRooms": true, "columns": 3, "showPricing": true}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_homepage_id,
    'serengeti-testimonials',
    'What Guests Say',
    4,
    '{"sectionTitle": "Guest Testimonials", "testimonials": [{"quote": "An absolutely magical experience! The staff was incredible and the wildlife viewing was beyond our expectations.", "author": "Sarah Mitchell", "role": "Guest from USA", "rating": 5}, {"quote": "The perfect blend of luxury and adventure. Every detail was thoughtfully arranged.", "author": "James Chen", "role": "Guest from Singapore", "rating": 5}, {"quote": "Our stay exceeded all expectations. The rooms were beautiful and the safari experiences unforgettable.", "author": "Emma Thompson", "role": "Guest from UK", "rating": 5}], "autoplay": true}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_homepage_id,
    'serengeti-cta-banner',
    'Book Your Adventure',
    5,
    '{"heading": "Ready for Your Safari Adventure?", "subheading": "Book your stay today and experience the magic of the wild", "ctaText": "Book Now", "ctaLink": "/accommodation", "backgroundImage": "", "variant": "fullwidth"}'::jsonb
  );

  -- ============================================================================
  -- CREATE ABOUT PAGE SECTIONS
  -- ============================================================================

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_about_id,
    'serengeti-hero-left',
    'About Hero',
    1,
    '{"heading": "About {property.name}", "subheading": "Discover our story", "ctaText": "Contact Us", "ctaLink": "/contact", "backgroundImage": "", "overlayOpacity": 40}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_about_id,
    'serengeti-about-intro',
    'Our Story',
    2,
    '{"heading": "Our Story", "content": "Welcome to our lodge, where luxury meets wilderness. For over a decade, we have been providing guests with unforgettable safari experiences in the heart of nature."}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_about_id,
    'serengeti-story-left',
    'Our Mission',
    3,
    '{"heading": "Our Mission", "content": "We are committed to providing exceptional safari experiences while preserving the natural environment and supporting local communities.", "imageUrl": "", "imagePosition": "left"}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_about_id,
    'serengeti-values-grid',
    'Our Values',
    4,
    '{"sectionTitle": "Our Core Values", "values": [{"icon": "leaf", "title": "Sustainability", "description": "We are committed to eco-friendly practices"}, {"icon": "users", "title": "Community", "description": "Supporting local communities and conservation"}, {"icon": "award", "title": "Excellence", "description": "Delivering exceptional experiences"}]}'::jsonb
  );

  -- ============================================================================
  -- CREATE ACCOMMODATION PAGE SECTIONS
  -- ============================================================================

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_accommodation_id,
    'serengeti-hero-left',
    'Accommodation Hero',
    1,
    '{"heading": "Our Accommodations", "subheading": "Luxury rooms with breathtaking views", "ctaText": "View Rooms", "ctaLink": "#rooms", "backgroundImage": "", "overlayOpacity": 40}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_accommodation_id,
    'serengeti-room-cards',
    'All Rooms',
    2,
    '{"sectionTitle": "Choose Your Perfect Room", "sectionSubtitle": "Each room offers comfort and stunning views", "showAllRooms": true, "columns": 3, "showPricing": true}'::jsonb
  );

  -- ============================================================================
  -- CREATE CONTACT PAGE SECTIONS
  -- ============================================================================

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_contact_id,
    'serengeti-hero-left',
    'Contact Hero',
    1,
    '{"heading": "Get in Touch", "subheading": "We''d love to hear from you", "ctaText": "Send Message", "ctaLink": "#contact-form", "backgroundImage": "", "overlayOpacity": 40}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_contact_id,
    'serengeti-contact-info',
    'Contact Information',
    2,
    '{"sectionTitle": "Contact Information", "showAddress": true, "showPhone": true, "showEmail": true, "showHours": true}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_contact_id,
    'serengeti-contact-form',
    'Contact Form',
    3,
    '{"sectionTitle": "Send Us a Message", "sectionSubtitle": "Fill out the form below and we will get back to you", "showPhoneField": true, "showCompanyField": false, "submitButtonText": "Send Message"}'::jsonb
  );

  -- ============================================================================
  -- CREATE BLOG PAGE SECTIONS
  -- ============================================================================

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_blog_id,
    'serengeti-hero-left',
    'Blog Hero',
    1,
    '{"heading": "Our Blog", "subheading": "Stories and insights from the wild", "ctaText": "Read More", "ctaLink": "#posts", "backgroundImage": "", "overlayOpacity": 40}'::jsonb
  );

  INSERT INTO website_template_page_sections (template_page_id, section_type, section_name, sort_order, content)
  VALUES (
    v_blog_id,
    'serengeti-blog-cards',
    'Blog Posts',
    2,
    '{"sectionTitle": "Latest Posts", "sectionSubtitle": "Discover our stories and travel tips", "showAllPosts": true, "columns": 3, "postsPerPage": 9}'::jsonb
  );

  -- Note: Room single, post single, and checkout pages have no preset sections

  RAISE NOTICE '✅ Serengeti template seeded successfully!';
  RAISE NOTICE 'Template ID: %', v_template_id;
  RAISE NOTICE 'Total Pages: 8';
  RAISE NOTICE 'Total Sections: 18';

END $$;
