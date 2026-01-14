-- ============================================================================
-- Migration: Reset Member Types & Add Permission Templates
-- ============================================================================
-- This migration:
-- 1. Creates permission_templates table
-- 2. Resets user types to 4 core types: Super Admin, Admin, Free, Paid
-- 3. Assigns proper permissions to each user type
-- 4. Seeds default permission templates
-- 5. Updates admin@vilo.com to Super Admin type
-- ============================================================================

-- ============================================================================
-- STEP 1: Create permission_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_template BOOLEAN DEFAULT false,
  permission_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read templates
CREATE POLICY "permission_templates_select_policy" ON public.permission_templates
  FOR SELECT TO authenticated USING (true);

-- Only super_admin can modify templates
CREATE POLICY "permission_templates_insert_policy" ON public.permission_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid() AND ut.name = 'super_admin'
    )
  );

CREATE POLICY "permission_templates_update_policy" ON public.permission_templates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid() AND ut.name = 'super_admin'
    )
  );

CREATE POLICY "permission_templates_delete_policy" ON public.permission_templates
  FOR DELETE TO authenticated
  USING (
    is_system_template = false AND
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid() AND ut.name = 'super_admin'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_permission_templates_name ON public.permission_templates(name);

-- ============================================================================
-- STEP 2: Clear existing user_type_permissions (we'll re-seed them)
-- ============================================================================

DELETE FROM public.user_type_permissions;

-- ============================================================================
-- STEP 3: Reset user types to 4 core types
-- ============================================================================

-- First, save the IDs of types we want to keep/modify
DO $$
DECLARE
  v_super_admin_id UUID;
  v_saas_team_member_id UUID;
  v_saas_customer_id UUID;
  v_client_id UUID;
  v_team_member_id UUID;
  v_free_id UUID;
BEGIN
  -- Get existing IDs
  SELECT id INTO v_super_admin_id FROM public.user_types WHERE name = 'super_admin';
  SELECT id INTO v_saas_team_member_id FROM public.user_types WHERE name = 'saas_team_member';
  SELECT id INTO v_saas_customer_id FROM public.user_types WHERE name = 'saas_customer';
  SELECT id INTO v_client_id FROM public.user_types WHERE name = 'client';
  SELECT id INTO v_team_member_id FROM public.user_types WHERE name = 'team_member';

  -- Update Super Admin (keep as is, just update description)
  IF v_super_admin_id IS NOT NULL THEN
    UPDATE public.user_types SET
      display_name = 'Super Admin',
      description = 'Full platform access with all permissions',
      can_have_subscription = false,
      can_have_team = false,
      sort_order = 1,
      updated_at = NOW()
    WHERE id = v_super_admin_id;
  ELSE
    INSERT INTO public.user_types (name, display_name, description, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('super_admin', 'Super Admin', 'Full platform access with all permissions', true, false, false, 1);
  END IF;

  -- Convert saas_team_member to Admin
  IF v_saas_team_member_id IS NOT NULL THEN
    UPDATE public.user_types SET
      name = 'admin',
      display_name = 'Admin',
      description = 'Administrative access except billing and system settings',
      can_have_subscription = false,
      can_have_team = false,
      sort_order = 2,
      updated_at = NOW()
    WHERE id = v_saas_team_member_id;
  ELSE
    INSERT INTO public.user_types (name, display_name, description, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('admin', 'Admin', 'Administrative access except billing and system settings', true, false, false, 2);
  END IF;

  -- Convert client to Free Member
  IF v_client_id IS NOT NULL THEN
    UPDATE public.user_types SET
      name = 'free',
      display_name = 'Free Member',
      description = 'Limited access for free tier users',
      can_have_subscription = true,
      can_have_team = false,
      sort_order = 3,
      updated_at = NOW()
    WHERE id = v_client_id;
    v_free_id := v_client_id;
  ELSE
    INSERT INTO public.user_types (name, display_name, description, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('free', 'Free Member', 'Limited access for free tier users', true, true, false, 3)
    RETURNING id INTO v_free_id;
  END IF;

  -- Convert saas_customer to Paid Member
  IF v_saas_customer_id IS NOT NULL THEN
    UPDATE public.user_types SET
      name = 'paid',
      display_name = 'Paid Member',
      description = 'Full customer access with subscription',
      can_have_subscription = true,
      can_have_team = true,
      sort_order = 4,
      updated_at = NOW()
    WHERE id = v_saas_customer_id;
  ELSE
    INSERT INTO public.user_types (name, display_name, description, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('paid', 'Paid Member', 'Full customer access with subscription', true, true, true, 4);
  END IF;

  -- Reassign users from team_member to free before deleting
  IF v_team_member_id IS NOT NULL AND v_free_id IS NOT NULL THEN
    UPDATE public.users SET user_type_id = v_free_id WHERE user_type_id = v_team_member_id;
  END IF;

  -- Delete team_member type
  DELETE FROM public.user_types WHERE name = 'team_member';
END $$;

-- ============================================================================
-- STEP 4: Seed permissions for each user type
-- ============================================================================

-- Super Admin: ALL permissions
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'super_admin'
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- Admin: Full admin except billing/system settings update
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'admin'
  AND NOT (p.resource = 'settings' AND p.action = 'update')
  AND NOT (p.resource = 'roles' AND p.action IN ('create', 'update', 'delete', 'manage'))
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- Free Member: Limited permissions
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'free'
  AND (
    (p.resource = 'properties' AND p.action = 'read')
    OR (p.resource = 'bookings' AND p.action IN ('create', 'read'))
    OR (p.resource = 'guests' AND p.action = 'read')
    OR (p.resource = 'analytics' AND p.action = 'read')
    OR (p.resource = 'notifications' AND p.action = 'read')
  )
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- Paid Member: Full customer permissions
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT ut.id, p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'paid'
  AND (
    (p.resource = 'properties')
    OR (p.resource = 'bookings')
    OR (p.resource = 'guests')
    OR (p.resource = 'analytics' AND p.action = 'read')
    OR (p.resource = 'reports')
    OR (p.resource = 'settings' AND p.action = 'read')
    OR (p.resource = 'notifications' AND p.action = 'read')
  )
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Seed default permission templates
-- ============================================================================

-- Full Access template
INSERT INTO public.permission_templates (name, display_name, description, is_system_template, permission_ids)
SELECT
  'full_access',
  'Full Access',
  'All permissions - complete system access',
  true,
  ARRAY(SELECT id FROM public.permissions ORDER BY resource, action)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permission_ids = EXCLUDED.permission_ids,
  updated_at = NOW();

-- Admin Access template
INSERT INTO public.permission_templates (name, display_name, description, is_system_template, permission_ids)
SELECT
  'admin_access',
  'Admin Access',
  'Full administrative access except system settings',
  true,
  ARRAY(
    SELECT id FROM public.permissions
    WHERE NOT (resource = 'settings' AND action = 'update')
      AND NOT (resource = 'roles' AND action IN ('create', 'update', 'delete', 'manage'))
    ORDER BY resource, action
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permission_ids = EXCLUDED.permission_ids,
  updated_at = NOW();

-- Property Manager template
INSERT INTO public.permission_templates (name, display_name, description, is_system_template, permission_ids)
SELECT
  'property_manager',
  'Property Manager',
  'Manage properties, bookings, and guests',
  true,
  ARRAY(
    SELECT id FROM public.permissions
    WHERE resource IN ('properties', 'bookings', 'guests')
    ORDER BY resource, action
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permission_ids = EXCLUDED.permission_ids,
  updated_at = NOW();

-- Viewer Only template
INSERT INTO public.permission_templates (name, display_name, description, is_system_template, permission_ids)
SELECT
  'viewer_only',
  'Viewer Only',
  'Read-only access to all resources',
  true,
  ARRAY(
    SELECT id FROM public.permissions
    WHERE action = 'read'
    ORDER BY resource, action
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permission_ids = EXCLUDED.permission_ids,
  updated_at = NOW();

-- Booking Agent template
INSERT INTO public.permission_templates (name, display_name, description, is_system_template, permission_ids)
SELECT
  'booking_agent',
  'Booking Agent',
  'Handle bookings and guest management',
  true,
  ARRAY(
    SELECT id FROM public.permissions
    WHERE (resource = 'bookings')
      OR (resource = 'guests')
      OR (resource = 'properties' AND action = 'read')
    ORDER BY resource, action
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permission_ids = EXCLUDED.permission_ids,
  updated_at = NOW();

-- ============================================================================
-- STEP 6: Update admin@vilo.com to Super Admin user type
-- ============================================================================

UPDATE public.users
SET user_type_id = (SELECT id FROM public.user_types WHERE name = 'super_admin')
WHERE email = 'admin@vilo.com';

-- Also update any users without a user_type_id to Free
UPDATE public.users
SET user_type_id = (SELECT id FROM public.user_types WHERE name = 'free')
WHERE user_type_id IS NULL;

-- ============================================================================
-- STEP 7: Create helper function to get template permissions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_template_permissions(p_template_id UUID)
RETURNS TABLE (
  permission_id UUID,
  resource VARCHAR,
  action permission_action,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.resource, p.action, p.description
  FROM public.permissions p
  WHERE p.id = ANY(
    SELECT UNNEST(pt.permission_ids)
    FROM public.permission_templates pt
    WHERE pt.id = p_template_id
  )
  ORDER BY p.resource, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Create function to apply template to user type
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_template_to_user_type(
  p_user_type_id UUID,
  p_template_id UUID
) RETURNS void AS $$
DECLARE
  v_permission_ids UUID[];
BEGIN
  -- Get permission IDs from template
  SELECT permission_ids INTO v_permission_ids
  FROM public.permission_templates
  WHERE id = p_template_id;

  IF v_permission_ids IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Clear existing permissions for this user type
  DELETE FROM public.user_type_permissions
  WHERE user_type_id = p_user_type_id;

  -- Insert new permissions from template
  INSERT INTO public.user_type_permissions (user_type_id, permission_id)
  SELECT p_user_type_id, UNNEST(v_permission_ids)
  ON CONFLICT (user_type_id, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Done!
-- ============================================================================
