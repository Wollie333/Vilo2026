-- Check for website with subdomain 'test'
SELECT id, subdomain, property_id, is_published 
FROM property_websites 
WHERE subdomain = 'test';

-- List all websites
SELECT id, subdomain, property_id, is_published 
FROM property_websites 
ORDER BY created_at DESC;
