-- Verification queries for email management system migration
-- Run this to verify tables, seed data, and RLS policies were created

-- ============================================================================
-- 1. Check tables exist
-- ============================================================================
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE 'email_%'
ORDER BY table_name;

-- ============================================================================
-- 2. Check seed data - Categories
-- ============================================================================
SELECT
  id,
  name,
  display_name,
  sort_order,
  is_system_category
FROM email_template_categories
ORDER BY sort_order;

-- ============================================================================
-- 3. Check seed data - Templates count by category
-- ============================================================================
SELECT
  c.display_name as category,
  COUNT(t.id) as template_count,
  SUM(CASE WHEN t.is_active THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN t.template_type = 'application' THEN 1 ELSE 0 END) as application_templates,
  SUM(CASE WHEN t.template_type = 'supabase_auth' THEN 1 ELSE 0 END) as supabase_templates
FROM email_template_categories c
LEFT JOIN email_templates t ON t.category_id = c.id
GROUP BY c.id, c.display_name
ORDER BY c.sort_order;

-- ============================================================================
-- 4. Check all template keys (should have 16 total)
-- ============================================================================
SELECT
  template_key,
  display_name,
  template_type,
  is_active
FROM email_templates
ORDER BY category_id, template_key;

-- ============================================================================
-- 5. Check RLS policies
-- ============================================================================
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename LIKE 'email_%'
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. Check triggers
-- ============================================================================
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table LIKE 'email_%'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 7. Check indexes
-- ============================================================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename LIKE 'email_%'
ORDER BY tablename, indexname;
