-- ============================================================================
-- DEBUG TEMPLATE ISSUE
-- Run these queries to understand what's happening
-- ============================================================================

-- 1. Check all templates in database
SELECT
  id,
  name,
  category,
  is_active,
  created_at
FROM website_templates
ORDER BY created_at;

-- 2. Check your property website (replace with your property_id)
-- Find your property ID first:
SELECT id, name FROM properties WHERE company_id = (
  SELECT company_id FROM users WHERE email = 'admin@vilo.com' LIMIT 1
) LIMIT 5;

-- 3. Check which template is assigned to your website
-- (Replace {PROPERTY_ID} with your actual property ID)
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

-- 4. Check what sections exist for this website
-- (Replace {WEBSITE_ID} with the website_id from query #3)
SELECT
  tps.section_type,
  tps.section_name,
  tps.page_type,
  tps.sort_order,
  tps.content->>'heading' as heading,
  tps.content->>'sectionTitle' as section_title
FROM template_page_sections tps
WHERE tps.property_website_id = '{WEBSITE_ID}'
ORDER BY tps.page_type, tps.sort_order
LIMIT 20;

-- 5. Check if sections are Serengeti or old generic
SELECT
  CASE
    WHEN section_type LIKE 'serengeti-%' THEN 'Serengeti Template'
    ELSE 'Old Generic Template'
  END as template_type,
  COUNT(*) as section_count
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
GROUP BY template_type;

-- 6. Check website pages
SELECT
  wp.type as page_type,
  wp.title,
  wp.slug,
  COUNT(tps.id) as section_count
FROM website_pages wp
LEFT JOIN template_page_sections tps ON tps.page_type = wp.type AND tps.property_website_id = wp.property_website_id
WHERE wp.property_website_id = '{WEBSITE_ID}'
GROUP BY wp.id, wp.type, wp.title, wp.slug
ORDER BY wp.sort_order;
