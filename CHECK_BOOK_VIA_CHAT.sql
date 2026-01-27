-- Check if Book via Chat is enabled for your companies
SELECT
  id,
  name,
  enable_book_via_chat,
  created_at
FROM companies
ORDER BY created_at DESC;

-- Check a specific property's company setting
-- Replace 'your-property-slug' with the actual slug you're testing
SELECT
  p.id as property_id,
  p.name as property_name,
  p.slug,
  p.company_id,
  c.name as company_name,
  c.enable_book_via_chat
FROM properties p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.slug = 'your-property-slug';
