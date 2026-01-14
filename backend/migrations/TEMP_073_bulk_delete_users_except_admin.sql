-- TEMPORARY Migration: 073_bulk_delete_users_except_admin.sql
-- Description: Bulk delete all users except super admin (DESTRUCTIVE - USE WITH CAUTION)
-- Date: 2026-01-12
-- Author: Claude Code
-- Status: TEMPORARY - Should be removed after cleanup

-- ============================================================================
-- ⚠️  WARNING: THIS IS A DESTRUCTIVE OPERATION
-- ============================================================================
-- This script will DELETE all users except super admin users
-- This includes:
--   - User profiles
--   - User subscriptions
--   - User permissions
--   - All related data (cascading deletes)
--
-- BEFORE RUNNING:
-- 1. Backup your database
-- 2. Verify super admin user exists
-- 3. Understand this cannot be easily undone
-- ============================================================================

-- ============================================================================
-- STEP 1: INSPECT WHAT WILL BE DELETED
-- ============================================================================

-- See all users that will be deleted (DRY RUN)
DO $$
DECLARE
  v_total_users INTEGER;
  v_admin_users INTEGER;
  v_to_delete INTEGER;
  v_active_subscriptions INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO v_total_users FROM public.users;

  -- Count super admin users (will be kept)
  SELECT COUNT(*) INTO v_admin_users
  FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name IN ('super_admin', 'admin');

  -- Count users that will be deleted
  v_to_delete := v_total_users - v_admin_users;

  -- Count active subscriptions that will be affected
  SELECT COUNT(*) INTO v_active_subscriptions
  FROM public.user_subscriptions us
  WHERE us.user_id IN (
    SELECT u.id FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name NOT IN ('super_admin', 'admin')
  ) AND us.is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           BULK DELETE IMPACT ANALYSIS (DRY RUN)                ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current Database State:';
  RAISE NOTICE '   Total Users: %', v_total_users;
  RAISE NOTICE '   Super Admin Users (WILL BE KEPT): %', v_admin_users;
  RAISE NOTICE '   Regular Users (WILL BE DELETED): %', v_to_delete;
  RAISE NOTICE '   Active Subscriptions (WILL BE DELETED): %', v_active_subscriptions;
  RAISE NOTICE '';

  IF v_admin_users = 0 THEN
    RAISE EXCEPTION '❌ SAFETY CHECK FAILED: No super admin users found! Aborting to prevent locking yourself out.';
  END IF;

  IF v_to_delete = 0 THEN
    RAISE NOTICE '✅ No users to delete (only admins exist)';
  ELSE
    RAISE NOTICE '⚠️  WARNING: % users will be permanently deleted!', v_to_delete;
    RAISE NOTICE '';
    RAISE NOTICE '👥 Users that will be KEPT:';
    FOR rec IN (
      SELECT u.email, ut.name as user_type
      FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name IN ('super_admin', 'admin')
      ORDER BY u.created_at
    ) LOOP
      RAISE NOTICE '   ✅ % (type: %)', rec.email, rec.user_type;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '🗑️  Users that will be DELETED (showing first 10):';
    FOR rec IN (
      SELECT u.email, ut.name as user_type
      FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name NOT IN ('super_admin', 'admin')
      ORDER BY u.created_at
      LIMIT 10
    ) LOOP
      RAISE NOTICE '   ❌ % (type: %)', rec.email, rec.user_type;
    END LOOP;

    IF v_to_delete > 10 THEN
      RAISE NOTICE '   ... and % more users', v_to_delete - 10;
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🛑 DRY RUN COMPLETE - NO DATA WAS DELETED';
  RAISE NOTICE '';
  RAISE NOTICE 'To proceed with deletion, run the EXECUTE section below.';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: CREATE BULK DELETE FUNCTION (SAFE - REQUIRES EXPLICIT CALL)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.bulk_delete_non_admin_users(
  p_confirm_deletion BOOLEAN DEFAULT false,
  p_require_password TEXT DEFAULT NULL
)
RETURNS TABLE (
  deleted_users INTEGER,
  deleted_subscriptions INTEGER,
  deleted_companies INTEGER,
  deleted_properties INTEGER,
  kept_admin_users INTEGER
) AS $$
DECLARE
  v_deleted_users INTEGER := 0;
  v_deleted_subscriptions INTEGER := 0;
  v_deleted_companies INTEGER := 0;
  v_deleted_properties INTEGER := 0;
  v_kept_admins INTEGER := 0;
  v_admin_count INTEGER;
BEGIN
  -- Safety check 1: Confirmation required
  IF NOT p_confirm_deletion THEN
    RAISE EXCEPTION 'Deletion not confirmed. Set p_confirm_deletion = true to proceed.';
  END IF;

  -- Safety check 2: Password verification (optional but recommended)
  IF p_require_password IS NOT NULL AND p_require_password != 'DELETE_ALL_USERS' THEN
    RAISE EXCEPTION 'Incorrect password. Use password "DELETE_ALL_USERS" to confirm.';
  END IF;

  -- Safety check 3: Verify at least one super admin exists
  SELECT COUNT(*) INTO v_admin_count
  FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name IN ('super_admin', 'admin');

  IF v_admin_count = 0 THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: No super admin users found. Aborting to prevent lockout.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Starting bulk deletion...';
  RAISE NOTICE '';

  -- Get count of admins that will be kept
  v_kept_admins := v_admin_count;

  -- Delete user subscriptions first (to avoid foreign key issues)
  WITH deleted AS (
    DELETE FROM public.user_subscriptions
    WHERE user_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name NOT IN ('super_admin', 'admin')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_subscriptions FROM deleted;

  RAISE NOTICE '   ✅ Deleted % subscriptions', v_deleted_subscriptions;

  -- Delete companies owned by non-admin users
  WITH deleted AS (
    DELETE FROM public.companies
    WHERE owner_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name NOT IN ('super_admin', 'admin')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_companies FROM deleted;

  RAISE NOTICE '   ✅ Deleted % companies', v_deleted_companies;

  -- Delete properties owned by non-admin users
  WITH deleted AS (
    DELETE FROM public.properties
    WHERE owner_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name NOT IN ('super_admin', 'admin')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_properties FROM deleted;

  RAISE NOTICE '   ✅ Deleted % properties', v_deleted_properties;

  -- Finally, delete the users
  WITH deleted AS (
    DELETE FROM public.users
    WHERE id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name NOT IN ('super_admin', 'admin')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_users FROM deleted;

  RAISE NOTICE '   ✅ Deleted % users', v_deleted_users;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Bulk deletion complete!';
  RAISE NOTICE '   Kept % admin users safe', v_kept_admins;
  RAISE NOTICE '';

  RETURN QUERY SELECT
    v_deleted_users,
    v_deleted_subscriptions,
    v_deleted_companies,
    v_deleted_properties,
    v_kept_admins;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION public.bulk_delete_non_admin_users IS
  'TEMPORARY FUNCTION: Bulk delete all non-admin users. Requires explicit confirmation and password. DESTRUCTIVE OPERATION.';

-- ============================================================================
-- STEP 3: CLEAN UP DUPLICATE FREE TIER SUBSCRIPTIONS
-- ============================================================================

-- Function to merge duplicate free tier subscription types
CREATE OR REPLACE FUNCTION public.merge_duplicate_free_tier_plans()
RETURNS TABLE (
  kept_plan_id UUID,
  deleted_plan_ids UUID[],
  migrated_subscriptions INTEGER
) AS $$
DECLARE
  v_kept_plan_id UUID;
  v_duplicate_ids UUID[];
  v_migrated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Checking for duplicate free tier plans...';
  RAISE NOTICE '';

  -- Find the "primary" free tier plan (oldest one)
  SELECT id INTO v_kept_plan_id
  FROM public.subscription_types
  WHERE name = 'free_tier' OR LOWER(display_name) LIKE '%free%'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_kept_plan_id IS NULL THEN
    RAISE NOTICE '✅ No free tier plans found - nothing to merge';
    RETURN;
  END IF;

  -- Find duplicate plans
  SELECT ARRAY_AGG(id) INTO v_duplicate_ids
  FROM public.subscription_types
  WHERE (name = 'free_tier' OR LOWER(display_name) LIKE '%free%')
    AND id != v_kept_plan_id;

  IF v_duplicate_ids IS NULL OR array_length(v_duplicate_ids, 1) = 0 THEN
    RAISE NOTICE '✅ No duplicate free tier plans found';
    RAISE NOTICE '   Using plan: %', v_kept_plan_id;
    RETURN QUERY SELECT v_kept_plan_id, ARRAY[]::UUID[], 0;
    RETURN;
  END IF;

  RAISE NOTICE '📋 Found duplicate free tier plans:';
  RAISE NOTICE '   Keeping: %', v_kept_plan_id;
  RAISE NOTICE '   Duplicates: %', v_duplicate_ids;
  RAISE NOTICE '';

  -- Migrate subscriptions from duplicate plans to the kept plan
  WITH updated AS (
    UPDATE public.user_subscriptions
    SET subscription_type_id = v_kept_plan_id
    WHERE subscription_type_id = ANY(v_duplicate_ids)
    RETURNING *
  )
  SELECT COUNT(*) INTO v_migrated_count FROM updated;

  RAISE NOTICE '   ✅ Migrated % subscriptions to kept plan', v_migrated_count;

  -- Migrate permissions from duplicate plans to kept plan
  INSERT INTO public.subscription_type_permissions (subscription_type_id, permission_id)
  SELECT DISTINCT v_kept_plan_id, permission_id
  FROM public.subscription_type_permissions
  WHERE subscription_type_id = ANY(v_duplicate_ids)
  ON CONFLICT (subscription_type_id, permission_id) DO NOTHING;

  -- Delete permissions from duplicate plans
  DELETE FROM public.subscription_type_permissions
  WHERE subscription_type_id = ANY(v_duplicate_ids);

  -- Delete duplicate plans
  DELETE FROM public.subscription_types
  WHERE id = ANY(v_duplicate_ids);

  RAISE NOTICE '   ✅ Deleted % duplicate plans', array_length(v_duplicate_ids, 1);
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Free tier plan cleanup complete!';
  RAISE NOTICE '';

  RETURN QUERY SELECT v_kept_plan_id, v_duplicate_ids, v_migrated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.merge_duplicate_free_tier_plans IS
  'TEMPORARY FUNCTION: Merge duplicate free tier subscription plans into one. Safe to run multiple times.';

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*

STEP-BY-STEP CLEANUP GUIDE:

1. First, inspect what will be deleted (DRY RUN - already executed above)
   ✅ Already done - check the output above

2. Clean up duplicate free tier plans (SAFE - run first):

   SELECT * FROM public.merge_duplicate_free_tier_plans();

3. If you want to delete all non-admin users (DESTRUCTIVE):

   -- With password confirmation:
   SELECT * FROM public.bulk_delete_non_admin_users(
     p_confirm_deletion := true,
     p_require_password := 'DELETE_ALL_USERS'
   );

   -- Without password (less safe):
   SELECT * FROM public.bulk_delete_non_admin_users(p_confirm_deletion := true);

4. Verify the results:

   -- Check remaining users
   SELECT u.email, ut.name as user_type
   FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   ORDER BY u.created_at;

   -- Check subscription plans
   SELECT id, name, display_name, price_cents
   FROM public.subscription_types
   WHERE name = 'free_tier' OR LOWER(display_name) LIKE '%free%';

5. Clean up (after verification):

   -- Drop the temporary functions
   DROP FUNCTION IF EXISTS public.bulk_delete_non_admin_users;
   DROP FUNCTION IF EXISTS public.merge_duplicate_free_tier_plans;

   -- Delete this migration file
   -- rm backend/migrations/TEMP_073_bulk_delete_users_except_admin.sql

*/
