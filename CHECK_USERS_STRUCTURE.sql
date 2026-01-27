-- Check users table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Check user_types to understand admin roles
SELECT
  id,
  name,
  slug,
  description,
  is_admin
FROM public.user_types
ORDER BY name;

-- Check roles table
SELECT
  id,
  name,
  slug,
  description
FROM public.roles
ORDER BY name;

-- Show all current users with their user types
SELECT
  u.id,
  u.email,
  u.full_name,
  u.user_type_id,
  ut.name as user_type_name,
  ut.slug as user_type_slug,
  ut.is_admin,
  u.created_at
FROM public.users u
LEFT JOIN public.user_types ut ON u.user_type_id = ut.id
ORDER BY u.created_at DESC
LIMIT 20;

-- Check if there are any columns with 'admin' in the name in users table
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND (column_name LIKE '%admin%' OR column_name LIKE '%super%');
