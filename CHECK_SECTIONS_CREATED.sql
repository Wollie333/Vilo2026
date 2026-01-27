-- Check if sections were actually created
SELECT COUNT(*) as section_count
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba';

-- Check homepage sections specifically
SELECT
  section_type,
  section_name,
  is_visible,
  sort_order
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
  AND page_type = 'home'
ORDER BY sort_order;

-- Check all section types
SELECT
  page_type,
  COUNT(*) as count
FROM template_page_sections
WHERE property_website_id = 'c184c112-bee3-417d-961c-b0edb931b3ba'
GROUP BY page_type;
