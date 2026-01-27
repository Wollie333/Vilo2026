-- ============================================================================
-- CHECK WHICH TEMPLATE IS ACTIVE
-- ============================================================================

-- Step 1: Check which template the website is using
SELECT
  pw.id as website_id,
  pw.subdomain,
  pw.template_id,
  wt.name as template_name,
  pw.is_active
FROM property_websites pw
LEFT JOIN website_templates wt ON wt.id = pw.template_id
WHERE pw.subdomain = 'test';

-- Expected: template_name should be 'Serengeti Lodge'


-- Step 2: Get both template IDs for comparison
SELECT
  id,
  name,
  category,
  is_active
FROM website_templates
ORDER BY name;

-- Expected: Should see both 'Serengeti Lodge' and 'Modern Luxe'


-- Step 3: Check how many template pages exist for Serengeti
SELECT
  wt.name as template_name,
  COUNT(wtp.*) as page_count
FROM website_templates wt
LEFT JOIN website_template_pages wtp ON wtp.template_id = wt.id
WHERE wt.name = 'Serengeti Lodge'
GROUP BY wt.name;

-- Expected: Should show 8 pages


-- Step 4: Check which sections exist for the website
SELECT
  COUNT(*) as section_count,
  page_type,
  section_type
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
GROUP BY page_type, section_type
ORDER BY page_type, section_type;

-- Expected: Should see serengeti-* section types
