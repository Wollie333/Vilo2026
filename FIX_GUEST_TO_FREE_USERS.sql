-- ============================================================================
-- FIX GUEST USERS WHO SHOULD BE FREE
-- ============================================================================
-- Purpose: Users who signed up through the app should be 'free', not 'guest'
-- 'guest' is only for public website bookings (no account)
-- 'free' is for registered users without paid subscriptions
-- 'paid' is for users with active subscriptions
-- ============================================================================

BEGIN;

-- Show current state
SELECT
  '=== BEFORE FIX ===' as status,
  ut.name as user_type,
  COUNT(*) as user_count
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
GROUP BY ut.name
ORDER BY ut.name;

-- Get the 'free' and 'paid' user type IDs
DO $$
DECLARE
  free_type_id UUID;
  paid_type_id UUID;
  guest_type_id UUID;
  updated_to_free INTEGER := 0;
  updated_to_paid INTEGER := 0;
BEGIN
  -- Get user type IDs
  SELECT id INTO free_type_id FROM public.user_types WHERE name = 'free' AND category = 'customer';
  SELECT id INTO paid_type_id FROM public.user_types WHERE name = 'paid' AND category = 'customer';
  SELECT id INTO guest_type_id FROM public.user_types WHERE name = 'guest' AND category = 'customer';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'User Type IDs:';
  RAISE NOTICE '  free: %', free_type_id;
  RAISE NOTICE '  paid: %', paid_type_id;
  RAISE NOTICE '  guest: %', guest_type_id;
  RAISE NOTICE '========================================';

  -- Update users who have 'guest' type AND an active subscription → change to 'paid'
  WITH updated_users AS (
    UPDATE public.users u
    SET user_type_id = paid_type_id,
        updated_at = NOW()
    WHERE u.user_type_id = guest_type_id
      AND EXISTS (
        SELECT 1 FROM public.user_subscriptions us
        WHERE us.user_id = u.id
          AND us.is_active = true
          AND us.status IN ('active', 'trial')
      )
    RETURNING u.id, u.email
  )
  SELECT COUNT(*) INTO updated_to_paid FROM updated_users;

  RAISE NOTICE 'Updated % users from guest → paid (have active subscriptions)', updated_to_paid;

  -- Update remaining users who have 'guest' type but NO subscription → change to 'free'
  WITH updated_users AS (
    UPDATE public.users u
    SET user_type_id = free_type_id,
        updated_at = NOW()
    WHERE u.user_type_id = guest_type_id
      AND NOT EXISTS (
        SELECT 1 FROM public.user_subscriptions us
        WHERE us.user_id = u.id
          AND us.is_active = true
      )
    RETURNING u.id, u.email
  )
  SELECT COUNT(*) INTO updated_to_free FROM updated_users;

  RAISE NOTICE 'Updated % users from guest → free (no subscriptions)', updated_to_free;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total updated: %', updated_to_paid + updated_to_free;
  RAISE NOTICE '========================================';
END $$;

-- Show final state
SELECT
  '=== AFTER FIX ===' as status,
  ut.name as user_type,
  COUNT(*) as user_count
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
GROUP BY ut.name
ORDER BY ut.name;

-- Verify: Show users with their subscription status
SELECT
  '=== USER TYPE vs SUBSCRIPTION STATUS ===' as info,
  ut.name as user_type,
  CASE
    WHEN us.id IS NULL THEN 'No subscription'
    WHEN us.is_active = true AND us.status = 'active' THEN 'Active subscription'
    WHEN us.is_active = true AND us.status = 'trial' THEN 'Trial subscription'
    ELSE 'Inactive subscription'
  END as subscription_status,
  COUNT(*) as count
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id
GROUP BY ut.name, subscription_status
ORDER BY ut.name, subscription_status;

COMMIT;

-- ============================================================================
-- Expected Result:
-- - Users with 'guest' type + active subscription → 'paid'
-- - Users with 'guest' type + no subscription → 'free'
-- - 'paid' users should all have active subscriptions
-- - 'free' users should have no active subscriptions
-- ============================================================================
