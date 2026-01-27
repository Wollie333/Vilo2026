-- ============================================================================
-- Migration: 143_activate_free_subscription_and_fix_backfill.sql
-- Description: Activate free subscription and backfill super admin role
-- Date: 2026-01-25
-- ============================================================================
-- This migration:
-- 1. Activates the existing 'free' subscription (currently inactive)
-- 2. Assigns super_admin role to super_admin user
-- 3. Creates subscriptions for any customer users without one
-- ============================================================================

DO $$
DECLARE
  v_free_subscription_id UUID;
  v_super_admin_role_id UUID;
  v_super_admin_user_type_id UUID;
  v_subscriptions_created INTEGER := 0;
  v_roles_assigned INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Activate Free Subscription & Backfill Users';
  RAISE NOTICE 'Migration 143';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 1: Activate the 'free' subscription
  -- ============================================================================

  RAISE NOTICE 'Step 1: Activating free subscription...';

  SELECT id INTO v_free_subscription_id
  FROM public.subscription_types
  WHERE name = 'free';

  IF v_free_subscription_id IS NULL THEN
    RAISE EXCEPTION 'Free subscription type not found. Database may be corrupted.';
  END IF;

  -- Activate it
  UPDATE public.subscription_types
  SET is_active = true
  WHERE id = v_free_subscription_id;

  RAISE NOTICE '✅ Free subscription activated: %', v_free_subscription_id;
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 2: Get super_admin role ID
  -- ============================================================================

  RAISE NOTICE 'Step 2: Finding super_admin role...';

  SELECT id INTO v_super_admin_role_id
  FROM public.roles
  WHERE name = 'super_admin';

  IF v_super_admin_role_id IS NULL THEN
    RAISE WARNING '⚠ Super admin role not found in roles table';
    RAISE NOTICE '  Skipping role assignment';
  ELSE
    RAISE NOTICE '✅ Super admin role found: %', v_super_admin_role_id;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 3: Get super_admin user_type ID
  -- ============================================================================

  SELECT id INTO v_super_admin_user_type_id
  FROM public.user_types
  WHERE name = 'super_admin';

  IF v_super_admin_user_type_id IS NULL THEN
    RAISE WARNING '⚠ Super admin user type not found';
  ELSE
    RAISE NOTICE '✅ Super admin user type found: %', v_super_admin_user_type_id;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 4: Assign free subscription to customer users without subscriptions
  -- ============================================================================

  RAISE NOTICE 'Step 3: Creating subscriptions for customer users...';

  INSERT INTO public.user_subscriptions (
    user_id,
    subscription_type_id,
    status,
    started_at,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    u.id,
    v_free_subscription_id,
    'active',
    NOW(),
    true,
    NOW(),
    NOW()
  FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE
    ut.category = 'customer'
    AND ut.can_have_subscription = true
    AND NOT EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = u.id
      AND us.is_active = true
      AND us.status IN ('active', 'trial')
    );

  GET DIAGNOSTICS v_subscriptions_created = ROW_COUNT;

  IF v_subscriptions_created > 0 THEN
    RAISE NOTICE '✅ Created % free subscriptions for customer users', v_subscriptions_created;
  ELSE
    RAISE NOTICE '✓ All customer users already have subscriptions';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 5: Assign super_admin role to super_admin users without roles
  -- ============================================================================

  IF v_super_admin_role_id IS NOT NULL AND v_super_admin_user_type_id IS NOT NULL THEN
    RAISE NOTICE 'Step 4: Assigning super_admin role...';

    INSERT INTO public.user_roles (
      user_id,
      role_id,
      property_id,
      created_at
    )
    SELECT
      u.id,
      v_super_admin_role_id,
      NULL, -- Global role, not property-specific
      NOW()
    FROM public.users u
    WHERE
      u.user_type_id = v_super_admin_user_type_id
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = u.id
        AND ur.role_id = v_super_admin_role_id
      );

    GET DIAGNOSTICS v_roles_assigned = ROW_COUNT;

    IF v_roles_assigned > 0 THEN
      RAISE NOTICE '✅ Assigned super_admin role to % users', v_roles_assigned;
    ELSE
      RAISE NOTICE '✓ All super admin users already have roles';
    END IF;
  ELSE
    RAISE NOTICE '⊘ Skipping role assignment (super_admin role or user type not found)';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 143 Completed Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Free subscription activated: %', v_free_subscription_id;
  RAISE NOTICE '  • Subscriptions created: %', v_subscriptions_created;
  RAISE NOTICE '  • Roles assigned: %', v_roles_assigned;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run migration 144 (validation triggers)';
  RAISE NOTICE '  2. Run migration 145 (enhance user trigger)';
  RAISE NOTICE '  3. Restart backend server';
  RAISE NOTICE '  4. Test dashboard access';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

END $$;
