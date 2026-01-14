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
-- 6. USERS TABLE (extends auth.users)
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
