-- TEMPORARY Migration: 074_bulk_deactivate_users.sql
-- Description: Bulk deactivate all users except super admin (SAFER than deletion)
-- Date: 2026-01-12
-- Author: Claude Code
-- Status: TEMPORARY

-- ============================================================================
-- BULK DEACTIVATION FUNCTION (SAFER ALTERNATIVE TO DELETION)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.bulk_deactivate_non_admin_users(
  p_confirm_deactivation BOOLEAN DEFAULT false
)
RETURNS TABLE (
  deactivated_users INTEGER,
  deactivated_subscriptions INTEGER,
  kept_admin_users INTEGER
) AS $$
DECLARE
  v_deactivated_users INTEGER := 0;
  v_deactivated_subs INTEGER := 0;
  v_kept_admins INTEGER := 0;
BEGIN
  -- Safety check: Confirmation required
  IF NOT p_confirm_deactivation THEN
    RAISE EXCEPTION 'Deactivation not confirmed. Set p_confirm_deactivation = true to proceed.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🔒 Starting bulk deactivation...';
  RAISE NOTICE '';

  -- Count admins that will be kept active
  SELECT COUNT(*) INTO v_kept_admins
  FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name IN ('super_admin', 'admin');

  -- Deactivate subscriptions for non-admin users
  WITH updated AS (
    UPDATE public.user_subscriptions
    SET
      is_active = false,
      cancelled_at = NOW(),
      cancellation_reason = 'Bulk deactivation - cleanup'
    WHERE user_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name NOT IN ('super_admin', 'admin')
    )
    AND is_active = true
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deactivated_subs FROM updated;

  RAISE NOTICE '   ✅ Deactivated % subscriptions', v_deactivated_subs;

  -- Add is_active column to users table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE '   ℹ️  Added is_active column to users table';
  END IF;

  -- Deactivate non-admin users
  WITH updated AS (
    UPDATE public.users
    SET is_active = false
    WHERE id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name NOT IN ('super_admin', 'admin')
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deactivated_users FROM updated;

  RAISE NOTICE '   ✅ Deactivated % users', v_deactivated_users;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Bulk deactivation complete!';
  RAISE NOTICE '   Kept % admin users active', v_kept_admins;
  RAISE NOTICE '';
  RAISE NOTICE '💡 Deactivated users can be reactivated later if needed.';
  RAISE NOTICE '';

  RETURN QUERY SELECT
    v_deactivated_users,
    v_deactivated_subs,
    v_kept_admins;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.bulk_deactivate_non_admin_users IS
  'TEMPORARY FUNCTION: Bulk deactivate all non-admin users (safer than deletion). Can be reversed.';

-- ============================================================================
-- REACTIVATION FUNCTION (TO UNDO DEACTIVATION)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reactivate_all_users()
RETURNS INTEGER AS $$
DECLARE
  v_reactivated INTEGER := 0;
BEGIN
  UPDATE public.users
  SET is_active = true
  WHERE is_active = false;

  GET DIAGNOSTICS v_reactivated = ROW_COUNT;

  RAISE NOTICE '✅ Reactivated % users', v_reactivated;

  RETURN v_reactivated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*

RECOMMENDED APPROACH (SAFER):

1. Deactivate users instead of deleting (can be undone):

   SELECT * FROM public.bulk_deactivate_non_admin_users(p_confirm_deactivation := true);

2. Check the results:

   -- See deactivated users
   SELECT u.email, u.is_active, ut.name as user_type
   FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE u.is_active = false;

   -- See active users (should only be admins)
   SELECT u.email, u.is_active, ut.name as user_type
   FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE u.is_active = true;

3. If you need to undo (reactivate everyone):

   SELECT public.reactivate_all_users();

4. Clean up after verification:

   DROP FUNCTION IF EXISTS public.bulk_deactivate_non_admin_users;
   DROP FUNCTION IF EXISTS public.reactivate_all_users;

*/
