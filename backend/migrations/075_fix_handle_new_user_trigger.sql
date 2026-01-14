-- =====================================================
-- MIGRATION: 075_fix_handle_new_user_trigger.sql
-- Description: Fix handle_new_user trigger to remove audit_log dependency
-- Date: 2026-01-12
-- =====================================================

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate handle_new_user function without audit_log insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile with pending status
    INSERT INTO public.users (
        id,
        email,
        full_name,
        phone,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        'pending',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Also fix handle_email_confirmed trigger
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.users
        SET
            email_verified_at = NEW.email_confirmed_at,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at)
    EXECUTE FUNCTION public.handle_email_confirmed();

-- =====================================================
-- Fix handle_user_login trigger
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
        UPDATE public.users
        SET
            last_login_at = NEW.last_sign_in_at,
            last_active_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
    EXECUTE FUNCTION public.handle_user_login();
