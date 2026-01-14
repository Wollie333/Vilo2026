-- Migration: 067_create_subscription_type_permissions.sql
-- Description: Create junction table for subscription plan permissions
-- Date: 2026-01-13
-- Author: Claude Code
-- Status: Ready for execution

-- ============================================================================
-- CREATE SUBSCRIPTION TYPE PERMISSIONS TABLE
-- ============================================================================

-- Junction table linking subscription plans to permissions
CREATE TABLE IF NOT EXISTS public.subscription_type_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_type_id UUID NOT NULL REFERENCES public.subscription_types(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_type_id, permission_id)
);

COMMENT ON TABLE public.subscription_type_permissions IS
  'Junction table linking subscription plans to their allowed permissions. Customer users get permissions from their active subscription plan.';

COMMENT ON COLUMN public.subscription_type_permissions.subscription_type_id IS
  'The subscription plan this permission is assigned to';

COMMENT ON COLUMN public.subscription_type_permissions.permission_id IS
  'The permission granted to users with this subscription plan';

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for looking up permissions by subscription type
CREATE INDEX IF NOT EXISTS idx_subscription_type_permissions_sub_type
ON public.subscription_type_permissions(subscription_type_id);

-- Index for looking up subscription types by permission
CREATE INDEX IF NOT EXISTS idx_subscription_type_permissions_permission
ON public.subscription_type_permissions(permission_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.subscription_type_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read subscription permissions (needed for permission checks)
CREATE POLICY "subscription_type_permissions_select"
ON public.subscription_type_permissions
FOR SELECT
USING (true);

-- Policy: Only super admins can modify subscription permissions
CREATE POLICY "subscription_type_permissions_modify"
ON public.subscription_type_permissions
FOR ALL
USING (public.is_super_admin());

-- ============================================================================
-- GRANT ACCESS
-- ============================================================================

GRANT ALL ON public.subscription_type_permissions TO service_role;
GRANT SELECT ON public.subscription_type_permissions TO authenticated;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this query to verify the migration:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'subscription_type_permissions'
-- ORDER BY ordinal_position;
--
-- Expected: Should return 4 columns (id, subscription_type_id, permission_id, created_at)
