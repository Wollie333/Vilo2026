-- Migration: 020_simplify_billing_schema.sql
-- Description: Simplify billing schema by:
--   1. Adding status field to user_subscriptions (replacing billing_status_id)
--   2. Adding limits JSONB column to subscription_types (replacing subscription_limits table)
--   3. Migrating existing data
-- Author: Claude
-- Date: 2026-01-04

-- ============================================================================
-- STEP 1: Add status field to user_subscriptions
-- Replaces the separate billing_statuses table lookup
-- ============================================================================

ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'trial', 'cancelled', 'expired', 'past_due'));

-- ============================================================================
-- STEP 2: Add limits JSONB column to subscription_types
-- Replaces the separate subscription_limits table
-- ============================================================================

ALTER TABLE public.subscription_types
ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- STEP 3: Migrate existing limits from subscription_limits to JSONB
-- ============================================================================

UPDATE public.subscription_types st
SET limits = COALESCE(
    (SELECT jsonb_object_agg(sl.limit_key, sl.limit_value)
     FROM public.subscription_limits sl
     WHERE sl.subscription_type_id = st.id),
    '{}'::jsonb
)
WHERE limits = '{}'::jsonb OR limits IS NULL;

-- ============================================================================
-- STEP 4: Migrate billing_status_id to status field
-- Maps: trial -> 'trial', paid -> 'active', free -> 'active'
-- ============================================================================

UPDATE public.user_subscriptions us
SET status = CASE
    WHEN bs.name = 'trial' THEN 'trial'
    WHEN bs.name = 'paid' THEN 'active'
    WHEN bs.name = 'free' THEN 'active'
    ELSE 'active'
END
FROM public.billing_statuses bs
WHERE us.billing_status_id = bs.id
  AND us.status IS NULL;

-- Set default for any rows that didn't get updated
UPDATE public.user_subscriptions
SET status = 'active'
WHERE status IS NULL;

-- Now make status NOT NULL
ALTER TABLE public.user_subscriptions
ALTER COLUMN status SET NOT NULL;

-- ============================================================================
-- STEP 5: Make billing_status_id nullable (deprecate but don't remove)
-- ============================================================================

ALTER TABLE public.user_subscriptions
ALTER COLUMN billing_status_id DROP NOT NULL;

-- ============================================================================
-- STEP 6: Create indexes on new fields
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_new
ON public.user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscription_types_limits
ON public.subscription_types USING gin(limits);

-- ============================================================================
-- STEP 7: Update get_user_subscription_details function to use new schema
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_subscription_details(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  user_id UUID,
  subscription_type_name VARCHAR,
  subscription_type_display_name VARCHAR,
  status VARCHAR,
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
    us.status,
    us.started_at,
    us.expires_at,
    us.trial_ends_at,
    us.is_active,
    COALESCE(st.limits, '{}'::jsonb) AS limits
  FROM public.user_subscriptions us
  JOIN public.subscription_types st ON us.subscription_type_id = st.id
  WHERE us.user_id = p_user_id
    AND us.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Update check_subscription_limit to use JSONB limits
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
  FROM public.users
  WHERE id = p_user_id;

  v_effective_user_id := COALESCE(v_parent_user_id, p_user_id);

  -- Get the limit value from JSONB limits field
  SELECT (st.limits->>p_limit_key)::INTEGER INTO v_limit
  FROM public.user_subscriptions us
  JOIN public.subscription_types st ON us.subscription_type_id = st.id
  WHERE us.user_id = v_effective_user_id
    AND us.is_active = true;

  -- If no subscription found or limit key doesn't exist, default to 0
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
-- DEPRECATION NOTES
-- ============================================================================
-- The following tables are now deprecated but NOT removed (for rollback safety):
-- - billing_statuses: Status is now stored directly on user_subscriptions
-- - subscription_limits: Limits are now stored as JSONB on subscription_types
--
-- These tables can be dropped in a future migration once the new schema is stable.
