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
