-- Diagnostic: Check legal pages data
-- Run this to see what's currently stored

-- Check website_pages table for legal pages
SELECT
  'website_pages' as table_name,
  page_type,
  title,
  slug,
  LEFT(content, 100) as content_preview,
  LENGTH(content) as content_length,
  CASE
    WHEN content LIKE '<div%' OR content LIKE '<p%' THEN 'HTML'
    WHEN content LIKE '{%' THEN 'JSON'
    ELSE 'OTHER'
  END as content_format
FROM website_pages
WHERE page_type IN ('terms', 'privacy', 'cancellation');

-- Check if there are any sections for legal pages (there shouldn't be!)
SELECT
  'template_page_sections' as table_name,
  page_type,
  section_type,
  section_name,
  LEFT(content::text, 100) as content_preview
FROM template_page_sections
WHERE page_type IN ('terms', 'privacy', 'cancellation');
