/**
 * Migration 045: Add Refund Comments and Status History (FIXED)
 *
 * Purpose: Enable two-way communication between users and admins for refund requests
 * and track complete status change history with audit trail.
 *
 * Features:
 * - refund_comments table for bidirectional communication
 * - refund_status_history table for audit trail
 * - Automatic status change tracking via trigger
 * - Activity feed view unifying comments and status changes
 * - Internal notes capability for admins
 */

-- =====================================================
-- 1. CREATE REFUND_COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS refund_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_request_id UUID NOT NULL REFERENCES refund_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,  -- true = admin-only, false = visible to guest
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refund_comments_refund ON refund_comments(refund_request_id);
CREATE INDEX IF NOT EXISTS idx_refund_comments_user ON refund_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_comments_created ON refund_comments(created_at DESC);

-- Comments on table and columns
COMMENT ON TABLE refund_comments IS 'Two-way comments between users and admins on refund requests';
COMMENT ON COLUMN refund_comments.is_internal IS 'If true, comment is only visible to admins';
COMMENT ON COLUMN refund_comments.comment_text IS 'The comment content';

-- =====================================================
-- 2. CREATE REFUND_STATUS_HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS refund_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_request_id UUID NOT NULL REFERENCES refund_requests(id) ON DELETE CASCADE,
  from_status VARCHAR(50),  -- null for initial creation
  to_status VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT,  -- optional note about why status changed
  metadata JSONB  -- flexible field for additional context
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refund_status_history_refund ON refund_status_history(refund_request_id);
CREATE INDEX IF NOT EXISTS idx_refund_status_history_changed_at ON refund_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_status_history_changed_by ON refund_status_history(changed_by);

-- Comments on table and columns
COMMENT ON TABLE refund_status_history IS 'Complete audit trail of all refund status changes';
COMMENT ON COLUMN refund_status_history.from_status IS 'Previous status (null for initial creation)';
COMMENT ON COLUMN refund_status_history.to_status IS 'New status after change';
COMMENT ON COLUMN refund_status_history.change_reason IS 'Optional explanation for the status change';
COMMENT ON COLUMN refund_status_history.metadata IS 'Additional context data in JSON format';

-- =====================================================
-- 3. ADD FIELDS TO REFUND_REQUESTS TABLE
-- =====================================================

ALTER TABLE refund_requests
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS last_comment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_attention_required BOOLEAN DEFAULT false;

-- Comments on new columns
COMMENT ON COLUMN refund_requests.updated_by IS 'User who last updated the refund request';
COMMENT ON COLUMN refund_requests.last_comment_at IS 'Timestamp of most recent comment (for sorting by activity)';
COMMENT ON COLUMN refund_requests.comment_count IS 'Total number of comments on this refund';
COMMENT ON COLUMN refund_requests.admin_attention_required IS 'Flag for urgent admin review needed';

-- =====================================================
-- 4. CREATE TRIGGER FOR AUTOMATIC STATUS TRACKING
-- =====================================================

-- Function to automatically track status changes
CREATE OR REPLACE FUNCTION track_refund_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO refund_status_history (
      refund_request_id,
      from_status,
      to_status,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.updated_by, NEW.reviewed_by, NEW.processed_by, NEW.requested_by),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to refund_requests table
DROP TRIGGER IF EXISTS refund_status_change_trigger ON refund_requests;
CREATE TRIGGER refund_status_change_trigger
AFTER UPDATE ON refund_requests
FOR EACH ROW
EXECUTE FUNCTION track_refund_status_change();

COMMENT ON FUNCTION track_refund_status_change IS 'Automatically logs refund status changes to history table';

-- =====================================================
-- 5. CREATE VIEW: LATEST COMMENT PREVIEW
-- =====================================================

-- View showing the most recent comment for each refund
CREATE OR REPLACE VIEW refund_latest_comments AS
SELECT DISTINCT ON (refund_request_id)
  rc.refund_request_id,
  rc.comment_text,
  rc.created_at,
  rc.is_internal,
  u.full_name AS commenter_name,
  ut.name AS commenter_role
FROM refund_comments rc
JOIN users u ON rc.user_id = u.id
LEFT JOIN user_types ut ON u.user_type_id = ut.id
ORDER BY rc.refund_request_id, rc.created_at DESC;

COMMENT ON VIEW refund_latest_comments IS 'Latest comment preview for each refund request';

-- =====================================================
-- 6. CREATE VIEW: UNIFIED ACTIVITY FEED
-- =====================================================

-- View combining status changes and comments into single activity timeline
CREATE OR REPLACE VIEW refund_activity_feed AS
SELECT
  rsh.refund_request_id,
  'status_change' AS activity_type,
  rsh.changed_at AS activity_at,
  u.full_name AS actor_name,
  ut.name AS actor_role,
  rsh.from_status || ' → ' || rsh.to_status AS activity_description,
  rsh.change_reason AS additional_info,
  false AS is_internal
FROM refund_status_history rsh
JOIN users u ON rsh.changed_by = u.id
LEFT JOIN user_types ut ON u.user_type_id = ut.id

UNION ALL

SELECT
  rc.refund_request_id,
  'comment' AS activity_type,
  rc.created_at AS activity_at,
  u.full_name AS actor_name,
  ut.name AS actor_role,
  rc.comment_text AS activity_description,
  NULL AS additional_info,
  rc.is_internal
FROM refund_comments rc
JOIN users u ON rc.user_id = u.id
LEFT JOIN user_types ut ON u.user_type_id = ut.id

ORDER BY activity_at DESC;

COMMENT ON VIEW refund_activity_feed IS 'Unified timeline of status changes and comments for refunds';

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS) FOR COMMENTS
-- =====================================================

ALTER TABLE refund_comments ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS refund_comments_guest_read ON refund_comments;
DROP POLICY IF EXISTS refund_comments_admin_read ON refund_comments;
DROP POLICY IF EXISTS refund_comments_guest_insert ON refund_comments;
DROP POLICY IF EXISTS refund_comments_admin_insert ON refund_comments;

-- Policy: Users can read comments on their own refund requests (excluding internal comments)
CREATE POLICY refund_comments_guest_read ON refund_comments
  FOR SELECT
  USING (
    refund_request_id IN (
      SELECT id FROM refund_requests WHERE requested_by = auth.uid()
    )
    AND is_internal = false
  );

-- Policy: Admins can read all comments
CREATE POLICY refund_comments_admin_read ON refund_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'admin')
    )
  );

-- Policy: Users can insert comments on their own refund requests
CREATE POLICY refund_comments_guest_insert ON refund_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND refund_request_id IN (
      SELECT id FROM refund_requests WHERE requested_by = auth.uid()
    )
    AND is_internal = false  -- Guests cannot create internal comments
  );

-- Policy: Admins can insert any comments (including internal)
CREATE POLICY refund_comments_admin_insert ON refund_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS) FOR STATUS HISTORY
-- =====================================================

ALTER TABLE refund_status_history ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS refund_status_history_guest_read ON refund_status_history;
DROP POLICY IF EXISTS refund_status_history_admin_read ON refund_status_history;
DROP POLICY IF EXISTS refund_status_history_admin_insert ON refund_status_history;

-- Policy: Users can read status history for their own refund requests
CREATE POLICY refund_status_history_guest_read ON refund_status_history
  FOR SELECT
  USING (
    refund_request_id IN (
      SELECT id FROM refund_requests WHERE requested_by = auth.uid()
    )
  );

-- Policy: Admins can read all status history
CREATE POLICY refund_status_history_admin_read ON refund_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'admin')
    )
  );

-- Policy: Only trigger/system can insert status history (users should not insert directly)
-- Admins can manually insert if needed via admin role
CREATE POLICY refund_status_history_admin_insert ON refund_status_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
      AND ut.name IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- 9. CREATE HELPER FUNCTION: GET REFUND ACTIVITY COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION get_refund_activity_count(refund_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM (
    SELECT 1 FROM refund_comments WHERE refund_request_id = refund_id
    UNION ALL
    SELECT 1 FROM refund_status_history WHERE refund_request_id = refund_id
  ) activities;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_refund_activity_count IS 'Returns total count of activities (comments + status changes) for a refund';

-- =====================================================
-- 10. INSERT INITIAL STATUS HISTORY FOR EXISTING REFUNDS
-- =====================================================

-- Backfill status history for existing refund requests
-- This creates initial history entries for refunds that exist before this migration

INSERT INTO refund_status_history (
  refund_request_id,
  from_status,
  to_status,
  changed_by,
  changed_at,
  change_reason
)
SELECT
  rr.id,
  NULL as from_status,  -- Initial creation has no previous status
  rr.status,
  rr.requested_by,
  rr.requested_at,
  'Initial refund request created (backfilled from migration 045)' as change_reason
FROM refund_requests rr
WHERE NOT EXISTS (
  SELECT 1 FROM refund_status_history rsh
  WHERE rsh.refund_request_id = rr.id
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 045 completed successfully';
  RAISE NOTICE '- Created refund_comments table';
  RAISE NOTICE '- Created refund_status_history table';
  RAISE NOTICE '- Added tracking fields to refund_requests';
  RAISE NOTICE '- Created automatic status change trigger';
  RAISE NOTICE '- Created activity feed views';
  RAISE NOTICE '- Configured RLS policies';
  RAISE NOTICE '- Backfilled initial status history for existing refunds';
END $$;
