-- Migration: 117_add_guest_booking_policies.sql
-- Description: Add Row Level Security policies for guest booking access
-- Date: 2026-01-18

-- ============================================================================
-- GUEST BOOKING RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can modify own upcoming bookings" ON public.bookings;

-- Guests can view their own bookings
CREATE POLICY "Guests can view own bookings"
  ON public.bookings
  FOR SELECT
  USING (guest_id = auth.uid());

-- Guests can update their own upcoming bookings (not cancelled or completed)
CREATE POLICY "Guests can modify own upcoming bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    guest_id = auth.uid()
    AND check_in_date > NOW()
    AND booking_status NOT IN ('cancelled', 'completed')
  );

-- ============================================================================
-- GUEST CUSTOMER RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Guests can view own customer record" ON public.customers;
DROP POLICY IF EXISTS "Guests can update own customer record" ON public.customers;

-- Guests can view their own customer record
CREATE POLICY "Guests can view own customer record"
  ON public.customers
  FOR SELECT
  USING (user_id = auth.uid());

-- Guests can update their own customer record
CREATE POLICY "Guests can update own customer record"
  ON public.customers
  FOR UPDATE
  USING (user_id = auth.uid());

COMMENT ON POLICY "Guests can view own bookings" ON public.bookings IS 'Allows guests to view their own bookings';
COMMENT ON POLICY "Guests can modify own upcoming bookings" ON public.bookings IS 'Allows guests to modify their own upcoming bookings before check-in';
COMMENT ON POLICY "Guests can view own customer record" ON public.customers IS 'Allows guests to view their own customer profile';
COMMENT ON POLICY "Guests can update own customer record" ON public.customers IS 'Allows guests to update their own customer profile';
