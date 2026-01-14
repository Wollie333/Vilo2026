-- =====================================================
-- MIGRATION: 004_create_triggers.sql
-- Description: Trigger functions for auth automation
-- Run this in Supabase SQL Editor after 003
-- =====================================================

-- =====================================================
-- Handle new user signup (creates profile)
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile with pending status
    INSERT INTO public.users (
        id,
        email,
        full_name,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        'pending',
        NOW(),
        NOW()
    );

    -- Log the user creation
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
        jsonb_build_object('email', NEW.email),
        jsonb_build_object('signup_provider', COALESCE(NEW.raw_user_meta_data->>'provider', 'email'))
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Handle email confirmation
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.users
        SET
            email_verified_at = NEW.email_confirmed_at,
            updated_at = NOW()
        WHERE id = NEW.id;

        INSERT INTO public.audit_log (
            actor_id,
            action,
            entity_type,
            entity_id,
            metadata
        ) VALUES (
            NEW.id,
            'user.email_verified',
            'user_profile',
            NEW.id,
            jsonb_build_object('email', NEW.email)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at)
    EXECUTE FUNCTION public.handle_email_confirmed();

-- =====================================================
-- Handle user login (update last_login_at)
-- =====================================================

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

        INSERT INTO public.audit_log (
            actor_id,
            action,
            entity_type,
            entity_id,
            metadata
        ) VALUES (
            NEW.id,
            'session.login',
            'user_profile',
            NEW.id,
            '{}'::jsonb
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
    EXECUTE FUNCTION public.handle_user_login();

-- =====================================================
-- Auto-update updated_at timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_permissions_updated_at ON public.permissions;
CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON public.permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- Ensure only one primary property per user
-- =====================================================

CREATE OR REPLACE FUNCTION public.ensure_single_primary_property()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE public.user_properties
        SET is_primary = FALSE
        WHERE user_id = NEW.user_id
        AND id != COALESCE(NEW.id, uuid_generate_v4())
        AND is_primary = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary_property_trigger ON public.user_properties;
CREATE TRIGGER ensure_single_primary_property_trigger
    BEFORE INSERT OR UPDATE ON public.user_properties
    FOR EACH ROW
    WHEN (NEW.is_primary = TRUE)
    EXECUTE FUNCTION public.ensure_single_primary_property();
