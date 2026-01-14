-- =====================================================
-- MIGRATION: 006_helper_functions.sql
-- Description: Backend helper functions for API calls
-- Run this in Supabase SQL Editor after 005
-- =====================================================

-- =====================================================
-- Approve a pending user
-- =====================================================

CREATE OR REPLACE FUNCTION public.approve_user(
    p_user_id UUID,
    p_approved_by UUID,
    p_default_role VARCHAR DEFAULT 'readonly',
    p_property_ids UUID[] DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role_id UUID;
    v_property_id UUID;
BEGIN
    -- Update user status to active
    UPDATE public.users
    SET
        status = 'active',
        approved_at = NOW(),
        approved_by = p_approved_by,
        updated_at = NOW()
    WHERE id = p_user_id
    AND status = 'pending';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Assign default role
    SELECT id INTO v_role_id FROM public.roles WHERE name = p_default_role;

    IF v_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, assigned_by)
        VALUES (p_user_id, v_role_id, p_approved_by)
        ON CONFLICT (user_id, role_id, property_id) DO NOTHING;
    END IF;

    -- Assign to properties if provided
    IF p_property_ids IS NOT NULL THEN
        FOREACH v_property_id IN ARRAY p_property_ids
        LOOP
            INSERT INTO public.user_properties (user_id, property_id, assigned_by, is_primary)
            VALUES (p_user_id, v_property_id, p_approved_by, v_property_id = p_property_ids[1])
            ON CONFLICT (user_id, property_id) DO NOTHING;
        END LOOP;
    END IF;

    -- Log the approval
    INSERT INTO public.audit_log (
        actor_id,
        action,
        entity_type,
        entity_id,
        new_data
    ) VALUES (
        p_approved_by,
        'user.approved',
        'user_profile',
        p_user_id,
        jsonb_build_object(
            'approved_by', p_approved_by,
            'default_role', p_default_role,
            'property_ids', p_property_ids
        )
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Suspend a user
-- =====================================================

CREATE OR REPLACE FUNCTION public.suspend_user(
    p_user_id UUID,
    p_suspended_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.users
    SET
        status = 'suspended',
        updated_at = NOW()
    WHERE id = p_user_id
    AND status = 'active';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Invalidate all sessions
    UPDATE public.user_sessions
    SET is_active = FALSE
    WHERE user_id = p_user_id;

    -- Log the suspension
    INSERT INTO public.audit_log (
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_suspended_by,
        'user.suspended',
        'user_profile',
        p_user_id,
        jsonb_build_object('reason', p_reason)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Reactivate a suspended user
-- =====================================================

CREATE OR REPLACE FUNCTION public.reactivate_user(
    p_user_id UUID,
    p_reactivated_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.users
    SET
        status = 'active',
        updated_at = NOW()
    WHERE id = p_user_id
    AND status = 'suspended';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Log the reactivation
    INSERT INTO public.audit_log (
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        p_reactivated_by,
        'user.reactivated',
        'user_profile',
        p_user_id,
        '{}'::jsonb
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Get all permissions for a user (computed)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    resource VARCHAR,
    action permission_action,
    property_id UUID,
    source VARCHAR
) AS $$
BEGIN
    -- Check for super admin first
    IF EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id AND r.name = 'super_admin'
    ) THEN
        RETURN QUERY
        SELECT p.resource, p.action, NULL::UUID, 'super_admin'::VARCHAR
        FROM public.permissions p;
        RETURN;
    END IF;

    -- Return merged permissions from roles and overrides
    RETURN QUERY
    WITH role_perms AS (
        SELECT
            p.resource,
            p.action,
            ur.property_id,
            'role:' || r.name AS source
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        JOIN public.role_permissions rp ON r.id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
    ),
    user_grants AS (
        SELECT
            p.resource,
            p.action,
            up.property_id,
            'direct:grant' AS source
        FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
        AND up.override_type = 'grant'
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ),
    user_denies AS (
        SELECT
            p.resource,
            p.action,
            up.property_id
        FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
        AND up.override_type = 'deny'
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    )
    SELECT DISTINCT rp.resource, rp.action, rp.property_id, rp.source
    FROM (
        SELECT * FROM role_perms
        UNION ALL
        SELECT * FROM user_grants
    ) rp
    WHERE NOT EXISTS (
        SELECT 1 FROM user_denies ud
        WHERE ud.resource = rp.resource
        AND ud.action = rp.action
        AND (ud.property_id IS NULL OR ud.property_id = rp.property_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Get user with full details (for API response)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_with_details(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'id', up.id,
        'email', up.email,
        'full_name', up.full_name,
        'phone', up.phone,
        'avatar_url', up.avatar_url,
        'timezone', up.timezone,
        'address', json_build_object(
            'street', up.address_street,
            'city', up.address_city,
            'state', up.address_state,
            'postal_code', up.address_postal_code,
            'country', up.address_country
        ),
        'company_name', up.company_name,
        'preferences', up.preferences,
        'status', up.status,
        'email_verified_at', up.email_verified_at,
        'approved_at', up.approved_at,
        'last_login_at', up.last_login_at,
        'created_at', up.created_at,
        'roles', COALESCE((
            SELECT json_agg(json_build_object(
                'id', r.id,
                'name', r.name,
                'display_name', r.display_name,
                'property_id', ur.property_id
            ))
            FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = up.id
        ), '[]'::json),
        'properties', COALESCE((
            SELECT json_agg(json_build_object(
                'id', p.id,
                'name', p.name,
                'is_primary', upr.is_primary
            ))
            FROM public.user_properties upr
            JOIN public.properties p ON upr.property_id = p.id
            WHERE upr.user_id = up.id
        ), '[]'::json)
    ) INTO v_result
    FROM public.users up
    WHERE up.id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
