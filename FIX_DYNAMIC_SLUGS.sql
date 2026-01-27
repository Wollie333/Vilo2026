-- Fix dynamic slugs to pass validation
UPDATE website_template_pages
SET slug = 'room-details'
WHERE template_id = (SELECT id FROM website_templates WHERE name = 'Serengeti Lodge')
  AND page_type = 'room-single';

UPDATE website_template_pages
SET slug = 'post'
WHERE template_id = (SELECT id FROM website_templates WHERE name = 'Serengeti Lodge')
  AND page_type = 'post-single';

-- Verify
SELECT page_type, slug
FROM website_template_pages
WHERE template_id = (SELECT id FROM website_templates WHERE name = 'Serengeti Lodge')
ORDER BY sort_order;
