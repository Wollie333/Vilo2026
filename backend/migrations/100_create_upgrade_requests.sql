-- Migration: 100_create_upgrade_requests.sql
-- Description: Create subscription_upgrade_requests table for tracking admin-initiated upgrade requests
-- Date: 2026-01-17

-- ============================================================================
-- CREATE SUBSCRIPTION UPGRADE REQUESTS TABLE
-- ============================================================================

-- This table tracks admin-initiated upgrade requests that require user confirmation
-- Users receive notifications and must accept/decline before upgrade is applied
CREATE TABLE IF NOT EXISTS subscription_upgrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  requested_subscription_type_id UUID NOT NULL REFERENCES subscription_types(id) ON DELETE CASCADE,
  requested_by_admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Status: pending (awaiting user response), accepted (user confirmed), declined (user rejected), expired (7 days passed)
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',

  -- Notes from admin explaining why upgrade is recommended
  admin_notes TEXT,

  -- User's response notes when accepting or declining
  user_response_notes TEXT,

  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL, -- Request expires 7 days after creation

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding all upgrade requests for a specific user
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_user
ON subscription_upgrade_requests(user_id);

-- Index for filtering by status (e.g., find all pending requests)
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status
ON subscription_upgrade_requests(status);

-- Partial index for pending requests with expiry check (for cleanup job)
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_pending_expires
ON subscription_upgrade_requests(expires_at)
WHERE status = 'pending';

-- Index for admin tracking which requests they created
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_admin
ON subscription_upgrade_requests(requested_by_admin_id);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE subscription_upgrade_requests IS
'Tracks admin-initiated subscription upgrade requests requiring user confirmation';

COMMENT ON COLUMN subscription_upgrade_requests.status IS
'Request status: pending (awaiting user response), accepted (user confirmed), declined (user rejected), expired (7 days passed)';

COMMENT ON COLUMN subscription_upgrade_requests.expires_at IS
'Upgrade request automatically expires 7 days after creation if no user response';

COMMENT ON COLUMN subscription_upgrade_requests.admin_notes IS
'Admin explanation for why this upgrade is recommended (shown to user in notification)';

COMMENT ON COLUMN subscription_upgrade_requests.user_response_notes IS
'Optional notes from user when accepting or declining the upgrade request';
