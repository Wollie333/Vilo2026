-- Check website_templates table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'website_templates'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if template_categories table exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'template_categories'
) as template_categories_exists;

-- If template_categories exists, check what's in it
SELECT id, name, slug
FROM template_categories
WHERE is_active = true
ORDER BY sort_order;
