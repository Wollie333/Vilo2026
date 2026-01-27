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

-- Check how super admin is identified
-- Option 1: Via user_type
SELECT DISTINCT user_type FROM public.users;

-- Option 2: Via is_admin flag
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name LIKE '%admin%';

-- Check user_types table structure
SELECT * FROM public.user_types;

-- Check roles table
SELECT * FROM public.roles;

-- Show all current users with their roles
SELECT
  u.id,
  u.email,
  u.full_name,
  u.user_type,
  u.created_at
FROM public.users u
LIMIT 10;
