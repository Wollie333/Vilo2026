-- ============================================================================
-- CHECK ALL USERS - Find all users in both public and auth schemas
-- ============================================================================

-- Check public.users table
SELECT
  'PUBLIC.USERS' as source,
  id,
  email,
  full_name,
  status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- Check if auth.users exists (Supabase Auth)
SELECT
  'AUTH.USERS' as source,
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Count users
SELECT
  'PUBLIC.USERS' as table_name,
  COUNT(*) as user_count
FROM public.users
UNION ALL
SELECT
  'AUTH.USERS' as table_name,
  COUNT(*) as user_count
FROM auth.users;
