-- ============================================================================
-- FINAL VERIFICATION - Confirm Serengeti template is fully activated
-- ============================================================================

-- Step 1: Verify website has Serengeti template
SELECT
  pw.id as website_id,
  pw.subdomain,
  wt.name as template_name,
  pw.is_active
FROM property_websites pw
JOIN website_templates wt ON wt.id = pw.template_id
WHERE pw.subdomain = 'test';

-- Expected: template_name = 'Serengeti Lodge'


-- Step 2: Count pages created
SELECT COUNT(*) as total_pages
FROM website_pages
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba';

-- Expected: 8 pages


-- Step 3: Count sections created ✅ THIS SHOULD NOW SHOW 16
SELECT COUNT(*) as total_sections
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba';

-- Expected: 16 sections


-- Step 4: Show sections by page type
SELECT
  page_type,
  COUNT(*) as section_count
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
GROUP BY page_type
ORDER BY page_type;

-- Expected:
-- home: 5 sections
-- about: 4 sections
-- accommodation: 2 sections
-- contact: 3 sections
-- blog: 2 sections


-- Step 5: Show homepage sections with content preview
SELECT
  section_type,
  section_name,
  layout_variant,
  is_visible,
  sort_order,
  SUBSTRING(content::text, 1, 100) as content_preview
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
  AND page_type = 'home'
ORDER BY sort_order;

-- Expected: 5 sections with Serengeti section types like:
-- serengeti-hero-fullscreen
-- serengeti-features-3col
-- serengeti-room-cards
-- serengeti-testimonials
-- serengeti-cta-banner


-- Step 6: Verify layout_variant has default values (not null)
SELECT
  page_type,
  section_name,
  layout_variant
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
ORDER BY page_type, sort_order;

-- Expected: All layout_variant = 'default'


-- Step 7: Check content auto-population worked
SELECT
  section_name,
  content->>'heading' as heading,
  content->>'sectionTitle' as section_title
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
  AND page_type = 'home'
ORDER BY sort_order;

-- Expected: Should see "Vilo B&B" in headings (auto-populated property name)
