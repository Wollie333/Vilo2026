-- ============================================================================
-- Check if Email Management System is installed
-- ============================================================================

-- Check if tables exist
SELECT
  'email_template_categories' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_template_categories'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT
  'email_templates' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_templates'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT
  'email_sends' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_sends'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT
  'email_template_changelog' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_template_changelog'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check template counts
SELECT
  (SELECT COUNT(*) FROM email_template_categories) as category_count,
  (SELECT COUNT(*) FROM email_templates) as template_count,
  (SELECT COUNT(*) FROM email_templates WHERE template_key IN ('booking_guest_password_setup', 'booking_existing_user_confirmation')) as new_booking_templates;

-- List all email templates
SELECT
  template_key,
  display_name,
  is_active,
  feature_tag,
  stage_tag
FROM email_templates
ORDER BY feature_tag, stage_tag, template_key;
