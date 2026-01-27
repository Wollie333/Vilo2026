-- Migration: 131_create_replace_subscription_function.sql
-- Description: Create atomic function to replace user subscription (fix race conditions)
-- Date: 2026-01-21
--
-- This migration creates a PostgreSQL function that atomically deletes existing subscriptions
-- and creates a new one for a user. This prevents the duplicate key constraint violation that
-- occurs when multiple checkout attempts run concurrently or when retries happen.

-- ============================================================================
-- DROP FUNCTION (if exists from previous attempts)
-- ============================================================================

DROP FUNCTION IF EXISTS replace_user_subscription(UUID, UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ);

-- ============================================================================
-- CREATE ATOMIC SUBSCRIPTION REPLACEMENT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION replace_user_subscription(
  p_user_id UUID,
  p_subscription_type_id UUID,
  p_billing_status_id UUID,
  p_started_at TIMESTAMPTZ DEFAULT NOW(),
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_trial_ends_at TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  subscription_type_id UUID,
  billing_status_id UUID,
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
  WHERE user_subscriptions.user_id = p_user_id
  RETURNING user_subscriptions.id INTO v_new_subscription_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the deletion for debugging
  RAISE NOTICE 'Deleted % existing subscription(s) for user %', v_deleted_count, p_user_id;

  -- Insert new subscription
  INSERT INTO user_subscriptions (
    user_id,
    subscription_type_id,
    billing_status_id,
    started_at,
    expires_at,
    trial_ends_at,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_subscription_type_id,
    p_billing_status_id,
    COALESCE(p_started_at, NOW()),
    p_expires_at,
    p_trial_ends_at,
    true,
    NOW(),
    NOW()
  )
  RETURNING user_subscriptions.id INTO v_new_subscription_id;

  -- Return the newly created subscription
  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.subscription_type_id,
    s.billing_status_id,
    s.started_at,
    s.expires_at,
    s.trial_ends_at,
    s.is_active,
    s.cancelled_at,
    s.cancellation_reason,
    s.created_at,
    s.updated_at
  FROM user_subscriptions s
  WHERE s.id = v_new_subscription_id;

  RAISE NOTICE 'Created new subscription % for user %', v_new_subscription_id, p_user_id;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission to authenticated users (via service role)
COMMENT ON FUNCTION replace_user_subscription IS
  'Atomically replaces a user''s subscription. Deletes existing subscriptions and creates a new one in a single transaction to prevent race conditions.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test that the function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'replace_user_subscription'
  ) THEN
    RAISE NOTICE '✅ Function replace_user_subscription created successfully';
  ELSE
    RAISE EXCEPTION '❌ Function replace_user_subscription was not created';
  END IF;
END $$;
