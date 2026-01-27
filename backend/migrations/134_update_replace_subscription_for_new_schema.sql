-- Migration: 134_update_replace_subscription_for_new_schema.sql
-- Description: Update replace_user_subscription to use new status field (not billing_status_id)
-- Date: 2026-01-21
--
-- Migration 020 deprecated billing_statuses table and added status VARCHAR field directly
-- to user_subscriptions. This migration updates the replace_user_subscription function
-- to use the new schema.

-- ============================================================================
-- DROP OLD FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS replace_user_subscription(UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ);

-- ============================================================================
-- CREATE UPDATED FUNCTION (uses status VARCHAR instead of billing_status_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION replace_user_subscription(
  p_user_id UUID,
  p_subscription_type_id UUID,
  p_status VARCHAR,  -- Changed from p_billing_status_id UUID
  p_started_at TIMESTAMPTZ DEFAULT NOW(),
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_trial_ends_at TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  subscription_type_id UUID,
  status VARCHAR,  -- Changed from billing_status_id UUID
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  is_active BOOLEAN,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_subscription_id UUID;
  v_deleted_count INTEGER;
BEGIN
  -- Delete any existing subscriptions for this user (atomic within transaction)
  DELETE FROM user_subscriptions
  WHERE user_subscriptions.user_id = p_user_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Create new subscription
  INSERT INTO user_subscriptions (
    user_id,
    subscription_type_id,
    status,  -- Changed from billing_status_id
    started_at,
    expires_at,
    trial_ends_at,
    is_active
  ) VALUES (
    p_user_id,
    p_subscription_type_id,
    p_status,  -- Changed from p_billing_status_id
    p_started_at,
    p_expires_at,
    p_trial_ends_at,
    true
  )
  RETURNING user_subscriptions.id INTO v_new_subscription_id;

  -- Return the newly created subscription
  RETURN QUERY
  SELECT
    us.id,
    us.user_id,
    us.subscription_type_id,
    us.status,  -- Changed from us.billing_status_id
    us.started_at,
    us.expires_at,
    us.trial_ends_at,
    us.is_active,
    us.cancelled_at,
    us.cancellation_reason,
    us.created_at,
    us.updated_at
  FROM user_subscriptions us
  WHERE us.id = v_new_subscription_id;
END;
$$;

-- ============================================================================
-- GRANT EXECUTE PERMISSION
-- ============================================================================

GRANT EXECUTE ON FUNCTION replace_user_subscription(UUID, UUID, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION replace_user_subscription(UUID, UUID, VARCHAR, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- Add comment
COMMENT ON FUNCTION replace_user_subscription IS 'Atomically replaces user subscription (uses new status field from migration 020)';
