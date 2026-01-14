-- Migration: 070_auto_assign_free_tier.sql
-- Description: Auto-assign free tier subscription to existing customer users
-- Date: 2026-01-13
-- Author: Claude Code
-- Status: Ready for execution

-- ============================================================================
-- AUTO-ASSIGN FREE TIER TO EXISTING USERS
-- ============================================================================

DO $$
DECLARE
  v_free_plan_id UUID;
  v_customer_type_id UUID;
  v_users_updated INTEGER := 0;
  v_subscriptions_created INTEGER := 0;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Starting free tier auto-assignment process';
  RAISE NOTICE '============================================';

  -- ============================================================================
  -- STEP 1: GET FREE TIER PLAN ID
  -- ============================================================================

  SELECT id INTO v_free_plan_id
  FROM public.subscription_types
  WHERE name = 'free_tier';

  IF v_free_plan_id IS NULL THEN
    RAISE EXCEPTION 'Free tier subscription plan not found. Run migration 068 first.';
  END IF;

  RAISE NOTICE '✓ Free tier plan ID: %', v_free_plan_id;

  -- ============================================================================
  -- STEP 2: GET CUSTOMER USER TYPE ID
  -- ============================================================================

  SELECT id INTO v_customer_type_id
  FROM public.user_types
  WHERE name = 'free' AND category = 'customer';

  IF v_customer_type_id IS NULL THEN
    RAISE WARNING 'Free customer user type not found. Using first customer type.';
    SELECT id INTO v_customer_type_id
    FROM public.user_types
    WHERE category = 'customer'
    LIMIT 1;
  END IF;

  RAISE NOTICE '✓ Customer user type ID: %', v_customer_type_id;

  -- ============================================================================
  -- STEP 3: ENSURE ALL USERS HAVE USER_TYPE_ID
  -- ============================================================================

  RAISE NOTICE 'Checking users without user_type_id...';

  UPDATE public.users
  SET user_type_id = v_customer_type_id
  WHERE user_type_id IS NULL;

  GET DIAGNOSTICS v_users_updated = ROW_COUNT;

  IF v_users_updated > 0 THEN
    RAISE NOTICE '✓ Assigned free user type to % users', v_users_updated;
  ELSE
    RAISE NOTICE '✓ All users already have user_type_id assigned';
  END IF;

  -- ============================================================================
  -- STEP 4: AUTO-ASSIGN FREE TIER TO CUSTOMER USERS
  -- ============================================================================

  RAISE NOTICE 'Auto-assigning free tier subscriptions...';

  -- Insert free tier subscriptions for customer users without active subscriptions
  INSERT INTO public.user_subscriptions (
    user_id,
    subscription_type_id,
    status,
    started_at,
    is_active
  )
  SELECT
    u.id,
    v_free_plan_id,
    'active',
    NOW(),
    true
  FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE
    ut.category = 'customer' -- Only customer category users
    AND NOT EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = u.id
      AND us.is_active = true
      AND us.status IN ('active', 'trial')
    );

  GET DIAGNOSTICS v_subscriptions_created = ROW_COUNT;
  RAISE NOTICE '✓ Created % free tier subscriptions', v_subscriptions_created;

  -- ============================================================================
  -- STEP 5: MAKE USER_TYPE_ID NOT NULL
  -- ============================================================================

  RAISE NOTICE 'Enforcing user_type_id NOT NULL constraint...';

  -- Check if any users still have NULL user_type_id
  IF EXISTS (SELECT 1 FROM public.users WHERE user_type_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot make user_type_id NOT NULL: some users still have NULL values';
  END IF;

  -- Make user_type_id NOT NULL
  ALTER TABLE public.users
  ALTER COLUMN user_type_id SET NOT NULL;

  RAISE NOTICE '✓ user_type_id is now NOT NULL';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 070 completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Users assigned free type: %', v_users_updated;
  RAISE NOTICE '  - Free tier subscriptions created: %', v_subscriptions_created;
  RAISE NOTICE '  - user_type_id constraint: NOT NULL enforced';
  RAISE NOTICE '============================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the migration:
--
-- 1. Check all users have user_type:
-- SELECT COUNT(*) as users_without_type
-- FROM public.users
-- WHERE user_type_id IS NULL;
-- Expected: 0
--
-- 2. Check all customer users have free tier subscription:
-- SELECT
--   u.email,
--   ut.name as user_type,
--   ut.category,
--   us.status,
--   st.name as subscription_plan,
--   st.price_cents
-- FROM public.users u
-- JOIN public.user_types ut ON u.user_type_id = ut.id
-- LEFT JOIN public.user_subscriptions us ON us.user_id = u.id AND us.is_active = true
-- LEFT JOIN public.subscription_types st ON us.subscription_type_id = st.id
-- WHERE ut.category = 'customer'
-- LIMIT 10;
-- Expected: All customer users should have free_tier subscription
--
-- 3. Count subscriptions by type:
-- SELECT
--   st.name,
--   st.display_name,
--   COUNT(us.id) as user_count
-- FROM public.subscription_types st
-- LEFT JOIN public.user_subscriptions us ON us.subscription_type_id = st.id AND us.is_active = true
-- GROUP BY st.id
-- ORDER BY user_count DESC;
