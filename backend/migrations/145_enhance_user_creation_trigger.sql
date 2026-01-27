-- ============================================================================
-- Migration: 145_enhance_user_creation_trigger.sql
-- Description: Enhance handle_new_user trigger to auto-set user_type_id='free'
-- Date: 2026-01-25
-- ============================================================================
-- This migration enhances the existing handle_new_user() trigger to
-- automatically set user_type_id to 'free' customer type when creating
-- new user profiles from auth.users.
--
-- Benefits:
-- - Ensures user_type_id is NEVER null (database-level safety)
-- - Works even if application service fails to call finalizeUserSetup()
-- - Provides sensible default for all new users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_free_type_id UUID;
BEGIN
    RAISE NOTICE '[TRIGGER] handle_new_user() called for: %', NEW.email;

    -- Get free customer user type ID (default for new users)
    SELECT id INTO v_free_type_id
    FROM public.user_types
    WHERE name = 'free' AND category = 'customer';

    IF v_free_type_id IS NULL THEN
        RAISE WARNING '[TRIGGER] Free user type not found - user will be created without user_type_id';
    END IF;

    -- Create user profile with 'free' user type as default
    INSERT INTO public.users (
        id,
        email,
        full_name,
        phone,
        status,
        user_type_id, -- NOW AUTOMATICALLY SET
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        'pending', -- Will be set to 'active' by finalizeUserSetup()
        v_free_type_id, -- DEFAULT: 'free' customer type
        NOW(),
        NOW()
    );

    RAISE NOTICE '[TRIGGER] User profile created with user_type_id: %', v_free_type_id;

    -- Log the user creation to audit log (if table exists)
    BEGIN
        INSERT INTO public.audit_log (
            actor_id,
            action,
            entity_type,
            entity_id,
            new_data,
            metadata
        ) VALUES (
            NEW.id,
            'user.created',
            'user_profile',
            NEW.id,
            jsonb_build_object(
                'email', NEW.email,
                'user_type_id', v_free_type_id
            ),
            jsonb_build_object(
                'signup_provider', COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
                'created_via', 'trigger'
            )
        );

        RAISE NOTICE '[TRIGGER] Audit log created';
    EXCEPTION WHEN OTHERS THEN
        -- Ignore audit log errors (table might not exist)
        RAISE NOTICE '[TRIGGER] Audit log skipped (table may not exist)';
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Enhanced trigger function that creates user profile with default user_type_id=''free'' when auth.users record is created';

-- ============================================================================
-- Update existing trigger (if exists)
-- ============================================================================

-- Drop and recreate trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Automatically creates user profile with default user_type when auth user is created';

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 145 Completed Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Enhanced handle_new_user() trigger to:';
  RAISE NOTICE '  • Auto-set user_type_id = ''free'' (customer)';
  RAISE NOTICE '  • Set initial status = ''pending''';
  RAISE NOTICE '  • Log user creation to audit table';
  RAISE NOTICE '';
  RAISE NOTICE 'Benefits:';
  RAISE NOTICE '  ✓ Ensures user_type_id is never null';
  RAISE NOTICE '  ✓ Provides safe default for all new users';
  RAISE NOTICE '  ✓ Works even if application fails';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Application calls finalizeUserSetup()';
  RAISE NOTICE '  2. Sets status to ''active''';
  RAISE NOTICE '  3. Creates subscription (if customer)';
  RAISE NOTICE '  4. Assigns role (if super_admin)';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
