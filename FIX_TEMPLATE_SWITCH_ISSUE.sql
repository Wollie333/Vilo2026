-- ============================================================================
-- FIX TEMPLATE SWITCH ISSUE
-- This script will fix your website that's stuck showing old template
-- ============================================================================

-- STEP 1: Check what templates exist
-- ============================================================================
SELECT
  id,
  name,
  category,
  is_active,
  is_featured,
  created_at
FROM website_templates
ORDER BY name;

-- Expected results:
-- 1. Modern Luxe (is_active = true)
-- 2. Serengeti Lodge (is_active = true)


-- STEP 2: Find your property ID
-- ============================================================================
-- Replace admin@vilo.com with your email if different
SELECT
  p.id as property_id,
  p.name as property_name,
  p.company_id
FROM properties p
JOIN companies c ON c.id = p.company_id
JOIN users u ON u.company_id = c.id
WHERE u.email = 'admin@vilo.com'
LIMIT 5;

-- Copy the property_id from the results


-- STEP 3: Check your current website status
-- ============================================================================
-- Replace {PROPERTY_ID} with the ID from Step 2
SELECT
  pw.id as website_id,
  pw.subdomain,
  pw.template_id,
  wt.name as template_name,
  pw.is_active,
  pw.created_at
FROM property_websites pw
LEFT JOIN website_templates wt ON wt.id = pw.template_id
WHERE pw.property_id = '{PROPERTY_ID}';

-- Copy the website_id for next steps


-- STEP 4: Check what sections are actually on your website
-- ============================================================================
-- Replace {WEBSITE_ID} with the ID from Step 3
SELECT
  CASE
    WHEN section_type LIKE 'serengeti-%' THEN 'Serengeti Sections'
    ELSE 'Old Generic Sections'
  END as section_category,
  COUNT(*) as count
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
GROUP BY section_category;

-- If you see "Old Generic Sections", that's the problem!


-- STEP 5: FIX - Delete old sections and pages
-- ============================================================================
-- WARNING: This will delete all current pages and sections
-- Make sure you have the backup or are okay losing current customizations

-- Replace {WEBSITE_ID} with your actual website ID
BEGIN;

-- Delete all sections
DELETE FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}';

-- Delete all pages
DELETE FROM website_pages
WHERE property_website_id = '{WEBSITE_ID}';

-- Verify deletion
SELECT
  (SELECT COUNT(*) FROM template_page_sections WHERE property_website_id = '{WEBSITE_ID}') as sections_remaining,
  (SELECT COUNT(*) FROM website_pages WHERE property_website_id = '{WEBSITE_ID}') as pages_remaining;

-- Should both be 0

COMMIT;


-- STEP 6: Now re-activate Serengeti template from the UI
-- ============================================================================
-- Go to: Property → Website → Overview
-- Click "Activate" on Serengeti Lodge template
-- The backend will now create fresh Serengeti sections
-- Your website will display the Serengeti design


-- ALTERNATIVE: If you want to switch BACK to Modern Luxe instead
-- ============================================================================
-- First get Modern Luxe template ID:
SELECT id, name FROM website_templates WHERE name = 'Modern Luxe';

-- Then update your website to use it:
-- (Replace {WEBSITE_ID} and {MODERN_LUXE_TEMPLATE_ID})
UPDATE property_websites
SET template_id = '{MODERN_LUXE_TEMPLATE_ID}',
    updated_at = NOW()
WHERE id = '{WEBSITE_ID}';

-- Then delete sections and pages (Step 5 above)
-- Then re-activate from UI


-- VERIFICATION: After re-activation
-- ============================================================================
-- Check that Serengeti sections were created:
SELECT
  tps.section_type,
  tps.section_name,
  tps.page_type,
  tps.sort_order
FROM template_page_sections tps
WHERE tps.property_website_id = '{WEBSITE_ID}'
ORDER BY tps.page_type, tps.sort_order;

-- Should see section types like:
-- serengeti-hero-fullscreen
-- serengeti-features-3col
-- serengeti-room-cards
-- etc.


-- Check pages were created:
SELECT
  wp.type,
  wp.title,
  wp.slug,
  wp.is_visible
FROM website_pages wp
WHERE wp.property_website_id = '{WEBSITE_ID}'
ORDER BY wp.sort_order;

-- Should see 8 pages:
-- home, about, accommodation, room_single, contact, blog, blog_post, checkout
