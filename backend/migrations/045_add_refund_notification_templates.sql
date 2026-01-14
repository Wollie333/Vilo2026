-- Migration: 045_add_refund_notification_templates.sql
-- Description: Add notification templates for refund workflow
-- Author: Claude
-- Date: 2026-01-10

-- ============================================================================
-- REFUND NOTIFICATION TEMPLATES
-- ============================================================================

-- Insert refund-related notification templates
INSERT INTO public.notification_templates (event_type, channel, subject, body, variables, is_active)
VALUES
  -- Refund Requested (to admin)
  (
    'refund_requested',
    'email',
    'New Refund Request for Booking {{booking_reference}}',
    '<p>Hello {{property_owner_name}},</p>
    <p>A refund request has been submitted for booking <strong>{{booking_reference}}</strong>.</p>
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Guest:</strong> {{guest_name}}</li>
      <li><strong>Check-in:</strong> {{check_in_date}}</li>
      <li><strong>Total Paid:</strong> {{currency}} {{amount_paid}}</li>
    </ul>
    <h3>Refund Request:</h3>
    <ul>
      <li><strong>Requested Amount:</strong> {{currency}} {{requested_amount}}</li>
      <li><strong>Suggested Amount (Policy):</strong> {{currency}} {{suggested_amount}}</li>
      <li><strong>Reason:</strong> {{reason}}</li>
    </ul>
    <p><a href="{{admin_url}}/admin/refunds/{{refund_id}}">Review Refund Request</a></p>',
    '["booking_reference", "property_owner_name", "guest_name", "check_in_date", "amount_paid", "requested_amount", "suggested_amount", "reason", "currency", "admin_url", "refund_id"]',
    true
  ),

  -- Refund Under Review (to guest)
  (
    'refund_under_review',
    'email',
    'Your Refund Request is Under Review',
    '<p>Hello {{guest_name}},</p>
    <p>We have received your refund request for booking <strong>{{booking_reference}}</strong> and it is currently under review.</p>
    <h3>Request Summary:</h3>
    <ul>
      <li><strong>Requested Amount:</strong> {{currency}} {{requested_amount}}</li>
      <li><strong>Booking Date:</strong> {{check_in_date}}</li>
    </ul>
    <p>You will receive an email notification once your request has been reviewed by our team.</p>
    <p><a href="{{portal_url}}/bookings/{{booking_id}}">View Booking</a></p>',
    '["guest_name", "booking_reference", "requested_amount", "check_in_date", "currency", "portal_url", "booking_id"]',
    true
  ),

  -- Refund Approved (to guest)
  (
    'refund_approved',
    'email',
    'Refund Request Approved for Booking {{booking_reference}}',
    '<p>Hello {{guest_name}},</p>
    <p>Great news! Your refund request for booking <strong>{{booking_reference}}</strong> has been approved.</p>
    <h3>Approved Refund:</h3>
    <ul>
      <li><strong>Refund Amount:</strong> {{currency}} {{approved_amount}}</li>
      <li><strong>Original Booking Amount:</strong> {{currency}} {{total_amount}}</li>
    </ul>
    <p>Your refund is now being processed and you should receive it within 5-10 business days, depending on your payment method.</p>
    {{#review_notes}}
    <p><strong>Notes from our team:</strong> {{review_notes}}</p>
    {{/review_notes}}
    <p>Thank you for your patience.</p>',
    '["guest_name", "booking_reference", "approved_amount", "total_amount", "currency", "review_notes"]',
    true
  ),

  -- Refund Rejected (to guest)
  (
    'refund_rejected',
    'email',
    'Refund Request Update for Booking {{booking_reference}}',
    '<p>Hello {{guest_name}},</p>
    <p>We have reviewed your refund request for booking <strong>{{booking_reference}}</strong>.</p>
    <p>Unfortunately, we are unable to approve your refund request at this time.</p>
    <h3>Reason:</h3>
    <p>{{review_notes}}</p>
    <p>If you have any questions or would like to discuss this further, please contact our support team.</p>
    <p><a href="{{support_url}}">Contact Support</a></p>',
    '["guest_name", "booking_reference", "review_notes", "support_url"]',
    true
  ),

  -- Refund Processing (to guest)
  (
    'refund_processing',
    'email',
    'Your Refund is Being Processed',
    '<p>Hello {{guest_name}},</p>
    <p>Your refund for booking <strong>{{booking_reference}}</strong> is currently being processed.</p>
    <h3>Refund Details:</h3>
    <ul>
      <li><strong>Amount:</strong> {{currency}} {{approved_amount}}</li>
      <li><strong>Method:</strong> Refund to original payment method</li>
    </ul>
    <p>Please allow 5-10 business days for the refund to appear in your account. The exact timing depends on your bank or payment provider.</p>
    <p>You will receive a confirmation email once the refund has been completed.</p>',
    '["guest_name", "booking_reference", "approved_amount", "currency"]',
    true
  ),

  -- Refund Completed (to guest)
  (
    'refund_completed',
    'email',
    'Refund Completed for Booking {{booking_reference}}',
    '<p>Hello {{guest_name}},</p>
    <p>Your refund for booking <strong>{{booking_reference}}</strong> has been successfully processed!</p>
    <h3>Refund Summary:</h3>
    <ul>
      <li><strong>Refund Amount:</strong> {{currency}} {{refunded_amount}}</li>
      <li><strong>Refund Date:</strong> {{refund_date}}</li>
      <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
    </ul>
    <p>A credit memo has been generated for your records.</p>
    <p><a href="{{credit_memo_url}}">Download Credit Memo (PDF)</a></p>
    <p>Please allow 3-5 business days for the refund to appear in your account.</p>
    <p>Thank you for your patience, and we hope to serve you again in the future!</p>',
    '["guest_name", "booking_reference", "refunded_amount", "refund_date", "refund_reference", "currency", "credit_memo_url"]',
    true
  ),

  -- Refund Failed (to admin)
  (
    'refund_failed',
    'email',
    'Refund Processing Failed - Manual Action Required',
    '<p>Hello Admin,</p>
    <p><strong>URGENT:</strong> Automatic refund processing failed for booking <strong>{{booking_reference}}</strong>.</p>
    <h3>Refund Details:</h3>
    <ul>
      <li><strong>Refund ID:</strong> {{refund_id}}</li>
      <li><strong>Guest:</strong> {{guest_name}}</li>
      <li><strong>Amount:</strong> {{currency}} {{approved_amount}}</li>
    </ul>
    <h3>Error Details:</h3>
    <p>{{failure_reason}}</p>
    <h3>Action Required:</h3>
    <p>Please manually process this refund or retry the automatic processing.</p>
    <p><a href="{{admin_url}}/admin/refunds/{{refund_id}}">View Refund Request</a></p>',
    '["booking_reference", "refund_id", "guest_name", "approved_amount", "currency", "failure_reason", "admin_url"]',
    true
  )
ON CONFLICT (event_type, channel) DO UPDATE
SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================

-- Add refund event types to notification preferences (users can opt-in/out)
-- This will be handled by the notification preferences system already in place

COMMENT ON TABLE public.notification_templates IS 'Updated with refund notification templates';
