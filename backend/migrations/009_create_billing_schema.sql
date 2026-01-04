-- Migration: 009_create_billing_schema.sql
-- Description: Create billing and subscription management tables
-- Author: Claude
-- Date: 2026-01-04

-- ============================================================================
-- USER TYPES TABLE
-- Classification of users: super_admin, saas_customer, team_member, client
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_type BOOLEAN DEFAULT false,
  can_have_subscription BOOLEAN DEFAULT false,
  can_have_team BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sorting and lookups
CREATE INDEX IF NOT EXISTS idx_user_types_sort ON public.user_types(sort_order, name);
CREATE INDEX IF NOT EXISTS idx_user_types_name ON public.user_types(name);

-- ============================================================================
-- BILLING STATUSES TABLE
-- User billing states: trial, free, paid
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.billing_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_status BOOLEAN DEFAULT false,
  color VARCHAR(20) DEFAULT 'default',
  feature_access_level INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sorting and lookups
CREATE INDEX IF NOT EXISTS idx_billing_statuses_sort ON public.billing_statuses(sort_order, name);
CREATE INDEX IF NOT EXISTS idx_billing_statuses_name ON public.billing_statuses(name);

-- ============================================================================
-- SUBSCRIPTION TYPES TABLE
-- Billing cycle definitions: free, lifetime, monthly, quarterly, etc.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  billing_cycle_days INTEGER,
  is_recurring BOOLEAN DEFAULT true,
  price_cents INTEGER DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sorting and active status
CREATE INDEX IF NOT EXISTS idx_subscription_types_sort ON public.subscription_types(sort_order, name);
CREATE INDEX IF NOT EXISTS idx_subscription_types_active ON public.subscription_types(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_types_name ON public.subscription_types(name);

-- ============================================================================
-- SUBSCRIPTION LIMITS TABLE
-- Configurable limits per subscription type
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_type_id UUID NOT NULL REFERENCES public.subscription_types(id) ON DELETE CASCADE,
  limit_key VARCHAR(50) NOT NULL,
  limit_value INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_type_id, limit_key)
);

-- Index for lookups by subscription type
CREATE INDEX IF NOT EXISTS idx_subscription_limits_type ON public.subscription_limits(subscription_type_id);
CREATE INDEX IF NOT EXISTS idx_subscription_limits_key ON public.subscription_limits(limit_key);

-- ============================================================================
-- USER SUBSCRIPTIONS TABLE
-- Links users to their active subscription
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_type_id UUID NOT NULL REFERENCES public.subscription_types(id),
  billing_status_id UUID NOT NULL REFERENCES public.billing_statuses(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for user subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_type ON public.user_subscriptions(subscription_type_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(billing_status_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON public.user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires ON public.user_subscriptions(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- ALTER USER PROFILES TABLE
-- Add user_type_id and parent_user_id columns
-- ============================================================================

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS user_type_id UUID REFERENCES public.user_types(id),
ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES public.user_profiles(id);

-- Index for user type and parent lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent ON public.user_profiles(parent_user_id);

-- ============================================================================
-- UPDATE TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_types_updated_at ON public.user_types;
CREATE TRIGGER update_user_types_updated_at
  BEFORE UPDATE ON public.user_types
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

DROP TRIGGER IF EXISTS update_billing_statuses_updated_at ON public.billing_statuses;
CREATE TRIGGER update_billing_statuses_updated_at
  BEFORE UPDATE ON public.billing_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

DROP TRIGGER IF EXISTS update_subscription_types_updated_at ON public.subscription_types;
CREATE TRIGGER update_subscription_types_updated_at
  BEFORE UPDATE ON public.subscription_types
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

DROP TRIGGER IF EXISTS update_subscription_limits_updated_at ON public.subscription_limits;
CREATE TRIGGER update_subscription_limits_updated_at
  BEFORE UPDATE ON public.subscription_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- User Types: Everyone can read, only super admins can modify
DROP POLICY IF EXISTS user_types_select_policy ON public.user_types;
CREATE POLICY user_types_select_policy ON public.user_types
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS user_types_insert_policy ON public.user_types;
CREATE POLICY user_types_insert_policy ON public.user_types
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS user_types_update_policy ON public.user_types;
CREATE POLICY user_types_update_policy ON public.user_types
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS user_types_delete_policy ON public.user_types;
CREATE POLICY user_types_delete_policy ON public.user_types
  FOR DELETE
  TO authenticated
  USING (is_super_admin() AND NOT is_system_type);

-- Billing Statuses: Everyone can read, only super admins can modify
DROP POLICY IF EXISTS billing_statuses_select_policy ON public.billing_statuses;
CREATE POLICY billing_statuses_select_policy ON public.billing_statuses
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS billing_statuses_insert_policy ON public.billing_statuses;
CREATE POLICY billing_statuses_insert_policy ON public.billing_statuses
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS billing_statuses_update_policy ON public.billing_statuses;
CREATE POLICY billing_statuses_update_policy ON public.billing_statuses
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS billing_statuses_delete_policy ON public.billing_statuses;
CREATE POLICY billing_statuses_delete_policy ON public.billing_statuses
  FOR DELETE
  TO authenticated
  USING (is_super_admin() AND NOT is_system_status);

-- Subscription Types: Everyone can read, only super admins can modify
DROP POLICY IF EXISTS subscription_types_select_policy ON public.subscription_types;
CREATE POLICY subscription_types_select_policy ON public.subscription_types
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS subscription_types_insert_policy ON public.subscription_types;
CREATE POLICY subscription_types_insert_policy ON public.subscription_types
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS subscription_types_update_policy ON public.subscription_types;
CREATE POLICY subscription_types_update_policy ON public.subscription_types
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS subscription_types_delete_policy ON public.subscription_types;
CREATE POLICY subscription_types_delete_policy ON public.subscription_types
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Subscription Limits: Everyone can read, only super admins can modify
DROP POLICY IF EXISTS subscription_limits_select_policy ON public.subscription_limits;
CREATE POLICY subscription_limits_select_policy ON public.subscription_limits
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS subscription_limits_insert_policy ON public.subscription_limits;
CREATE POLICY subscription_limits_insert_policy ON public.subscription_limits
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS subscription_limits_update_policy ON public.subscription_limits;
CREATE POLICY subscription_limits_update_policy ON public.subscription_limits
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS subscription_limits_delete_policy ON public.subscription_limits;
CREATE POLICY subscription_limits_delete_policy ON public.subscription_limits
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- User Subscriptions: Users can read their own, super admins can read/modify all
DROP POLICY IF EXISTS user_subscriptions_select_policy ON public.user_subscriptions;
CREATE POLICY user_subscriptions_select_policy ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_super_admin()
    OR has_permission('users', 'read')
  );

DROP POLICY IF EXISTS user_subscriptions_insert_policy ON public.user_subscriptions;
CREATE POLICY user_subscriptions_insert_policy ON public.user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS user_subscriptions_update_policy ON public.user_subscriptions;
CREATE POLICY user_subscriptions_update_policy ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS user_subscriptions_delete_policy ON public.user_subscriptions;
CREATE POLICY user_subscriptions_delete_policy ON public.user_subscriptions
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- SEED DATA: User Types
-- ============================================================================

INSERT INTO public.user_types (name, display_name, description, is_system_type, can_have_subscription, can_have_team, sort_order)
VALUES
  ('super_admin', 'Super Administrator', 'Platform administrators with full system access. No subscription required.', true, false, false, 1),
  ('saas_customer', 'SaaS Customer', 'Paying customers who own and manage properties. Can have subscriptions and invite team members.', true, true, true, 2),
  ('team_member', 'Team Member', 'Staff members invited by SaaS customers. Inherits subscription limits from parent account.', true, false, false, 3),
  ('client', 'Client', 'End users who book properties. Limited portal access for viewing bookings.', true, false, false, 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED DATA: Billing Statuses
-- ============================================================================

INSERT INTO public.billing_statuses (name, display_name, description, is_system_status, color, feature_access_level, sort_order)
VALUES
  ('trial', 'Trial', 'Trial period with limited duration. Full feature access during trial.', true, 'warning', 50, 1),
  ('free', 'Free', 'Free tier with basic features and limited resources.', true, 'default', 25, 2),
  ('paid', 'Paid', 'Active paid subscription with full feature access based on plan.', true, 'success', 100, 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED DATA: Subscription Types
-- ============================================================================

INSERT INTO public.subscription_types (name, display_name, description, billing_cycle_days, is_recurring, price_cents, currency, is_active, sort_order)
VALUES
  ('free', 'Free', 'Free plan with basic features and limited resources.', NULL, false, 0, 'USD', true, 1),
  ('lifetime', 'Lifetime', 'One-time payment for lifetime access.', NULL, false, 49900, 'USD', true, 2),
  ('monthly', 'Monthly', 'Billed monthly with full access to all features.', 30, true, 2900, 'USD', true, 3),
  ('quarterly', 'Quarterly', 'Billed every 3 months at a discounted rate.', 90, true, 7900, 'USD', true, 4),
  ('biannually', 'Bi-Annually', 'Billed every 6 months at a discounted rate.', 180, true, 14900, 'USD', true, 5),
  ('annually', 'Annually', 'Billed yearly at the best rate.', 365, true, 24900, 'USD', true, 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED DATA: Subscription Limits
-- ============================================================================

-- Get subscription type IDs for limit seeding
DO $$
DECLARE
  free_id UUID;
  lifetime_id UUID;
  monthly_id UUID;
  quarterly_id UUID;
  biannually_id UUID;
  annually_id UUID;
BEGIN
  SELECT id INTO free_id FROM public.subscription_types WHERE name = 'free';
  SELECT id INTO lifetime_id FROM public.subscription_types WHERE name = 'lifetime';
  SELECT id INTO monthly_id FROM public.subscription_types WHERE name = 'monthly';
  SELECT id INTO quarterly_id FROM public.subscription_types WHERE name = 'quarterly';
  SELECT id INTO biannually_id FROM public.subscription_types WHERE name = 'biannually';
  SELECT id INTO annually_id FROM public.subscription_types WHERE name = 'annually';

  -- Free plan limits
  INSERT INTO public.subscription_limits (subscription_type_id, limit_key, limit_value, description)
  VALUES
    (free_id, 'max_properties', 1, 'Maximum number of properties'),
    (free_id, 'max_rooms', 5, 'Maximum rooms across all properties'),
    (free_id, 'max_team_members', 1, 'Maximum team member invites'),
    (free_id, 'max_bookings_per_month', 10, 'Maximum bookings per month'),
    (free_id, 'max_storage_mb', 100, 'Storage quota in MB')
  ON CONFLICT (subscription_type_id, limit_key) DO NOTHING;

  -- Lifetime plan limits (generous limits)
  INSERT INTO public.subscription_limits (subscription_type_id, limit_key, limit_value, description)
  VALUES
    (lifetime_id, 'max_properties', 10, 'Maximum number of properties'),
    (lifetime_id, 'max_rooms', 100, 'Maximum rooms across all properties'),
    (lifetime_id, 'max_team_members', 25, 'Maximum team member invites'),
    (lifetime_id, 'max_bookings_per_month', -1, 'Unlimited bookings per month'),
    (lifetime_id, 'max_storage_mb', 10000, 'Storage quota in MB')
  ON CONFLICT (subscription_type_id, limit_key) DO NOTHING;

  -- Monthly plan limits
  INSERT INTO public.subscription_limits (subscription_type_id, limit_key, limit_value, description)
  VALUES
    (monthly_id, 'max_properties', 3, 'Maximum number of properties'),
    (monthly_id, 'max_rooms', 25, 'Maximum rooms across all properties'),
    (monthly_id, 'max_team_members', 5, 'Maximum team member invites'),
    (monthly_id, 'max_bookings_per_month', 100, 'Maximum bookings per month'),
    (monthly_id, 'max_storage_mb', 1000, 'Storage quota in MB')
  ON CONFLICT (subscription_type_id, limit_key) DO NOTHING;

  -- Quarterly plan limits
  INSERT INTO public.subscription_limits (subscription_type_id, limit_key, limit_value, description)
  VALUES
    (quarterly_id, 'max_properties', 5, 'Maximum number of properties'),
    (quarterly_id, 'max_rooms', 50, 'Maximum rooms across all properties'),
    (quarterly_id, 'max_team_members', 10, 'Maximum team member invites'),
    (quarterly_id, 'max_bookings_per_month', 250, 'Maximum bookings per month'),
    (quarterly_id, 'max_storage_mb', 2500, 'Storage quota in MB')
  ON CONFLICT (subscription_type_id, limit_key) DO NOTHING;

  -- Bi-annual plan limits
  INSERT INTO public.subscription_limits (subscription_type_id, limit_key, limit_value, description)
  VALUES
    (biannually_id, 'max_properties', 7, 'Maximum number of properties'),
    (biannually_id, 'max_rooms', 75, 'Maximum rooms across all properties'),
    (biannually_id, 'max_team_members', 15, 'Maximum team member invites'),
    (biannually_id, 'max_bookings_per_month', 500, 'Maximum bookings per month'),
    (biannually_id, 'max_storage_mb', 5000, 'Storage quota in MB')
  ON CONFLICT (subscription_type_id, limit_key) DO NOTHING;

  -- Annual plan limits (best value)
  INSERT INTO public.subscription_limits (subscription_type_id, limit_key, limit_value, description)
  VALUES
    (annually_id, 'max_properties', 10, 'Maximum number of properties'),
    (annually_id, 'max_rooms', 100, 'Maximum rooms across all properties'),
    (annually_id, 'max_team_members', 20, 'Maximum team member invites'),
    (annually_id, 'max_bookings_per_month', -1, 'Unlimited bookings per month'),
    (annually_id, 'max_storage_mb', 10000, 'Storage quota in MB')
  ON CONFLICT (subscription_type_id, limit_key) DO NOTHING;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Get user subscription with details
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_subscription_details(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  user_id UUID,
  subscription_type_name VARCHAR,
  subscription_type_display_name VARCHAR,
  billing_status_name VARCHAR,
  billing_status_display_name VARCHAR,
  billing_status_color VARCHAR,
  feature_access_level INTEGER,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_active BOOLEAN,
  limits JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id AS subscription_id,
    us.user_id,
    st.name AS subscription_type_name,
    st.display_name AS subscription_type_display_name,
    bs.name AS billing_status_name,
    bs.display_name AS billing_status_display_name,
    bs.color AS billing_status_color,
    bs.feature_access_level,
    us.started_at,
    us.expires_at,
    us.trial_ends_at,
    us.is_active,
    COALESCE(
      (SELECT jsonb_object_agg(sl.limit_key, sl.limit_value)
       FROM public.subscription_limits sl
       WHERE sl.subscription_type_id = us.subscription_type_id),
      '{}'::jsonb
    ) AS limits
  FROM public.user_subscriptions us
  JOIN public.subscription_types st ON us.subscription_type_id = st.id
  JOIN public.billing_statuses bs ON us.billing_status_id = bs.id
  WHERE us.user_id = p_user_id
    AND us.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Check subscription limit
-- ============================================================================

CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_user_id UUID,
  p_limit_key VARCHAR,
  p_current_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  is_within_limit BOOLEAN,
  limit_value INTEGER,
  current_count INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  v_limit INTEGER;
  v_parent_user_id UUID;
  v_effective_user_id UUID;
BEGIN
  -- Check if user is a team member (use parent's subscription)
  SELECT parent_user_id INTO v_parent_user_id
  FROM public.user_profiles
  WHERE id = p_user_id;

  v_effective_user_id := COALESCE(v_parent_user_id, p_user_id);

  -- Get the limit value
  SELECT sl.limit_value INTO v_limit
  FROM public.user_subscriptions us
  JOIN public.subscription_limits sl ON us.subscription_type_id = sl.subscription_type_id
  WHERE us.user_id = v_effective_user_id
    AND us.is_active = true
    AND sl.limit_key = p_limit_key;

  -- If no subscription found, default to 0 limit
  IF v_limit IS NULL THEN
    v_limit := 0;
  END IF;

  -- Return result
  RETURN QUERY SELECT
    CASE
      WHEN v_limit = -1 THEN true  -- -1 means unlimited
      ELSE p_current_count < v_limit
    END AS is_within_limit,
    v_limit AS limit_value,
    p_current_count AS current_count,
    CASE
      WHEN v_limit = -1 THEN -1  -- -1 means unlimited remaining
      ELSE GREATEST(0, v_limit - p_current_count)
    END AS remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant access to service role
-- ============================================================================

GRANT ALL ON public.user_types TO service_role;
GRANT ALL ON public.billing_statuses TO service_role;
GRANT ALL ON public.subscription_types TO service_role;
GRANT ALL ON public.subscription_limits TO service_role;
GRANT ALL ON public.user_subscriptions TO service_role;

-- Grant authenticated users select access
GRANT SELECT ON public.user_types TO authenticated;
GRANT SELECT ON public.billing_statuses TO authenticated;
GRANT SELECT ON public.subscription_types TO authenticated;
GRANT SELECT ON public.subscription_limits TO authenticated;
GRANT SELECT ON public.user_subscriptions TO authenticated;
