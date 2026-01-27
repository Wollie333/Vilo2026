-- ============================================================================
-- UPGRADE FREE USERS WITH SUBSCRIPTIONS TO PAID
-- ============================================================================
-- Purpose: Any user with 'free' type but has an active subscription should be 'paid'
-- This catches users who got subscriptions but weren't upgraded
-- ============================================================================

BEGIN;

-- Show current state
SELECT
  '=== BEFORE UPGRADE ===' as info,
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

-- Upgrade free → paid for users with active subscriptions
DO $$
DECLARE
  free_type_id UUID;
  paid_type_id UUID;
  upgraded_count INTEGER := 0;
BEGIN
  -- Get user type IDs
  SELECT id INTO free_type_id FROM public.user_types WHERE name = 'free' AND category = 'customer';
  SELECT id INTO paid_type_id FROM public.user_types WHERE name = 'paid' AND category = 'customer';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'User Type IDs:';
  RAISE NOTICE '  free: %', free_type_id;
  RAISE NOTICE '  paid: %', paid_type_id;
  RAISE NOTICE '========================================';

  -- Update users with 'free' type who have active subscriptions
  WITH upgraded_users AS (
    UPDATE public.users u
    SET user_type_id = paid_type_id,
        updated_at = NOW()
    WHERE u.user_type_id = free_type_id
      AND EXISTS (
        SELECT 1 FROM public.user_subscriptions us
        WHERE us.user_id = u.id
          AND us.is_active = true
          AND us.status IN ('active', 'trial')
      )
    RETURNING u.id, u.email
  )
  SELECT COUNT(*) INTO upgraded_count FROM upgraded_users;

  RAISE NOTICE 'Upgraded % users from free → paid (have active subscriptions)', upgraded_count;
  RAISE NOTICE '========================================';
END $$;

-- Show final state
SELECT
  '=== AFTER UPGRADE ===' as info,
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

-- Verification: Show users that should be paid but aren't
SELECT
  '=== VERIFICATION: Should all be 0 ===' as check_name,
  COUNT(*) as free_users_with_subscriptions_count
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name = 'free'
  AND EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    WHERE us.user_id = u.id
      AND us.is_active = true
      AND us.status IN ('active', 'trial')
  );

COMMIT;

-- ============================================================================
-- Expected Result:
-- - All 'free' users with active/trial subscriptions → 'paid'
-- - Final verification should show 0 free users with subscriptions
-- ============================================================================
