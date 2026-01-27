-- ============================================================================
-- Verify Super Admin Before Cleanup
-- ============================================================================
-- Run this BEFORE running CLEANUP_CORRECT.sql to make sure you have a super admin
-- ============================================================================

-- Check if super_admin role exists
SELECT
  id,
  name,
  display_name,
  description
FROM public.roles
WHERE name = 'super_admin';

-- Check which users have super_admin role
SELECT
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  r.display_name as role_display_name,
  u.created_at
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'super_admin';

-- If no users have super_admin role, assign it to yourself:
-- (Replace 'your-email@example.com' with your actual email)
--
-- INSERT INTO public.user_roles (user_id, role_id)
-- SELECT
--   u.id,
--   r.id
-- FROM public.users u
-- CROSS JOIN public.roles r
-- WHERE u.email = 'your-email@example.com'
--   AND r.name = 'super_admin'
-- ON CONFLICT DO NOTHING;
