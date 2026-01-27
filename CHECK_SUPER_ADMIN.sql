-- Check if you have a super admin user
-- Run this in Supabase SQL Editor

-- 1. Check if super admin role exists
SELECT * FROM user_roles WHERE name = 'super_admin';

-- 2. Check which users have super admin role
SELECT
  u.id,
  u.email,
  u.full_name,
  ur.name as role_name
FROM users u
JOIN user_user_roles uur ON u.id = uur.user_id
JOIN user_roles ur ON uur.role_id = ur.id
WHERE ur.name = 'super_admin';

-- 3. Check email templates (as super admin)
SELECT
  id,
  template_key,
  display_name,
  template_type,
  is_active,
  send_count
FROM email_templates
ORDER BY created_at DESC;

-- 4. Test is_super_admin() function
SELECT public.is_super_admin() as am_i_super_admin;
