-- ============================================================================
-- VERIFICATION SCRIPT - Check if Serengeti sections were created successfully
-- Run this AFTER re-activating the Serengeti template
-- ============================================================================

-- Step 1: Find your website ID
SELECT
  id as website_id,
  subdomain,
  template_id,
  created_at
FROM property_websites
WHERE subdomain = 'test';

-- Expected: Should show website with Serengeti template_id


-- Step 2: Count pages created
SELECT COUNT(*) as page_count
FROM website_pages
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba';

-- Expected: 8 pages


-- Step 3: Count sections created (THIS IS THE KEY CHECK)
SELECT COUNT(*) as section_count
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba';

-- Expected: 16+ sections (was 0 before fix)


-- Step 4: Show all sections by page type
SELECT
  page_type,
  section_type,
  section_name,
  layout_variant,
  is_visible,
  sort_order
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
ORDER BY page_type, sort_order;

-- Expected: See sections like:
-- home | serengeti-hero-fullscreen | Hero Section | default | true | 1
-- home | serengeti-features-3col | Why Choose Us | default | true | 2
-- etc.


-- Step 5: Verify homepage sections specifically
SELECT
  section_type,
  section_name,
  layout_variant,
  LENGTH(content::text) as content_size,
  is_visible
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
  AND page_type = 'home'
ORDER BY sort_order;

-- Expected: 4-5 sections with actual content (content_size > 100)


-- Step 6: Check if layout_variant has default values (verify fix)
SELECT
  section_name,
  layout_variant
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
LIMIT 5;

-- Expected: All should have 'default' or other non-null value
