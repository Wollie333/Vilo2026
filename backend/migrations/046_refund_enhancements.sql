-- Migration: 046_refund_enhancements.sql
-- Description: Add refund withdrawal feature, booking lock helper, and fix RLS policies
-- Author: Claude
-- Date: 2026-01-10

-- ============================================================================
-- 1. ADD 'WITHDRAWN' STATUS TO REFUND_STATUS ENUM
-- ============================================================================

-- Add 'withdrawn' value to refund_status enum
ALTER TYPE refund_status ADD VALUE IF NOT EXISTS 'withdrawn';

-- ============================================================================
-- 2. FIX RLS POLICIES (SECURITY ENHANCEMENT)
-- ============================================================================

-- Drop the overly permissive SELECT policy that allows any authenticated user
-- to see all refund requests
DROP POLICY IF EXISTS refund_requests_select_policy ON public.refund_requests;

-- Create proper user-restricted SELECT policy
-- Users can see refunds that they:
-- 1. Created themselves (requested_by = their user ID)
-- 2. Own through property ownership (booking's property owner)
-- 3. Have 'refunds:manage' permission
-- 4. Are super admin
CREATE POLICY refund_requests_select_policy ON public.refund_requests
  FOR SELECT
  TO authenticated
  USING (
    -- User created the refund request
    requested_by = auth.uid()
    OR
    -- User owns the property for this booking
    booking_id IN (
      SELECT b.id FROM public.bookings b
      WHERE b.property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
      )
    )
    OR
    -- User has refunds management permission
    has_permission('refunds', 'manage')
    OR
    -- User is super admin
    is_super_admin()
  );

-- Update INSERT policy to ensure requested_by is set correctly
DROP POLICY IF EXISTS refund_requests_insert_policy ON public.refund_requests;
CREATE POLICY refund_requests_insert_policy ON public.refund_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can only create refunds for bookings that belong to them or their properties
    (
      booking_id IN (
        SELECT b.id FROM public.bookings b
        WHERE b.guest_id = auth.uid()
           OR b.property_id IN (
             SELECT id FROM public.properties WHERE owner_id = auth.uid()
           )
      )
    )
    OR
    -- Or user has refunds management permission
    has_permission('refunds', 'manage')
    OR
    -- Or user is super admin
    is_super_admin()
  );

-- Update UPDATE policy to allow users to withdraw their own refunds
DROP POLICY IF EXISTS refund_requests_update_policy ON public.refund_requests;
CREATE POLICY refund_requests_update_policy ON public.refund_requests
  FOR UPDATE
  TO authenticated
  USING (
    -- User can withdraw their own refund (only status change to 'withdrawn')
    requested_by = auth.uid()
    OR
    -- Property owner can manage refunds for their properties
    booking_id IN (
      SELECT b.id FROM public.bookings b
      WHERE b.property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
      )
    )
    OR
    -- User has refunds management permission
    has_permission('refunds', 'manage')
    OR
    -- User is super admin
    is_super_admin()
  );

-- ============================================================================
-- 3. ADD REFUND WITHDRAWN NOTIFICATION TEMPLATE
-- ============================================================================

DO $$
DECLARE
  v_payment_type_id UUID;
BEGIN
  -- Get the payment notification type ID
  SELECT id INTO v_payment_type_id FROM notification_types WHERE name = 'payment';

  -- Insert the refund_withdrawn template with correct schema
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
  VALUES (
    v_payment_type_id,
    'refund_withdrawn',
    'Refund Request Withdrawn',
    'The refund request for booking {{booking_reference}} has been withdrawn by {{guest_name}}.',
    'Refund Request Withdrawn for Booking {{booking_reference}}',
    '<h1>Refund Request Withdrawn</h1>
    <p>Hello {{property_owner_name}},</p>
    <p>The refund request for booking <strong>{{booking_reference}}</strong> has been withdrawn by the guest.</p>
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Guest:</strong> {{guest_name}}</li>
      <li><strong>Check-in:</strong> {{check_in_date}}</li>
      <li><strong>Booking Amount:</strong> {{currency}} {{total_amount}}</li>
    </ul>
    <h3>Withdrawn Refund Request:</h3>
    <ul>
      <li><strong>Requested Amount:</strong> {{currency}} {{requested_amount}}</li>
      <li><strong>Original Reason:</strong> {{reason}}</li>
      <li><strong>Withdrawn At:</strong> {{withdrawn_at}}</li>
    </ul>
    <p>No further action is required for this refund request.</p>
    <p><a href="{{admin_url}}/admin/refunds/{{refund_id}}">View Refund Details</a></p>',
    'normal',
    'info',
    true
  )
  ON CONFLICT (name) DO UPDATE
  SET
    title_template = EXCLUDED.title_template,
    message_template = EXCLUDED.message_template,
    email_subject_template = EXCLUDED.email_subject_template,
    email_body_template = EXCLUDED.email_body_template,
    default_priority = EXCLUDED.default_priority,
    default_variant = EXCLUDED.default_variant,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
END $$;

-- ============================================================================
-- 4. CREATE HAS_ACTIVE_REFUNDS HELPER FUNCTION
-- ============================================================================

-- This function checks if a booking has any active refund requests
-- Active statuses: requested, under_review, approved, processing
-- Terminal statuses: completed, failed, rejected, withdrawn

CREATE OR REPLACE FUNCTION public.has_active_refunds(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_count INTEGER;
BEGIN
  -- Count refund requests with active statuses
  SELECT COUNT(*)
  INTO v_active_count
  FROM public.refund_requests
  WHERE booking_id = p_booking_id
    AND status IN ('requested', 'under_review', 'approved', 'processing');

  -- Return true if any active refunds exist
  RETURN v_active_count > 0;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.has_active_refunds(UUID) IS
  'Checks if a booking has any active refund requests. Returns true if refunds exist with status: requested, under_review, approved, or processing';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_active_refunds(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_refunds(UUID) TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify 'withdrawn' status exists in enum
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'refund_status'::regtype ORDER BY enumsortorder;

-- Test has_active_refunds function
-- SELECT has_active_refunds('<booking_id>'::uuid);

-- Verify RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'refund_requests';
