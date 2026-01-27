-- ============================================================================
-- SIMPLE SCHEMA CHECK - No assumptions about columns
-- ============================================================================

-- 1. Check ALL columns in subscription_types table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscription_types'
ORDER BY ordinal_position;

-- 2. Check ALL columns in user_types table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_types'
ORDER BY ordinal_position;

-- 3. Check ALL columns in users table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Check ALL columns in user_subscriptions table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 5. Check ALL columns in roles table
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'roles'
ORDER BY ordinal_position;

-- 6. Check ALL columns in user_roles table
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 7. Show ALL data in subscription_types (just select *)
SELECT * FROM public.subscription_types LIMIT 10;

-- 8. Show ALL data in user_types (just select *)
SELECT * FROM public.user_types LIMIT 10;

-- 9. Show current super admin user
SELECT * FROM public.users LIMIT 5;

-- 10. Show roles
SELECT * FROM public.roles LIMIT 10;
