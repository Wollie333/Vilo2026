-- Migration: 116_create_guest_user_type.sql
-- Description: Create 'guest' user type for public website bookings with limited portal access
-- Date: 2026-01-18

-- ============================================================================
-- CREATE GUEST USER TYPE
-- ============================================================================

-- Add 'guest' user type if not exists
INSERT INTO public.user_types (name, display_name, is_system_type, can_have_subscription, can_have_team, sort_order)
VALUES ('guest', 'Guest', FALSE, FALSE, FALSE, 100)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANT BASIC PERMISSIONS TO GUESTS
-- ============================================================================

-- Grant basic permissions to guests for viewing and managing their own bookings
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT
  ut.id,
  p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'guest'
  AND p.resource = 'bookings'
  AND p.action IN ('read', 'update')
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- Grant profile view/edit permissions to guests
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT
  ut.id,
  p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'guest'
  AND p.resource = 'profile'
  AND p.action IN ('read', 'update')
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

COMMENT ON TABLE public.user_types IS 'User types including guest accounts for public website bookings with limited portal access';
