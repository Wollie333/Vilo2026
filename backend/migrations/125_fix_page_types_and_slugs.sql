-- Migration: 125_fix_page_types_and_slugs.sql
-- Description: Add missing page types to enum and fix Serengeti template slugs
-- Date: 2026-01-18

-- ============================================================================
-- ADD MISSING PAGE TYPES TO ENUM
-- ============================================================================

-- Add new page types to the enum
ALTER TYPE website_page_type ADD VALUE IF NOT EXISTS 'room-single';
ALTER TYPE website_page_type ADD VALUE IF NOT EXISTS 'post-single';
ALTER TYPE website_page_type ADD VALUE IF NOT EXISTS 'checkout';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Added missing page types to website_page_type enum';
END $$;

-- ============================================================================
-- FIX SERENGETI TEMPLATE DATA
-- ============================================================================

-- Update page_type from 'homepage' to 'home'
UPDATE website_template_pages
SET page_type = 'home'
WHERE template_id = (SELECT id FROM website_templates WHERE name = 'Serengeti Lodge')
  AND page_type = 'homepage';

-- Fix slugs - remove leading slashes and make them valid
UPDATE website_template_pages
SET slug = CASE
  WHEN slug = '/' THEN 'home'
  WHEN slug LIKE '/%' THEN SUBSTRING(slug FROM 2)  -- Remove leading /
  ELSE slug
END
WHERE template_id = (SELECT id FROM website_templates WHERE name = 'Serengeti Lodge');

-- Log the fixes
DO $$
DECLARE
  template_id_var UUID;
  page_count INTEGER;
BEGIN
  SELECT id INTO template_id_var FROM website_templates WHERE name = 'Serengeti Lodge';

  SELECT COUNT(*) INTO page_count
  FROM website_template_pages
  WHERE template_id = template_id_var;

  RAISE NOTICE 'Fixed Serengeti template pages: % pages updated', page_count;
END $$;

-- ============================================================================
-- VERIFY FIXES
-- ============================================================================

-- Show the fixed pages
SELECT
  page_type,
  title,
  slug,
  sort_order
FROM website_template_pages
WHERE template_id = (SELECT id FROM website_templates WHERE name = 'Serengeti Lodge')
ORDER BY sort_order;
