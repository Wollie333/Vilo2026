-- Check Pandokkie House property and company settings
SELECT
  p.id as property_id,
  p.name as property_name,
  p.slug,
  p.company_id,
  c.name as company_name,
  c.enable_book_via_chat,
  c.user_id as company_owner
FROM properties p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.name ILIKE '%Pandokkie%' OR p.slug ILIKE '%pandokkie%';

-- If company_id is found, check if Book via Chat is enabled
-- Replace the company_id below with the actual ID from the query above
-- SELECT id, name, enable_book_via_chat FROM companies WHERE id = 'COMPANY-ID-HERE';
