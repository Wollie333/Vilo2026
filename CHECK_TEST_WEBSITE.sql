-- Check if test website exists and is properly configured

-- Check the website
SELECT
  pw.id as website_id,
  pw.subdomain,
  pw.is_active,
  pw.created_at,
  p.name as property_name,
  p.id as property_id
FROM property_websites pw
JOIN properties p ON pw.property_id = p.id
WHERE pw.subdomain = 'test';

-- Check the pages
SELECT
  wp.id,
  wp.page_type,
  wp.title,
  wp.slug,
  wp.is_visible,
  wp.sort_order
FROM website_pages wp
JOIN property_websites pw ON wp.property_website_id = pw.id
WHERE pw.subdomain = 'test'
ORDER BY wp.sort_order;

-- Count of pages (should be 5)
SELECT COUNT(*) as page_count
FROM website_pages wp
JOIN property_websites pw ON wp.property_website_id = pw.id
WHERE pw.subdomain = 'test';
