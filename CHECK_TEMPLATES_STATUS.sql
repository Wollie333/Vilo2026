-- ============================================================================
-- CHECK TEMPLATES STATUS
-- Run this to see what templates exist in your database
-- ============================================================================

-- Check all templates
SELECT
  id,
  name,
  category,
  is_active,
  is_featured,
  created_at
FROM website_templates
ORDER BY created_at;

-- Check which have pages
SELECT
  wt.name as template_name,
  COUNT(wtp.id) as page_count
FROM website_templates wt
LEFT JOIN website_template_pages wtp ON wtp.template_id = wt.id
GROUP BY wt.id, wt.name
ORDER BY wt.name;

-- Check which have sections
SELECT
  wt.name as template_name,
  COUNT(wtps.id) as section_count
FROM website_templates wt
LEFT JOIN website_template_pages wtp ON wtp.template_id = wt.id
LEFT JOIN website_template_page_sections wtps ON wtps.template_page_id = wtp.id
GROUP BY wt.id, wt.name
ORDER BY wt.name;
