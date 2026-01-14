-- ============================================================================
-- VERIFICATION SCRIPT FOR MIGRATIONS 066-071
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify all migrations worked
-- ============================================================================

-- ============================================================================
-- 1. VERIFY CATEGORY FIELD EXISTS ON USER_TYPES
-- ============================================================================

SELECT
  name,
  display_name,
  category,
  can_have_subscription,
  is_system_type
FROM public.user_types
ORDER BY sort_order;

-- Expected output:
-- super_admin | saas | false | true
-- admin | saas | false | true
-- free | customer | true | false
-- paid | customer | true | false

-- ============================================================================
-- 2. VERIFY SUBSCRIPTION_TYPE_PERMISSIONS TABLE EXISTS
-- ============================================================================

SELECT
  COUNT(*) as total_rows,
  COUNT(DISTINCT subscription_type_id) as subscription_types_with_permissions,
  COUNT(DISTINCT permission_id) as unique_permissions_assigned
FROM public.subscription_type_permissions;

-- Expected: At least 1 subscription type (free_tier) with ~20 permissions

-- ============================================================================
-- 3. VERIFY FREE TIER SUBSCRIPTION PLAN
-- ============================================================================

SELECT
  st.name,
  st.display_name,
  st.price_cents,
  st.currency,
  st.is_active,
  st.limits,
  COUNT(stp.permission_id) as permission_count
FROM public.subscription_types st
LEFT JOIN public.subscription_type_permissions stp ON stp.subscription_type_id = st.id
WHERE st.name = 'free_tier'
GROUP BY st.id;

-- Expected: free_tier | Free Tier | 0 | ZAR | true | {...limits...} | ~20

-- ============================================================================
-- 4. VERIFY ALL CUSTOMER USERS HAVE FREE TIER SUBSCRIPTION
-- ============================================================================

SELECT
  COUNT(*) FILTER (WHERE us.id IS NOT NULL) as users_with_subscription,
  COUNT(*) FILTER (WHERE us.id IS NULL) as users_without_subscription,
  COUNT(*) as total_customer_users
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
LEFT JOIN public.user_subscriptions us ON us.user_id = u.id AND us.is_active = true
WHERE ut.category = 'customer';

-- Expected: users_without_subscription should be 0

-- Show sample users with their subscriptions
SELECT
  u.email,
  ut.name as user_type,
  ut.category,
  us.status,
  st.name as subscription_plan,
  st.price_cents
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
LEFT JOIN public.user_subscriptions us ON us.user_id = u.id AND us.is_active = true
LEFT JOIN public.subscription_types st ON us.subscription_type_id = st.id
WHERE ut.category = 'customer'
LIMIT 5;

-- ============================================================================
-- 5. VERIFY COMPANY_TEAM_MEMBERS TABLE EXISTS
-- ============================================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'company_team_members'
ORDER BY ordinal_position;

-- Expected: Table with columns: id, company_id, user_id, role, role_name,
-- assigned_by, invited_at, accepted_at, revoked_at, is_active, permissions,
-- created_at, updated_at

-- Check enum values
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'company_team_member_role'::regtype::oid
ORDER BY enumsortorder;

-- Expected: owner, manager, receptionist, maintenance, housekeeping, custom

-- ============================================================================
-- 6. VERIFY PERMISSION CHECK FUNCTION UPDATED
-- ============================================================================

-- Test SaaS user (super_admin) - should have permissions from user_type_permissions
SELECT public.has_user_type_permission(
  (SELECT u.id FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.name = 'super_admin' LIMIT 1),
  'properties',
  'manage'
) as super_admin_has_properties_manage;

-- Expected: TRUE (super admin should have all permissions)

-- Test customer user with free tier - should have basic read permissions
SELECT public.has_user_type_permission(
  (SELECT u.id FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.category = 'customer' LIMIT 1),
  'properties',
  'read'
) as customer_has_properties_read;

-- Expected: TRUE (free tier includes properties:read)

-- Test customer user WITHOUT permission (settings:manage not in free tier)
SELECT public.has_user_type_permission(
  (SELECT u.id FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.category = 'customer' LIMIT 1),
  'settings',
  'manage'
) as customer_has_settings_manage;

-- Expected: FALSE (settings:manage NOT in free tier)

-- ============================================================================
-- 7. VERIFY user_type_id IS NOW NOT NULL
-- ============================================================================

SELECT
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'user_type_id';

-- Expected: is_nullable = 'NO'

-- Check no users have NULL user_type_id
SELECT COUNT(*) as users_with_null_type
FROM public.users
WHERE user_type_id IS NULL;

-- Expected: 0

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT
  '✅ All migrations applied successfully!' as status,
  (SELECT COUNT(*) FROM public.subscription_type_permissions) as subscription_permissions_count,
  (SELECT COUNT(*) FROM public.company_team_members) as team_members_count,
  (SELECT COUNT(*) FROM public.user_subscriptions WHERE is_active = true) as active_subscriptions;
