-- ============================================================================
-- URGENT FIX: Update replace_user_subscription to use new status field
-- ============================================================================
-- Run this in Supabase SQL Editor NOW to fix the payment error
-- ============================================================================

-- Drop old function that uses billing_status_id
DROP FUNCTION IF EXISTS replace_user_subscription(UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ);

-- Create new function that uses status VARCHAR
CREATE OR REPLACE FUNCTION replace_user_subscription(
  p_user_id UUID,
  p_subscription_type_id UUID,
  p_status VARCHAR,
  p_started_at TIMESTAMPTZ DEFAULT NOW(),
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_trial_ends_at TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  subscription_type_id UUID,
  status VARCHAR,
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
BEGIN
  -- Delete any existing subscriptions for this user
  DELETE FROM user_subscriptions
  WHERE user_subscriptions.user_id = p_user_id;

  -- Create new subscription
  INSERT INTO user_subscriptions (
    user_id,
    subscription_type_id,
    status,
    started_at,
    expires_at,
    trial_ends_at,
    is_active
  ) VALUES (
    p_user_id,
    p_subscription_type_id,
    p_status,
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
    us.status,
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

-- Verify the function was created
SELECT 'Function updated successfully!' as message;
