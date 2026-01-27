-- ============================================================================
-- Migration: 140_auto_assign_subscriptions_and_roles.sql
-- Description: Backfill missing subscriptions for customer users and roles for super_admin
-- Date: 2026-01-25
-- ============================================================================
-- This migration ensures all existing users have:
-- 1. Free tier subscription (if they're customer users without subscriptions)
-- 2. Super admin role (if they're super_admin users without roles)
-- ============================================================================

DO $$
DECLARE
  v_free_tier_id UUID;
  v_super_admin_role_id UUID;
  v_subscriptions_created INTEGER := 0;
  v_roles_assigned INTEGER := 0;
  v_customer_users_count INTEGER;
  v_super_admin_users_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Auto-Assign Subscriptions and Roles';
  RAISE NOTICE 'Migration 140';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- VALIDATION: Check required tables and types exist
  -- ============================================================================

  -- Get free tier subscription type ID
  SELECT id INTO v_free_tier_id
  FROM public.subscription_types
  WHERE name = 'free_tier'
  AND is_active = true;

  IF v_free_tier_id IS NULL THEN
    RAISE EXCEPTION 'Free tier subscription type not found. Please run migration 068 first.';
  END IF;

  RAISE NOTICE '✓ Free tier subscription type found: %', v_free_tier_id;

  -- Get super_admin role ID (optional - not all systems may have this)
  SELECT id INTO v_super_admin_role_id
  FROM public.roles
  WHERE name = 'super_admin';

  IF v_super_admin_role_id IS NULL THEN
    RAISE NOTICE '⚠ Super admin role not found in roles table';
    RAISE NOTICE '  Users will rely on user_type permissions only';
  ELSE
    RAISE NOTICE '✓ Super admin role found: %', v_super_admin_role_id;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 1: Assign Free Tier to Customer Users Without Subscriptions
  -- ============================================================================

  -- Count customer users without subscriptions
  SELECT COUNT(*) INTO v_customer_users_count
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

  RAISE NOTICE 'Customer users without subscriptions: %', v_customer_users_count;

  IF v_customer_users_count > 0 THEN
    RAISE NOTICE 'Creating free tier subscriptions...';

    -- Insert free tier subscriptions for customer users without active subscriptions
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
      v_free_tier_id,
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
    RAISE NOTICE '✅ Created % free tier subscriptions', v_subscriptions_created;
  ELSE
    RAISE NOTICE '✓ All customer users already have subscriptions';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 2: Assign Super Admin Role to Super Admin Users Without Roles
  -- ============================================================================

  IF v_super_admin_role_id IS NOT NULL THEN
    -- Count super admin users without roles
    SELECT COUNT(*) INTO v_super_admin_users_count
    FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE
      ut.name = 'super_admin'
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = u.id
        AND ur.role_id = v_super_admin_role_id
      );

    RAISE NOTICE 'Super admin users without roles: %', v_super_admin_users_count;

    IF v_super_admin_users_count > 0 THEN
      RAISE NOTICE 'Assigning super_admin role...';

      -- Insert super_admin role for super_admin users without it
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
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE
        ut.name = 'super_admin'
        AND NOT EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = u.id
          AND ur.role_id = v_super_admin_role_id
        );

      GET DIAGNOSTICS v_roles_assigned = ROW_COUNT;
      RAISE NOTICE '✅ Assigned super_admin role to % users', v_roles_assigned;
    ELSE
      RAISE NOTICE '✓ All super admin users already have roles';
    END IF;
  ELSE
    RAISE NOTICE '⊘ Skipping role assignment (super_admin role not found)';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 140 Completed Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Customer users checked: %', v_customer_users_count;
  RAISE NOTICE '  • Subscriptions created: %', v_subscriptions_created;
  RAISE NOTICE '  • Super admin users checked: %', COALESCE(v_super_admin_users_count, 0);
  RAISE NOTICE '  • Roles assigned: %', v_roles_assigned;
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Log to audit table (if exists)
  BEGIN
    INSERT INTO public.audit_log (
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      (SELECT id FROM public.users LIMIT 1), -- First user as actor
      'migration.140.completed',
      'migration',
      '140',
      jsonb_build_object(
        'subscriptions_created', v_subscriptions_created,
        'roles_assigned', v_roles_assigned,
        'executed_at', NOW()
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore audit log errors
    NULL;
  END;

END $$;

-- ============================================================================
-- VERIFICATION QUERY (run this after migration to verify)
-- ============================================================================
-- Uncomment and run this query to verify the migration worked:
/*
SELECT
  ut.name as user_type,
  ut.category,
  COUNT(u.id) as total_users,
  COUNT(us.id) as users_with_subscription,
  COUNT(ur.id) as users_with_role
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
LEFT JOIN public.user_subscriptions us ON us.user_id = u.id AND us.is_active = true
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
GROUP BY ut.name, ut.category
ORDER BY ut.category, ut.name;
*/
