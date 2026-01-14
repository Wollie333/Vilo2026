-- =====================================================
-- MIGRATION: 001_create_auth_schema.sql
-- Description: Core authentication and user management tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- User account status enum
CREATE TYPE user_status AS ENUM (
    'pending',      -- Just signed up, awaiting approval
    'active',       -- Approved and active
    'suspended',    -- Temporarily disabled by admin
    'deactivated'   -- Permanently disabled
);

-- Permission action types
CREATE TYPE permission_action AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'manage'        -- Full CRUD + special actions
);

-- Override type for user-specific permissions
CREATE TYPE permission_override AS ENUM (
    'grant',        -- Explicitly grant (even if role doesn't have it)
    'deny'          -- Explicitly deny (even if role has it)
);

-- =====================================================
-- 2. PERMISSIONS TABLE
-- =====================================================

CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource VARCHAR(100) NOT NULL,
    action permission_action NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(resource, action)
);

COMMENT ON TABLE public.permissions IS 'Defines all available permissions in the system';

-- =====================================================
-- 3. ROLES TABLE
-- =====================================================

CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.roles IS 'Defines roles that can be assigned to users';

-- =====================================================
-- 4. ROLE_PERMISSIONS (Many-to-Many)
-- =====================================================

CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE public.role_permissions IS 'Links roles to their permissions';

-- =====================================================
-- 5. PROPERTIES TABLE
-- =====================================================

CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_country VARCHAR(100) NOT NULL DEFAULT 'United States',
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.properties IS 'Properties for multi-tenancy isolation';

-- =====================================================
-- 6. users TABLE (extends auth.users)
-- =====================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    timezone VARCHAR(100) DEFAULT 'UTC',
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_country VARCHAR(100),
    company_name VARCHAR(255),
    preferences JSONB NOT NULL DEFAULT '{
        "notifications": {
            "email": true,
            "push": true,
            "sms": false
        },
        "language": "en",
        "dateFormat": "MM/DD/YYYY",
        "theme": "system"
    }',
    status user_status NOT NULL DEFAULT 'pending',
    email_verified_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    last_login_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Extended user profile data linked to Supabase auth.users';

-- =====================================================
-- 7. USER_ROLES (Many-to-Many)
-- =====================================================

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id, property_id)
);

COMMENT ON TABLE public.user_roles IS 'Assigns roles to users, optionally scoped to properties';

-- =====================================================
-- 8. USER_PERMISSIONS (Direct overrides)
-- =====================================================

CREATE TABLE public.user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    override_type permission_override NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, permission_id, property_id)
);

COMMENT ON TABLE public.user_permissions IS 'Direct permission overrides for specific users';

-- =====================================================
-- 9. USER_PROPERTIES (Property assignments)
-- =====================================================

CREATE TABLE public.user_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

COMMENT ON TABLE public.user_properties IS 'Assigns users to properties for multi-tenancy';

-- =====================================================
-- 10. AUDIT_LOG TABLE
-- =====================================================

CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Immutable audit trail for all sensitive operations';

-- =====================================================
-- 11. USER_SESSIONS TABLE
-- =====================================================

CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255),
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_sessions IS 'Tracks active user sessions for security';
-- =====================================================
-- MIGRATION: 002_create_indexes.sql
-- Description: Performance indexes for auth tables
-- Run this in Supabase SQL Editor after 001
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_user_roles_property_id ON public.user_roles(property_id) WHERE property_id IS NOT NULL;

-- User permissions indexes
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_expires ON public.user_permissions(expires_at)
    WHERE expires_at IS NOT NULL;

-- User properties indexes
CREATE INDEX idx_user_properties_user_id ON public.user_properties(user_id);
CREATE INDEX idx_user_properties_property_id ON public.user_properties(property_id);

-- Role permissions indexes
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);

-- Properties indexes
CREATE INDEX idx_properties_slug ON public.properties(slug);
CREATE INDEX idx_properties_is_active ON public.properties(is_active) WHERE is_active = TRUE;

-- Audit log indexes (critical for querying)
CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_property_id ON public.audit_log(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at) WHERE is_active = TRUE;
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
-- users TABLE POLICIES
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
-- =====================================================
-- MIGRATION: 005_seed_data.sql
-- Description: Initial permissions, roles, and role assignments
-- Run this in Supabase SQL Editor after 004
-- =====================================================

-- =====================================================
-- 1. SEED PERMISSIONS
-- =====================================================

INSERT INTO public.permissions (resource, action, description) VALUES
    -- User management
    ('users', 'create', 'Create new users'),
    ('users', 'read', 'View user profiles'),
    ('users', 'update', 'Update user profiles'),
    ('users', 'delete', 'Delete/deactivate users'),
    ('users', 'manage', 'Full user management including roles and approvals'),

    -- Role management
    ('roles', 'create', 'Create new roles'),
    ('roles', 'read', 'View roles'),
    ('roles', 'update', 'Update roles'),
    ('roles', 'delete', 'Delete roles'),
    ('roles', 'manage', 'Full role management'),

    -- Property management
    ('properties', 'create', 'Create new properties'),
    ('properties', 'read', 'View properties'),
    ('properties', 'update', 'Update property settings'),
    ('properties', 'delete', 'Delete properties'),
    ('properties', 'manage', 'Full property management'),

    -- Booking management
    ('bookings', 'create', 'Create bookings'),
    ('bookings', 'read', 'View bookings'),
    ('bookings', 'update', 'Modify bookings'),
    ('bookings', 'delete', 'Cancel/delete bookings'),
    ('bookings', 'manage', 'Full booking management'),

    -- Guest management
    ('guests', 'create', 'Add guests'),
    ('guests', 'read', 'View guest information'),
    ('guests', 'update', 'Update guest information'),
    ('guests', 'delete', 'Remove guests'),

    -- Analytics & Reports
    ('analytics', 'read', 'View analytics dashboards'),
    ('reports', 'create', 'Generate reports'),
    ('reports', 'read', 'View reports'),

    -- Settings
    ('settings', 'read', 'View system settings'),
    ('settings', 'update', 'Modify system settings'),

    -- Audit logs
    ('audit_logs', 'read', 'View audit logs')
ON CONFLICT (resource, action) DO NOTHING;

-- =====================================================
-- 2. SEED ROLES
-- =====================================================

INSERT INTO public.roles (name, display_name, description, is_system_role, priority) VALUES
    ('super_admin', 'Super Administrator', 'Full system access - can manage all properties and users', TRUE, 1000),
    ('property_admin', 'Property Administrator', 'Full access to assigned properties', TRUE, 500),
    ('property_manager', 'Property Manager', 'Manage bookings and day-to-day operations', TRUE, 400),
    ('front_desk', 'Front Desk Staff', 'Handle check-ins, check-outs, and guest inquiries', TRUE, 200),
    ('housekeeping', 'Housekeeping Staff', 'View schedules and update room status', TRUE, 100),
    ('readonly', 'Read Only', 'View-only access to assigned properties', TRUE, 50)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Property Admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'property_admin'
AND (
    (p.resource = 'users' AND p.action IN ('create', 'read', 'update'))
    OR (p.resource = 'properties' AND p.action IN ('read', 'update'))
    OR (p.resource = 'bookings' AND p.action = 'manage')
    OR (p.resource = 'guests' AND p.action IN ('create', 'read', 'update', 'delete'))
    OR (p.resource = 'analytics' AND p.action = 'read')
    OR (p.resource = 'reports' AND p.action IN ('create', 'read'))
    OR (p.resource = 'settings' AND p.action IN ('read', 'update'))
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Property Manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'property_manager'
AND (
    (p.resource = 'users' AND p.action = 'read')
    OR (p.resource = 'properties' AND p.action = 'read')
    OR (p.resource = 'bookings' AND p.action IN ('create', 'read', 'update'))
    OR (p.resource = 'guests' AND p.action IN ('create', 'read', 'update'))
    OR (p.resource = 'analytics' AND p.action = 'read')
    OR (p.resource = 'reports' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Front Desk
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'front_desk'
AND (
    (p.resource = 'bookings' AND p.action IN ('read', 'update'))
    OR (p.resource = 'guests' AND p.action IN ('create', 'read', 'update'))
    OR (p.resource = 'properties' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Housekeeping
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'housekeeping'
AND (
    (p.resource = 'bookings' AND p.action = 'read')
    OR (p.resource = 'properties' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Read Only
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'readonly'
AND p.action = 'read'
AND p.resource IN ('bookings', 'guests', 'properties', 'analytics')
ON CONFLICT (role_id, permission_id) DO NOTHING;
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
