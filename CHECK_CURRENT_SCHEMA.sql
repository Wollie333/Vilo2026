-- ============================================================================
-- SCHEMA VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to see actual current schema
-- ============================================================================

-- 1. Check subscription_types table structure
SELECT
  'subscription_types' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscription_types'
ORDER BY ordinal_position;

-- 2. Check existing subscription types (data)
SELECT
  id,
  name,
  display_name,
  price_cents,
  currency,
  is_active,
  billing_cycle_days,
  is_recurring
FROM public.subscription_types
ORDER BY sort_order, name;

-- 3. Check user_types table structure
SELECT
  'user_types' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_types'
ORDER BY ordinal_position;

-- 4. Check existing user types (data)
SELECT
  id,
  name,
  display_name,
  category,
  can_have_subscription,
  can_have_team
FROM public.user_types
ORDER BY sort_order, name;

-- 5. Check users table - key columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('id', 'email', 'user_type_id', 'status', 'created_at')
ORDER BY ordinal_position;

-- 6. Check user_subscriptions table structure
SELECT
  'user_subscriptions' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 7. Check roles table structure
SELECT
  'roles' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'roles'
ORDER BY ordinal_position;

-- 8. Check existing roles (data)
SELECT id, name, description
FROM public.roles
ORDER BY name;

-- 9. Check user_roles table structure
SELECT
  'user_roles' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 10. Check current super admin user status
SELECT
  u.id,
  u.email,
  u.status,
  ut.name as user_type_name,
  ut.category as user_type_category,
  (SELECT COUNT(*) FROM user_subscriptions us WHERE us.user_id = u.id AND us.is_active = true) as active_subscriptions,
  (SELECT COUNT(*) FROM user_roles ur WHERE ur.user_id = u.id) as role_assignments
FROM public.users u
LEFT JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name = 'super_admin' OR u.email LIKE '%admin%'
ORDER BY u.created_at;

-- ============================================================================
-- SUMMARY: What to look for
-- ============================================================================
--
-- From subscription_types:
--   - Does it have 'limits', 'pricing', 'billing_types', 'pricing_tiers' columns?
--   - Or are limits in a separate table?
--   - Does 'free_tier' subscription exist?
--
-- From user_types:
--   - Does it have 'category' column (enum with 'saas' and 'customer')?
--   - Does 'free' user type exist?
--   - Does 'super_admin' user type exist?
--
-- From users:
--   - Does it have 'user_type_id' column?
--   - Does it have 'status' column?
--
-- From roles:
--   - Does 'super_admin' role exist?
--
-- From current super admin:
--   - Does user have user_type_id set?
--   - Does user have any subscriptions?
--   - Does user have any role assignments?
--
-- ============================================================================
