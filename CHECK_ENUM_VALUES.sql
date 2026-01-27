-- Check current enum values for website_page_type
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'website_page_type'::regtype
ORDER BY enumsortorder;
