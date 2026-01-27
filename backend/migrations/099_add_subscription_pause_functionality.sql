-- Migration: 099_add_subscription_pause_functionality.sql
-- Description: Add 'paused' status and paused_at column to user_subscriptions
-- Date: 2026-01-17

-- ============================================================================
-- ADD 'paused' TO STATUS ENUM
-- ============================================================================

-- Drop existing constraint
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

-- Add new constraint with 'paused' status
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_status_check
CHECK (status IN ('active', 'trial', 'cancelled', 'expired', 'past_due', 'paused'));

-- ============================================================================
-- ADD paused_at COLUMN
-- ============================================================================

ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN user_subscriptions.paused_at IS 'Timestamp when subscription was paused';

-- ============================================================================
-- CREATE INDEX FOR paused_at
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paused_at
ON user_subscriptions(paused_at)
WHERE paused_at IS NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 099: Add subscription pause functionality - COMPLETED';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - "paused" status to user_subscriptions.status';
  RAISE NOTICE '  - paused_at TIMESTAMPTZ column';
  RAISE NOTICE '  - Index on paused_at column';
  RAISE NOTICE '==========================================================';
END $$;
