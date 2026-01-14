-- Migration: 081_create_refund_rls_policies.sql
-- Description: Update Row Level Security policies for refund tables
-- Date: 2026-01-14
-- Note: Replaces old RLS policies from migrations 045 and 046 with comprehensive new policies

-- ============================================================================
-- DROP OLD POLICIES (from migrations 045 and 046)
-- ============================================================================

-- Drop old refund_comments policies
DROP POLICY IF EXISTS refund_comments_guest_read ON refund_comments;
DROP POLICY IF EXISTS refund_comments_admin_read ON refund_comments;
DROP POLICY IF EXISTS refund_comments_guest_insert ON refund_comments;
DROP POLICY IF EXISTS refund_comments_admin_insert ON refund_comments;

-- Drop old refund_status_history policies
DROP POLICY IF EXISTS refund_status_history_guest_read ON refund_status_history;
DROP POLICY IF EXISTS refund_status_history_admin_read ON refund_status_history;
DROP POLICY IF EXISTS refund_status_history_admin_insert ON refund_status_history;

-- Drop old refund_documents policies (if any exist from migration 046)
DROP POLICY IF EXISTS refund_documents_guest_read ON refund_documents;
DROP POLICY IF EXISTS refund_documents_admin_read ON refund_documents;
DROP POLICY IF EXISTS refund_documents_guest_insert ON refund_documents;
DROP POLICY IF EXISTS refund_documents_admin_insert ON refund_documents;

-- ============================================================================
-- ENABLE RLS (if not already enabled)
-- ============================================================================

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REFUND_REQUESTS POLICIES
-- ============================================================================

-- Guest can view their own refund requests
CREATE POLICY "Guests can view own refund requests"
  ON refund_requests
  FOR SELECT
  USING (
    requested_by = auth.uid()
  );

-- Property owners can view refunds for their properties
CREATE POLICY "Property owners can view property refunds"
  ON refund_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.id = refund_requests.booking_id
        AND p.owner_id = auth.uid()
    )
  );

-- Company team members can view refunds for company properties
CREATE POLICY "Team members can view company property refunds"
  ON refund_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE b.id = refund_requests.booking_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
    )
  );

-- Super admins can view all refunds
CREATE POLICY "Super admins can view all refunds"
  ON refund_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );

-- Guest can create refund request for their own booking
CREATE POLICY "Guests can create refund requests"
  ON refund_requests
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id
        AND guest_id = auth.uid()
    )
  );

-- Property owners can update refunds for their properties
CREATE POLICY "Property owners can update property refunds"
  ON refund_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.id = refund_requests.booking_id
        AND p.owner_id = auth.uid()
    )
  );

-- Company team members with manager role can update refunds
CREATE POLICY "Team managers can update company property refunds"
  ON refund_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE b.id = refund_requests.booking_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
        AND ctm.role IN ('owner', 'manager')
    )
  );

-- Super admins can update all refunds
CREATE POLICY "Super admins can update all refunds"
  ON refund_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );

-- ============================================================================
-- REFUND_COMMENTS POLICIES
-- ============================================================================

-- Users can view comments on refunds they have access to
CREATE POLICY "Users can view accessible refund comments"
  ON refund_comments
  FOR SELECT
  USING (
    -- Guest can see non-internal comments on their refunds
    (
      EXISTS (
        SELECT 1 FROM refund_requests rr
        WHERE rr.id = refund_comments.refund_request_id
          AND rr.requested_by = auth.uid()
      )
      AND is_internal = false
    )
    OR
    -- Property owners can see all comments for their properties
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      WHERE rr.id = refund_comments.refund_request_id
        AND p.owner_id = auth.uid()
    )
    OR
    -- Team members can see all comments for company properties
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE rr.id = refund_comments.refund_request_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
    )
    OR
    -- Super admins can see all comments
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );

-- Users can create comments on refunds they have access to
CREATE POLICY "Users can create refund comments"
  ON refund_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Guest can comment on their own refunds (non-internal only)
      (
        EXISTS (
          SELECT 1 FROM refund_requests
          WHERE id = refund_request_id
            AND requested_by = auth.uid()
        )
        AND is_internal = false
      )
      OR
      -- Property owners can comment (including internal)
      EXISTS (
        SELECT 1 FROM refund_requests rr
        JOIN bookings b ON rr.booking_id = b.id
        JOIN properties p ON b.property_id = p.id
        WHERE rr.id = refund_request_id
          AND p.owner_id = auth.uid()
      )
      OR
      -- Team members can comment (including internal)
      EXISTS (
        SELECT 1 FROM refund_requests rr
        JOIN bookings b ON rr.booking_id = b.id
        JOIN properties p ON b.property_id = p.id
        JOIN company_team_members ctm ON p.company_id = ctm.company_id
        WHERE rr.id = refund_request_id
          AND ctm.user_id = auth.uid()
          AND ctm.is_active = true
      )
      OR
      -- Super admins can comment anywhere
      EXISTS (
        SELECT 1 FROM users u
        JOIN user_types ut ON u.user_type_id = ut.id
        WHERE u.id = auth.uid()
          AND ut.name = 'super_admin'
      )
    )
  );

-- ============================================================================
-- REFUND_STATUS_HISTORY POLICIES
-- ============================================================================

-- Users can read status history for their own refund requests
CREATE POLICY "Guests can view own refund status history"
  ON refund_status_history
  FOR SELECT
  USING (
    refund_request_id IN (
      SELECT id FROM refund_requests WHERE requested_by = auth.uid()
    )
  );

-- Property owners can read status history for their properties
CREATE POLICY "Property owners can view property refund history"
  ON refund_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      WHERE rr.id = refund_status_history.refund_request_id
        AND p.owner_id = auth.uid()
    )
  );

-- Team members can read status history for company properties
CREATE POLICY "Team members can view company refund history"
  ON refund_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE rr.id = refund_status_history.refund_request_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
    )
  );

-- Super admins can read all status history
CREATE POLICY "Super admins can view all refund history"
  ON refund_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );

-- Only admins can manually insert status history
CREATE POLICY "Admins can insert refund status history"
  ON refund_status_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- REFUND_DOCUMENTS POLICIES
-- ============================================================================

-- Users can view documents on refunds they have access to
CREATE POLICY "Users can view accessible refund documents"
  ON refund_documents
  FOR SELECT
  USING (
    -- Guest can see their own uploaded documents
    uploaded_by = auth.uid()
    OR
    -- Property owners can see documents for their properties
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      WHERE rr.id = refund_documents.refund_request_id
        AND p.owner_id = auth.uid()
    )
    OR
    -- Team members can see documents for company properties
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE rr.id = refund_documents.refund_request_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
    )
    OR
    -- Super admins can see all documents
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );

-- Users can upload documents to refunds they have access to
CREATE POLICY "Users can upload refund documents"
  ON refund_documents
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      -- Guest can upload to their own refunds
      EXISTS (
        SELECT 1 FROM refund_requests
        WHERE id = refund_request_id
          AND requested_by = auth.uid()
      )
      OR
      -- Property owners can upload documents
      EXISTS (
        SELECT 1 FROM refund_requests rr
        JOIN bookings b ON rr.booking_id = b.id
        JOIN properties p ON b.property_id = p.id
        WHERE rr.id = refund_request_id
          AND p.owner_id = auth.uid()
      )
      OR
      -- Team members can upload documents
      EXISTS (
        SELECT 1 FROM refund_requests rr
        JOIN bookings b ON rr.booking_id = b.id
        JOIN properties p ON b.property_id = p.id
        JOIN company_team_members ctm ON p.company_id = ctm.company_id
        WHERE rr.id = refund_request_id
          AND ctm.user_id = auth.uid()
          AND ctm.is_active = true
      )
      OR
      -- Super admins can upload documents
      EXISTS (
        SELECT 1 FROM users u
        JOIN user_types ut ON u.user_type_id = ut.id
        WHERE u.id = auth.uid()
          AND ut.name = 'super_admin'
      )
    )
  );

-- Property owners and team managers can update document verification status
CREATE POLICY "Owners and managers can update document verification"
  ON refund_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      WHERE rr.id = refund_documents.refund_request_id
        AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE rr.id = refund_documents.refund_request_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
        AND ctm.role IN ('owner', 'manager')
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );

-- Users can delete their own uploaded documents (before verification)
CREATE POLICY "Users can delete own unverified documents"
  ON refund_documents
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND is_verified = false
  );

-- Property owners and managers can delete documents
CREATE POLICY "Owners and managers can delete documents"
  ON refund_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      WHERE rr.id = refund_documents.refund_request_id
        AND p.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM refund_requests rr
      JOIN bookings b ON rr.booking_id = b.id
      JOIN properties p ON b.property_id = p.id
      JOIN company_team_members ctm ON p.company_id = ctm.company_id
      WHERE rr.id = refund_documents.refund_request_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
        AND ctm.role IN ('owner', 'manager')
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = auth.uid()
        AND ut.name = 'super_admin'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 081 completed successfully';
  RAISE NOTICE '- Dropped old RLS policies from migrations 045 and 046';
  RAISE NOTICE '- Created comprehensive RLS policies for all refund tables';
  RAISE NOTICE '- Enabled RLS on refund_requests, refund_comments, refund_status_history, refund_documents';
  RAISE NOTICE '- Company team members can access refunds for company properties';
END $$;
