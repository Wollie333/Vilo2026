-- Migration: 080_create_refund_notification_templates.sql
-- Description: Add notification templates for refund lifecycle events
-- Date: 2026-01-14

-- ============================================================================
-- STEP 1: Create or get 'refund' notification type
-- ============================================================================

DO $$
DECLARE
  v_refund_type_id UUID;
BEGIN
  -- Check if refund notification type exists
  SELECT id INTO v_refund_type_id FROM notification_types WHERE name = 'refund';

  -- If not, create it
  IF v_refund_type_id IS NULL THEN
    INSERT INTO notification_types (name, display_name, description, icon, color, is_system_type, sort_order)
    VALUES ('refund', 'Refund', 'Refund-related notifications', 'credit-card', 'warning', true, 8)
    RETURNING id INTO v_refund_type_id;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create refund notification templates
-- ============================================================================

DO $$
DECLARE
  v_refund_type_id UUID;
BEGIN
  -- Get the refund notification type ID
  SELECT id INTO v_refund_type_id FROM notification_types WHERE name = 'refund';

  -- Insert all refund notification templates
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant,
    is_active
  )
  VALUES
    -- 1. Refund Request Created (to admins)
    (
      v_refund_type_id,
      'refund_requested',
      'New Refund Request for Booking {{booking_reference}}',
      'A guest has requested a refund for booking {{booking_reference}}. Requested amount: {{requested_amount}}',
      'New Refund Request for Booking {{booking_reference}}',
      '<h2>New Refund Request</h2>
       <p>A guest has requested a refund for booking <strong>{{booking_reference}}</strong>.</p>
       <p><strong>Guest:</strong> {{guest_name}} ({{guest_email}})</p>
       <p><strong>Property:</strong> {{property_name}}</p>
       <p><strong>Requested Amount:</strong> {{requested_amount}}</p>
       <p><strong>Reason:</strong> {{reason}}</p>
       <p><a href="{{dashboard_url}}/bookings/{{booking_id}}">Review Refund Request</a></p>',
      'high',
      'info',
      true
    ),

    -- 2. Refund Approved (to guest)
    (
      v_refund_type_id,
      'refund_approved',
      'Refund Request Approved',
      'Your refund request for booking {{booking_reference}} has been approved. Amount: {{approved_amount}}',
      'Your Refund Request for {{booking_reference}} Has Been Approved',
      '<h2>Refund Approved</h2>
       <p>Great news! Your refund request for booking <strong>{{booking_reference}}</strong> has been approved.</p>
       <p><strong>Approved Amount:</strong> {{approved_amount}}</p>
       <p><strong>Property:</strong> {{property_name}}</p>
       <p>Your refund will be processed shortly and returned to your original payment method(s).</p>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">View Booking Details</a></p>',
      'high',
      'success',
      true
    ),

    -- 3. Refund Rejected (to guest)
    (
      v_refund_type_id,
      'refund_rejected',
      'Refund Request Declined',
      'Your refund request for booking {{booking_reference}} has been declined. Reason: {{rejection_reason}}',
      'Your Refund Request for {{booking_reference}} Has Been Declined',
      '<h2>Refund Request Declined</h2>
       <p>We regret to inform you that your refund request for booking <strong>{{booking_reference}}</strong> has been declined.</p>
       <p><strong>Property:</strong> {{property_name}}</p>
       <p><strong>Reason:</strong> {{rejection_reason}}</p>
       <p>If you have questions or would like to discuss this decision, please contact the property directly.</p>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">View Booking Details</a></p>',
      'high',
      'warning',
      true
    ),

    -- 4. Refund Processing Started (to guest and admins)
    (
      v_refund_type_id,
      'refund_processing_started',
      'Refund Processing Started',
      'Your refund for booking {{booking_reference}} is now being processed. Amount: {{refund_amount}}',
      'Your Refund for {{booking_reference}} Is Being Processed',
      '<h2>Refund Processing</h2>
       <p>Your refund for booking <strong>{{booking_reference}}</strong> is now being processed.</p>
       <p><strong>Refund Amount:</strong> {{refund_amount}}</p>
       <p><strong>Property:</strong> {{property_name}}</p>
       <p>The refund will be returned to your original payment method(s). This typically takes 5-10 business days.</p>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">Track Refund Status</a></p>',
      'normal',
      'info',
      true
    ),

    -- 5. Refund Processing Completed (to guest)
    (
      v_refund_type_id,
      'refund_processing_completed',
      'Refund Processed Successfully',
      'Your refund for booking {{booking_reference}} has been successfully processed. Amount: {{refund_amount}}',
      'Your Refund for {{booking_reference}} Has Been Processed',
      '<h2>Refund Processed Successfully</h2>
       <p>Your refund for booking <strong>{{booking_reference}}</strong> has been successfully processed.</p>
       <p><strong>Refund Amount:</strong> {{refund_amount}}</p>
       <p><strong>Property:</strong> {{property_name}}</p>
       <p>The funds have been sent to your original payment method(s). Depending on your bank, it may take 5-10 business days to appear in your account.</p>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">View Transaction Details</a></p>',
      'normal',
      'success',
      true
    ),

    -- 6. Refund Processing Failed (to guest and admins)
    (
      v_refund_type_id,
      'refund_processing_failed',
      'Issue Processing Refund',
      'We encountered an issue while processing your refund for booking {{booking_reference}}.',
      'Issue Processing Your Refund for {{booking_reference}}',
      '<h2>Refund Processing Issue</h2>
       <p>We encountered an issue while processing your refund for booking <strong>{{booking_reference}}</strong>.</p>
       <p><strong>Property:</strong> {{property_name}}</p>
       <p>Our team has been notified and is working to resolve this. We will contact you shortly with an update.</p>
       <p>If you have questions, please contact support.</p>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">View Booking Details</a></p>',
      'high',
      'error',
      true
    ),

    -- 7. Refund Completed (to all parties)
    (
      v_refund_type_id,
      'refund_completed',
      'Refund Completed',
      'The refund for booking {{booking_reference}} is now complete. Total refunded: {{total_refunded}}',
      'Refund Complete for {{booking_reference}}',
      '<h2>Refund Completed</h2>
       <p>The refund for booking <strong>{{booking_reference}}</strong> is now complete.</p>
       <p><strong>Total Refunded:</strong> {{total_refunded}}</p>
       <p><strong>Property:</strong> {{property_name}}</p>
       <p>Thank you for your business. We hope to serve you again in the future.</p>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">View Final Summary</a></p>',
      'normal',
      'success',
      true
    ),

    -- 8. Refund Cancelled (to guest and admins)
    (
      v_refund_type_id,
      'refund_cancelled',
      'Refund Request Cancelled',
      'The refund request for booking {{booking_reference}} has been cancelled.',
      'Refund Request Cancelled for {{booking_reference}}',
      '<h2>Refund Request Cancelled</h2>
       <p>The refund request for booking <strong>{{booking_reference}}</strong> has been cancelled.</p>
       <p><strong>Property:</strong> {{property_name}}</p>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">View Booking Details</a></p>',
      'normal',
      'info',
      true
    ),

    -- 9. New Comment from Guest (to admins)
    (
      v_refund_type_id,
      'refund_comment_from_guest',
      'New Comment on Refund Request',
      '{{guest_name}} has added a comment to refund request {{refund_reference}}.',
      'New Comment on Refund Request {{refund_reference}}',
      '<h2>New Guest Comment</h2>
       <p>{{guest_name}} has added a comment to refund request <strong>{{refund_reference}}</strong>.</p>
       <p><strong>Booking:</strong> {{booking_reference}}</p>
       <p><strong>Comment:</strong></p>
       <blockquote>{{comment_text}}</blockquote>
       <p><a href="{{dashboard_url}}/bookings/{{booking_id}}">View and Respond</a></p>',
      'normal',
      'info',
      true
    ),

    -- 10. New Comment from Admin (to guest)
    (
      v_refund_type_id,
      'refund_comment_from_admin',
      'Update on Your Refund Request',
      'The property has added a comment to your refund request for booking {{booking_reference}}.',
      'Update on Your Refund Request for {{booking_reference}}',
      '<h2>New Message</h2>
       <p>The property has added a comment to your refund request for booking <strong>{{booking_reference}}</strong>.</p>
       <p><strong>Message:</strong></p>
       <blockquote>{{comment_text}}</blockquote>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">View and Respond</a></p>',
      'normal',
      'info',
      true
    ),

    -- 11. Document Uploaded (to admins)
    (
      v_refund_type_id,
      'refund_document_uploaded',
      'New Document Uploaded',
      '{{guest_name}} has uploaded a document for refund request {{refund_reference}}.',
      'New Document for Refund Request {{refund_reference}}',
      '<h2>New Document Uploaded</h2>
       <p>{{guest_name}} has uploaded a document for refund request <strong>{{refund_reference}}</strong>.</p>
       <p><strong>Booking:</strong> {{booking_reference}}</p>
       <p><strong>File Name:</strong> {{file_name}}</p>
       <p>Please review and verify the document.</p>
       <p><a href="{{dashboard_url}}/bookings/{{booking_id}}">Review Document</a></p>',
      'normal',
      'info',
      true
    ),

    -- 12. Document Verified/Rejected (to uploader)
    (
      v_refund_type_id,
      'refund_document_verified',
      'Document Verification Status',
      'Your document for refund request {{refund_reference}} has been {{verification_status}}.',
      'Document {{verification_status}} for Refund {{refund_reference}}',
      '<h2>Document {{verification_status}}</h2>
       <p>Your document for refund request <strong>{{refund_reference}}</strong> has been {{verification_status}}.</p>
       <p><strong>File Name:</strong> {{file_name}}</p>
       <p><a href="{{portal_url}}/bookings/{{booking_id}}">View Refund Details</a></p>',
      'low',
      'info',
      true
    )
  ON CONFLICT (name) DO NOTHING;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all templates were created
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count
  FROM notification_templates
  WHERE name LIKE 'refund_%';

  RAISE NOTICE 'Created % refund notification templates', template_count;
END $$;
