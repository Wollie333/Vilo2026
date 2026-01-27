-- ============================================================================
-- VERIFY TEMPLATE ACTIVATION
-- Run these to check if pages and sections were created
-- ============================================================================

-- Step 1: Find your website
SELECT
  pw.id as website_id,
  pw.subdomain,
  pw.property_id,
  wt.name as template_name,
  pw.is_active
FROM property_websites pw
JOIN website_templates wt ON wt.id = pw.template_id
WHERE pw.subdomain = 'test';

-- Copy the website_id for next queries


-- Step 2: Check if pages were created (after the fix)
SELECT
  page_type,
  title,
  slug,
  is_visible,
  sort_order
FROM website_pages
WHERE property_website_id = '{WEBSITE_ID}'
ORDER BY sort_order;

-- Expected: 8 pages
-- If you see 0, you need to re-activate the template


-- Step 3: Check if sections were created
SELECT
  section_type,
  section_name,
  page_type,
  is_visible,
  sort_order
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
ORDER BY page_type, sort_order;

-- Expected: 18 sections with type like 'serengeti-%'
-- If you see 0, you need to re-activate the template


-- Step 4: Check section content for homepage
SELECT
  section_type,
  section_name,
  content->>'heading' as heading,
  content->>'sectionTitle' as section_title,
  LENGTH(content::text) as content_size
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
  AND page_type = 'homepage'
ORDER BY sort_order;

-- Should show actual content, not empty
