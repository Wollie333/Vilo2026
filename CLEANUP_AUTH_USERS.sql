-- ============================================================================
-- CLEANUP AUTH.USERS - Remove leftover auth records
-- ============================================================================
-- This cleans up Supabase Auth table (auth.users) which is separate from
-- the public.users table. The previous cleanup only deleted public.users.
-- ============================================================================

BEGIN;

-- First, find the super admin user ID from public.users
CREATE TEMP TABLE super_admin_info AS
SELECT DISTINCT u.id, u.email
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'super_admin';

-- Show what will be kept
SELECT
  'KEEPING SUPER ADMIN:' as action,
  email,
  id
FROM super_admin_info;

-- Delete from auth.users (Supabase Auth) except super admin
-- This is what causes "email already registered" errors
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM super_admin_info);

-- Show remaining auth users
SELECT
  'REMAINING AUTH.USERS:' as info,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at;

-- Verify counts
SELECT
  'PUBLIC.USERS' as table_name,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT
  'AUTH.USERS' as table_name,
  COUNT(*) as count
FROM auth.users;

DROP TABLE super_admin_info;

COMMIT;
