-- Fix RLS Policy for Refund Requests
-- Simplified version that doesn't depend on has_permission() or is_super_admin()

-- Drop the existing policy
DROP POLICY IF EXISTS refund_requests_select_policy ON public.refund_requests;

-- Create simplified SELECT policy
-- Users can see refunds that they:
-- 1. Created themselves (requested_by = their user ID)
-- 2. Own through property ownership (booking's property owner)
CREATE POLICY refund_requests_select_policy ON public.refund_requests
  FOR SELECT
  TO authenticated
  USING (
    -- User created the refund request
    requested_by = auth.uid()
    OR
    -- User owns the property for this booking
    booking_id IN (
      SELECT b.id
      FROM public.bookings b
      INNER JOIN public.properties p ON b.property_id = p.id
      WHERE p.owner_id = auth.uid()
    )
    OR
    -- User has admin role (check user_roles table)
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      INNER JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'property_admin')
    )
  );

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'refund_requests'
  AND policyname = 'refund_requests_select_policy';
