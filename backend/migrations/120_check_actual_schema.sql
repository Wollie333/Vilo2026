-- Check actual schema of website_templates table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'website_templates'
ORDER BY ordinal_position;
