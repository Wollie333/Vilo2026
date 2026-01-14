-- =====================================================
-- MIGRATION: 018_create_user_type_permissions.sql
-- Description: Create user_type_permissions table to link user types to permissions
--              This replaces the role-based permission system with user type-based permissions
-- =====================================================

-- =====================================================
-- 1. CREATE USER_TYPE_PERMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_type_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type_id UUID NOT NULL REFERENCES public.user_types(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_type_id, permission_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_type_permissions_user_type_id
ON public.user_type_permissions(user_type_id);

CREATE INDEX IF NOT EXISTS idx_user_type_permissions_permission_id
ON public.user_type_permissions(permission_id);

-- =====================================================
-- 2. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.user_type_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read user type permissions (needed for permission checks)
CREATE POLICY "user_type_permissions_select" ON public.user_type_permissions
    FOR SELECT USING (true);

-- Only super admins can modify
CREATE POLICY "user_type_permissions_insert" ON public.user_type_permissions
    FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY "user_type_permissions_update" ON public.user_type_permissions
    FOR UPDATE USING (public.is_super_admin());

CREATE POLICY "user_type_permissions_delete" ON public.user_type_permissions
    FOR DELETE USING (public.is_super_admin());

-- =====================================================
-- 3. SEED DEFAULT PERMISSIONS FOR EACH USER TYPE
-- =====================================================

-- SUPER_ADMIN: Gets ALL permissions
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'super_admin'
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- SAAS_TEAM_MEMBER: User management, settings, audit logs
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'saas_team_member'
AND (
    -- User management
    (p.resource = 'users' AND p.action IN ('read', 'update', 'manage'))
    -- Settings
    OR (p.resource = 'settings' AND p.action IN ('read', 'update'))
    -- Audit logs
    OR (p.resource = 'audit_logs' AND p.action = 'read')
    -- Analytics (view platform analytics)
    OR (p.resource = 'analytics' AND p.action = 'read')
)
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- SAAS_CUSTOMER: Property owner - manages their properties, bookings, guests
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'saas_customer'
AND (
    -- Properties - full management
    (p.resource = 'properties')
    -- Bookings - full management
    OR (p.resource = 'bookings')
    -- Guests - full management
    OR (p.resource = 'guests')
    -- Analytics - view
    OR (p.resource = 'analytics' AND p.action = 'read')
    -- Reports - create and view
    OR (p.resource = 'reports')
    -- Settings - view own settings
    OR (p.resource = 'settings' AND p.action = 'read')
    -- Users - manage their team members
    OR (p.resource = 'users' AND p.action IN ('read', 'create', 'update'))
)
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- TEAM_MEMBER: Operational access - bookings and guests
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'team_member'
AND (
    -- Bookings - operational access
    (p.resource = 'bookings' AND p.action IN ('read', 'create', 'update'))
    -- Guests - operational access
    OR (p.resource = 'guests' AND p.action IN ('read', 'create', 'update'))
    -- Properties - view only
    OR (p.resource = 'properties' AND p.action = 'read')
    -- Analytics - view
    OR (p.resource = 'analytics' AND p.action = 'read')
)
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- CLIENT: No base permissions (RLS handles access to own bookings)
-- Clients access their own bookings through RLS policies, not through permissions

-- =====================================================
-- 4. HELPER FUNCTION: Get permissions for a user type
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_type_permissions(p_user_type_id UUID)
RETURNS TABLE(permission_key TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT CONCAT(p.resource, ':', p.action) AS permission_key
    FROM public.user_type_permissions utp
    JOIN public.permissions p ON utp.permission_id = p.id
    WHERE utp.user_type_id = p_user_type_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. UPDATED PERMISSION CHECK FUNCTION
-- This now checks user_type_permissions instead of role_permissions
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_user_type_permission(
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_type_id UUID;
    v_has_permission BOOLEAN := FALSE;
    v_has_deny BOOLEAN := FALSE;
    v_has_grant BOOLEAN := FALSE;
BEGIN
    -- Get user's user_type_id
    SELECT user_type_id INTO v_user_type_id
    FROM public.users
    WHERE id = p_user_id;

    -- If no user type assigned, deny
    IF v_user_type_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check for explicit DENY in user_permissions (highest priority)
    SELECT EXISTS(
        SELECT 1 FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
        AND p.resource = p_resource
        AND p.action = p_action
        AND up.override_type = 'deny'
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO v_has_deny;

    IF v_has_deny THEN
        RETURN FALSE;
    END IF;

    -- Check for explicit GRANT in user_permissions
    SELECT EXISTS(
        SELECT 1 FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
        AND p.resource = p_resource
        AND p.action = p_action
        AND up.override_type = 'grant'
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO v_has_grant;

    IF v_has_grant THEN
        RETURN TRUE;
    END IF;

    -- Check user_type_permissions
    SELECT EXISTS(
        SELECT 1 FROM public.user_type_permissions utp
        JOIN public.permissions p ON utp.permission_id = p.id
        WHERE utp.user_type_id = v_user_type_id
        AND p.resource = p_resource
        AND p.action = p_action
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
