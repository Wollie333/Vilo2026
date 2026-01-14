-- Migration: 015_add_saas_team_member_user_type.sql
-- Description: Add SaaS Team Member user type for internal platform staff
-- Author: Claude
-- Date: 2026-01-04

-- ============================================================================
-- ADD SAAS TEAM MEMBER USER TYPE
-- Internal platform team members who help manage the SaaS platform.
-- Unlike team_member (which belongs to customer teams), saas_team_member
-- is for internal staff with configurable roles assigned by administrators.
-- ============================================================================

-- Insert the new SaaS Team Member user type
INSERT INTO public.user_types (name, display_name, description, is_system_type, can_have_subscription, can_have_team, sort_order)
VALUES
  ('saas_team_member', 'SaaS Team Member', 'Internal platform team members who help manage the SaaS. Assigned specific roles by administrators.', true, false, false, 2)
ON CONFLICT (name) DO NOTHING;

-- Update sort orders for existing types to accommodate the new type
UPDATE public.user_types SET sort_order = 3 WHERE name = 'saas_customer';
UPDATE public.user_types SET sort_order = 4 WHERE name = 'team_member';
UPDATE public.user_types SET sort_order = 5 WHERE name = 'client';
