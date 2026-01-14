-- =====================================================
-- MIGRATION: 003_create_rls_policies.sql
-- Description: Row Level Security policies for all tables
-- Run this in Supabase SQL Editor after 002
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(
    p_resource VARCHAR,
    p_action permission_action,
    p_property_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_has_deny BOOLEAN := FALSE;
    v_has_grant BOOLEAN := FALSE;
BEGIN
    -- Super admins have all permissions
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- Check for explicit user-level DENY (highest priority)
    SELECT EXISTS (
        SELECT 1 FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = v_user_id
        AND p.resource = p_resource
        AND p.action = p_action
        AND up.override_type = 'deny'
        AND (up.property_id IS NULL OR up.property_id = p_property_id)
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO v_has_deny;

    IF v_has_deny THEN
        RETURN FALSE;
    END IF;

    -- Check for explicit user-level GRANT
    SELECT EXISTS (
        SELECT 1 FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = v_user_id
        AND p.resource = p_resource
        AND p.action = p_action
        AND up.override_type = 'grant'
        AND (up.property_id IS NULL OR up.property_id = p_property_id)
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO v_has_grant;

    IF v_has_grant THEN
        RETURN TRUE;
    END IF;

    -- Check role-based permissions
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = v_user_id
        AND p.resource = p_resource
        AND p.action = p_action
        AND (ur.property_id IS NULL OR ur.property_id = p_property_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to a property
CREATE OR REPLACE FUNCTION public.has_property_access(p_property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_properties
        WHERE user_id = auth.uid()
        AND property_id = p_property_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's account status
CREATE OR REPLACE FUNCTION public.get_user_status()
RETURNS user_status AS $$
    SELECT status FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- PERMISSIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "Permissions viewable by authenticated users"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Only super admins can insert permissions"
    ON public.permissions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Only super admins can update permissions"
    ON public.permissions FOR UPDATE
    TO authenticated
    USING (public.is_super_admin());

CREATE POLICY "Only super admins can delete permissions"
    ON public.permissions FOR DELETE
    TO authenticated
    USING (public.is_super_admin());

-- =====================================================
-- ROLES TABLE POLICIES
-- =====================================================

CREATE POLICY "Roles viewable by authenticated users"
    ON public.roles FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Only super admins can insert roles"
    ON public.roles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Only super admins can update roles"
    ON public.roles FOR UPDATE
    TO authenticated
    USING (public.is_super_admin());

CREATE POLICY "Only super admins can delete non-system roles"
    ON public.roles FOR DELETE
    TO authenticated
    USING (public.is_super_admin() AND NOT is_system_role);

-- =====================================================
-- ROLE_PERMISSIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "Role permissions viewable by authenticated users"
    ON public.role_permissions FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Only super admins can manage role permissions"
    ON public.role_permissions FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- =====================================================
-- PROPERTIES TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view assigned properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.has_property_access(id)
    );

CREATE POLICY "Only super admins can create properties"
    ON public.properties FOR INSERT
    TO authenticated
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Property managers can update their properties"
    ON public.properties FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR (public.has_property_access(id) AND public.has_permission('properties', 'update', id))
    );

CREATE POLICY "Only super admins can delete properties"
    ON public.properties FOR DELETE
    TO authenticated
    USING (public.is_super_admin());

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON public.users FOR SELECT
    TO authenticated
    USING (public.has_permission('users', 'read'));

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (public.has_permission('users', 'update'));

CREATE POLICY "Service role can insert profiles"
    ON public.users FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

-- =====================================================
-- USER_ROLES TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.has_permission('users', 'read'));

CREATE POLICY "Only super admins can manage user roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- =====================================================
-- USER_PERMISSIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own permissions"
    ON public.user_permissions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user permissions"
    ON public.user_permissions FOR SELECT
    TO authenticated
    USING (public.has_permission('users', 'read'));

CREATE POLICY "Only super admins can manage user permissions"
    ON public.user_permissions FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- =====================================================
-- USER_PROPERTIES TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own property assignments"
    ON public.user_properties FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all property assignments"
    ON public.user_properties FOR SELECT
    TO authenticated
    USING (public.has_permission('users', 'read'));

CREATE POLICY "Only super admins can manage property assignments"
    ON public.user_properties FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- =====================================================
-- AUDIT_LOG TABLE POLICIES
-- =====================================================

CREATE POLICY "Super admins can view audit logs"
    ON public.audit_log FOR SELECT
    TO authenticated
    USING (public.is_super_admin());

CREATE POLICY "Service role can insert audit logs"
    ON public.audit_log FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

-- =====================================================
-- USER_SESSIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view own sessions"
    ON public.user_sessions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
    ON public.user_sessions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all sessions"
    ON public.user_sessions FOR ALL
    TO authenticated
    USING (public.is_super_admin());

CREATE POLICY "Service role can manage sessions"
    ON public.user_sessions FOR ALL
    TO service_role
    WITH CHECK (TRUE);
