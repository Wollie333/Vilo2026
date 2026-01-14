-- Migration: 069_create_company_team_members.sql
-- Description: Create company team members table for property owner staff management
-- Date: 2026-01-13
-- Author: Claude Code
-- Status: Ready for execution

-- ============================================================================
-- CREATE TEAM MEMBER ROLE ENUM
-- ============================================================================

-- Create enum type for team member roles
CREATE TYPE company_team_member_role AS ENUM (
  'owner',
  'manager',
  'receptionist',
  'maintenance',
  'housekeeping',
  'custom'
);

COMMENT ON TYPE company_team_member_role IS
  'Predefined roles for company team members. Use custom for organization-specific roles.';

-- ============================================================================
-- CREATE COMPANY TEAM MEMBERS TABLE
-- ============================================================================

-- Junction table linking users to companies as team members
CREATE TABLE IF NOT EXISTS public.company_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role company_team_member_role NOT NULL DEFAULT 'custom',
  role_name VARCHAR(100), -- Custom role name when role = 'custom'
  assigned_by UUID REFERENCES public.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  permissions TEXT[], -- Property-specific permissions in 'resource:action' format
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_company_user UNIQUE(company_id, user_id, is_active)
);

COMMENT ON TABLE public.company_team_members IS
  'Team members invited by property owners to help manage their properties. Count towards subscription max_team_members limit.';

COMMENT ON COLUMN public.company_team_members.role IS
  'Predefined role (owner, manager, receptionist, maintenance, housekeeping) or custom';

COMMENT ON COLUMN public.company_team_members.role_name IS
  'Custom role name when role = custom (e.g., Night Auditor, Front Desk Supervisor)';

COMMENT ON COLUMN public.company_team_members.permissions IS
  'Property-specific permissions in resource:action format (e.g., [properties:read, bookings:manage])';

COMMENT ON CONSTRAINT unique_active_company_user ON public.company_team_members IS
  'Ensures one active membership per user per company. Users can be reinvited after revocation.';

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for looking up team members by company
CREATE INDEX IF NOT EXISTS idx_company_team_members_company
ON public.company_team_members(company_id);

-- Index for looking up companies by user (team member)
CREATE INDEX IF NOT EXISTS idx_company_team_members_user
ON public.company_team_members(user_id);

-- Index for active team members by company (common query)
CREATE INDEX IF NOT EXISTS idx_company_team_members_active
ON public.company_team_members(company_id, is_active);

-- Index for assigned_by lookups
CREATE INDEX IF NOT EXISTS idx_company_team_members_assigned_by
ON public.company_team_members(assigned_by);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.company_team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own team memberships
CREATE POLICY "team_members_select_own"
ON public.company_team_members
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Company owners can see all their team members
CREATE POLICY "team_members_select_owner"
ON public.company_team_members
FOR SELECT
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Policy: Company owners can add team members to their companies
CREATE POLICY "team_members_insert_owner"
ON public.company_team_members
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Policy: Company owners can update their team members
CREATE POLICY "team_members_update_owner"
ON public.company_team_members
FOR UPDATE
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Policy: Company owners can remove their team members
CREATE POLICY "team_members_delete_owner"
ON public.company_team_members
FOR DELETE
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Policy: Super admins can see all team members
CREATE POLICY "team_members_super_admin_all"
ON public.company_team_members
FOR ALL
USING (public.is_super_admin());

-- ============================================================================
-- GRANT ACCESS
-- ============================================================================

GRANT ALL ON public.company_team_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_team_members TO authenticated;

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_company_team_members_updated_at
BEFORE UPDATE ON public.company_team_members
FOR EACH ROW
EXECUTE FUNCTION update_company_team_members_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the migration:
--
-- 1. Check table exists:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'company_team_members';
--
-- 2. Check enum type:
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = 'company_team_member_role'::regtype::oid
-- ORDER BY enumsortorder;
--
-- 3. Check RLS policies:
-- SELECT policyname, cmd FROM pg_policies
-- WHERE tablename = 'company_team_members';
--
-- Expected: Table exists, 6 enum values, 6 RLS policies
