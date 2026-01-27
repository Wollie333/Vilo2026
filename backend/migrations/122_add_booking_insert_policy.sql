-- Migration: 122_add_booking_insert_policy.sql
-- Description: Add INSERT policy for bookings to allow admin/service role to create bookings
-- Date: 2026-01-18

-- ============================================================================
-- BOOKING INSERT POLICY (for admin/service role)
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can insert bookings" ON public.bookings;

-- Allow service role (backend) to insert bookings
CREATE POLICY "Service role can insert bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (true);

COMMENT ON POLICY "Service role can insert bookings" ON public.bookings IS 'Allows backend service to create bookings on behalf of guests';
