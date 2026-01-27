-- Run this SQL in Supabase SQL Editor
-- This will create all email management tables and seed 16 templates

-- Copy the entire contents of:
-- backend/migrations/138_create_email_management_system.sql
--
-- And paste it here in Supabase SQL Editor, then click "Run"

-- OR use this quick verification query first to check if tables exist:

SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'email_templates'
) as email_templates_exists;

-- If the result is false, you need to run the migration
-- If true, tables already exist
