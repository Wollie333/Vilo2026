-- Migration: 102_add_paused_reason.sql
-- Description: Add paused_reason and paused_by_admin_id columns to user_subscriptions for admin tracking
-- Date: 2026-01-17

-- ============================================================================
-- ADD PAUSED TRACKING COLUMNS
-- ============================================================================

-- Add paused_reason column to track why subscription was paused
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS paused_reason TEXT;

-- Add paused_by_admin_id to track which admin paused the subscription
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS paused_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- ADD CANCELLED TRACKING COLUMN
-- ============================================================================

-- Add cancelled_by_admin_id to track admin-initiated cancellations
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS cancelled_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Index for finding all subscriptions paused/cancelled by a specific admin
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paused_by_admin
ON user_subscriptions(paused_by_admin_id)
WHERE paused_by_admin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_cancelled_by_admin
ON user_subscriptions(cancelled_by_admin_id)
WHERE cancelled_by_admin_id IS NOT NULL;

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN user_subscriptions.paused_reason IS
'Reason provided by admin or user when subscription was paused';

COMMENT ON COLUMN user_subscriptions.paused_by_admin_id IS
'Admin user who initiated the pause (NULL if user-initiated)';

COMMENT ON COLUMN user_subscriptions.cancelled_by_admin_id IS
'Admin user who initiated the cancellation (NULL if user-initiated)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 102: Add paused/cancelled reason tracking - COMPLETED';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - paused_reason TEXT column';
  RAISE NOTICE '  - paused_by_admin_id UUID column';
  RAISE NOTICE '  - cancelled_by_admin_id UUID column';
  RAISE NOTICE '  - Indexes for admin tracking';
  RAISE NOTICE '==========================================================';
END $$;
