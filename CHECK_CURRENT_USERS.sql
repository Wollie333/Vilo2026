-- ============================================================================
-- CHECK CURRENT USERS IN DATABASE
-- ============================================================================

-- Check all users in public.users
SELECT
  id,
  email,
  full_name,
  user_type_id,
  status,
  created_at,
  (SELECT name FROM user_types WHERE id = users.user_type_id) as user_type_name,
  (SELECT COUNT(*) FROM user_roles WHERE user_id = users.id) as role_count
FROM public.users
ORDER BY created_at DESC;

-- Check for specific emails
SELECT
  'admin@vilo.com' as searched_email,
  CASE WHEN EXISTS (SELECT 1 FROM users WHERE email = 'admin@vilo.com')
    THEN 'EXISTS'
    ELSE 'NOT FOUND'
  END as status
UNION ALL
SELECT
  'wollie333@gmail.com',
  CASE WHEN EXISTS (SELECT 1 FROM users WHERE email = 'wollie333@gmail.com')
    THEN 'EXISTS'
    ELSE 'NOT FOUND'
  END;

-- Check user roles for super admin
SELECT
  u.email,
  u.full_name,
  r.name as role_name,
  ut.name as user_type_name
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN user_types ut ON ut.id = u.user_type_id
WHERE u.email IN ('admin@vilo.com', 'wollie333@gmail.com')
ORDER BY u.email;

-- Check auth.users (Supabase auth table)
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email IN ('admin@vilo.com', 'wollie333@gmail.com')
ORDER BY email;

-- Total user count
SELECT COUNT(*) as total_users FROM public.users;
