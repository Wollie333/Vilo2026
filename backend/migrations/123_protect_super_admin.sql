-- Migration: 123_protect_super_admin.sql
-- Description: Ensure admin@vilo.com is always a super admin and cannot be modified
-- Date: 2026-01-18

-- ============================================================================
-- SET ADMIN@VILO.COM AS SUPER ADMIN
-- ============================================================================

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
    RAISE EXCEPTION 'super_admin user type not found';
  END IF;

  -- Check if admin@vilo.com exists
  SELECT id INTO v_admin_user_id
  FROM public.users
  WHERE email = 'admin@vilo.com'
  LIMIT 1;

  IF v_admin_user_id IS NOT NULL THEN
    -- Update to ensure super admin
    UPDATE public.users
    SET
      user_type_id = v_super_admin_type_id,
      status = 'active',
      updated_at = NOW()
    WHERE id = v_admin_user_id;

    RAISE NOTICE 'admin@vilo.com set as super admin';
  ELSE
    RAISE NOTICE 'admin@vilo.com not found - please create account first';
  END IF;
END $$;

-- ============================================================================
-- PROTECTION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_super_admin()
RETURNS TRIGGER AS $$
DECLARE
  v_super_admin_type_id UUID;
BEGIN
  -- Get super_admin type ID
  SELECT id INTO v_super_admin_type_id
  FROM public.user_types
  WHERE name = 'super_admin'
  LIMIT 1;

  -- Prevent deletion of admin@vilo.com
  IF (TG_OP = 'DELETE') THEN
    IF OLD.email = 'admin@vilo.com' THEN
      RAISE EXCEPTION 'Cannot delete admin@vilo.com';
    END IF;
    RETURN OLD;
  END IF;

  -- Prevent modification of admin@vilo.com
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.email = 'admin@vilo.com' THEN
      -- Force active status
      IF NEW.status != 'active' THEN
        RAISE EXCEPTION 'Cannot change status of admin@vilo.com';
      END IF;

      -- Force super_admin user_type_id
      IF NEW.user_type_id != v_super_admin_type_id THEN
        RAISE EXCEPTION 'Cannot change user_type_id of admin@vilo.com';
      END IF;

      -- Prevent email change
      IF NEW.email != 'admin@vilo.com' THEN
        RAISE EXCEPTION 'Cannot change email of admin@vilo.com';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON public.users;

CREATE TRIGGER protect_super_admin_trigger
  BEFORE UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION protect_super_admin();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  email,
  status,
  (SELECT name FROM public.user_types WHERE id = users.user_type_id) as user_type
FROM public.users
WHERE email = 'admin@vilo.com';
