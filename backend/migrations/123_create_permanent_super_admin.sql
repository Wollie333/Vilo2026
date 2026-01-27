-- Migration: 123_create_permanent_super_admin.sql
-- Description: Create permanent super admin account (admin@vilo.com) that cannot be deleted or demoted
-- Date: 2026-01-18

-- ============================================================================
-- PERMANENT SUPER ADMIN ACCOUNT
-- ============================================================================

-- Create/update admin@vilo.com as permanent super admin
DO $$
DECLARE
  v_admin_user_id UUID;
  v_super_admin_type_id UUID;
BEGIN
  -- Get super_admin user type ID
  SELECT id INTO v_super_admin_type_id
  FROM public.user_types
  WHERE name = 'super_admin'
  LIMIT 1;

  IF v_super_admin_type_id IS NULL THEN
    RAISE EXCEPTION 'super_admin user type not found. Please ensure user types are created first.';
  END IF;

  -- Check if admin@vilo.com exists in auth.users
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'admin@vilo.com'
  LIMIT 1;

  IF v_admin_user_id IS NOT NULL THEN
    -- User exists - update to ensure it's a super admin
    UPDATE public.users
    SET
      user_type_id = v_super_admin_type_id,
      status = 'active',
      updated_at = NOW()
    WHERE id = v_admin_user_id;

    RAISE NOTICE 'Updated admin@vilo.com to permanent super admin status';
  ELSE
    RAISE NOTICE 'admin@vilo.com not found in auth.users. Please create this account manually via Supabase Auth.';
  END IF;
END $$;

-- ============================================================================
-- PROTECTION TRIGGER: Prevent demotion or deletion of permanent super admin
-- ============================================================================

-- Function to protect permanent super admin
CREATE OR REPLACE FUNCTION protect_permanent_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion of admin@vilo.com
  IF (TG_OP = 'DELETE') THEN
    IF OLD.email = 'admin@vilo.com' THEN
      RAISE EXCEPTION 'Cannot delete permanent super admin account (admin@vilo.com)';
    END IF;
    RETURN OLD;
  END IF;

  -- Prevent demotion of admin@vilo.com
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.email = 'admin@vilo.com' THEN
      -- Prevent status change
      IF NEW.status != 'active' THEN
        RAISE EXCEPTION 'Cannot deactivate permanent super admin account (admin@vilo.com)';
      END IF;

      -- Ensure user_type_id remains super_admin
      DECLARE
        v_super_admin_type_id UUID;
      BEGIN
        SELECT id INTO v_super_admin_type_id
        FROM public.user_types
        WHERE name = 'super_admin'
        LIMIT 1;

        IF NEW.user_type_id != v_super_admin_type_id THEN
          RAISE EXCEPTION 'Cannot change user type of permanent super admin (admin@vilo.com)';
        END IF;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON public.users;

-- Create trigger
CREATE TRIGGER protect_super_admin_trigger
  BEFORE UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION protect_permanent_super_admin();

COMMENT ON FUNCTION protect_permanent_super_admin() IS 'Prevents deletion or demotion of admin@vilo.com account';
COMMENT ON TRIGGER protect_super_admin_trigger ON public.users IS 'Protects permanent super admin from modification';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify admin account exists and has correct permissions
SELECT
  id,
  email,
  status,
  user_type_id,
  (SELECT name FROM public.user_types WHERE id = users.user_type_id) as user_type_name
FROM public.users
WHERE email = 'admin@vilo.com';
