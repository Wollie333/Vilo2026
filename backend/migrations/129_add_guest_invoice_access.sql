-- ============================================================================
-- Migration 129: Add Guest Invoice Access RLS Policies
-- Description: Updates Row Level Security policies to allow guests to view
--              booking invoices for their own bookings while maintaining
--              separation between subscription and booking invoice types
-- Date: 2026-01-20
-- Dependencies: Migration 128 (requires invoice_type enum)
-- ============================================================================

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

-- Remove old policies that don't distinguish between invoice types
DROP POLICY IF EXISTS invoices_select_own ON public.invoices;
DROP POLICY IF EXISTS invoices_select_admin ON public.invoices;
DROP POLICY IF EXISTS "Users can view invoices for their bookings" ON public.invoices;

-- ============================================================================
-- CREATE TYPE-SPECIFIC POLICIES
-- ============================================================================

-- Policy 1: Users can view their own subscription invoices
-- Applies to: SaaS-to-User invoices (subscription billing)
-- Access: User who purchased the subscription
CREATE POLICY "Users can view own subscription invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    invoice_type = 'subscription'
    AND user_id = auth.uid()
  );

COMMENT ON POLICY "Users can view own subscription invoices" ON public.invoices IS
  'Allows users to view subscription invoices where they are the payer (SaaS billing)';

-- Policy 2: Property owners can view booking invoices they issued
-- Applies to: User-to-Guest invoices (booking billing)
-- Access: Property owner who issued the invoice
CREATE POLICY "Property owners can view booking invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    invoice_type = 'booking'
    AND user_id = auth.uid()
  );

COMMENT ON POLICY "Property owners can view booking invoices" ON public.invoices IS
  'Allows property owners to view booking invoices they issued to guests';

-- Policy 3: Guests can view booking invoices for their bookings
-- Applies to: User-to-Guest invoices (booking billing)
-- Access: Guest who made the booking
-- NEW: This fixes the issue where guests couldn't see their invoices
CREATE POLICY "Guests can view their booking invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    invoice_type = 'booking'
    AND EXISTS (
      SELECT 1
      FROM public.bookings
      WHERE bookings.id = invoices.booking_id
        AND bookings.guest_id = auth.uid()
    )
  );

COMMENT ON POLICY "Guests can view their booking invoices" ON public.invoices IS
  'Allows authenticated guests to view invoices for bookings they made (uses bookings.guest_id)';

-- Policy 4: Admins can view all invoices
-- Applies to: Both invoice types
-- Access: Super admins and admins
CREATE POLICY "Admins can view all invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_super());

COMMENT ON POLICY "Admins can view all invoices" ON public.invoices IS
  'Allows admins and super admins to view all invoices regardless of type';

-- ============================================================================
-- SERVICE ROLE POLICY (unchanged)
-- ============================================================================

-- Service role can do everything (already exists from migration 026, but recreate if needed)
DROP POLICY IF EXISTS invoices_service_all ON public.invoices;

CREATE POLICY invoices_service_all
  ON public.invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY invoices_service_all ON public.invoices IS
  'Service role has full access to all invoice operations';

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Test 1: Verify policies are created
-- SELECT policyname, roles, qual FROM pg_policies WHERE tablename = 'invoices';

-- Test 2: Simulate guest access (replace <guest_user_id> with actual ID)
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims.sub = '<guest_user_id>';
-- SELECT * FROM public.invoices WHERE invoice_type = 'booking';
-- Should return only invoices for bookings where guest_id = <guest_user_id>

-- Test 3: Simulate property owner access (replace <owner_user_id> with actual ID)
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims.sub = '<owner_user_id>';
-- SELECT * FROM public.invoices WHERE invoice_type = 'booking';
-- Should return only invoices where user_id = <owner_user_id>

-- Test 4: Simulate subscription user access (replace <user_id> with actual ID)
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims.sub = '<user_id>';
-- SELECT * FROM public.invoices WHERE invoice_type = 'subscription';
-- Should return only subscription invoices where user_id = <user_id>

-- ============================================================================
-- NOTES
-- ============================================================================

-- IMPORTANT: This migration depends on:
-- 1. Migration 128 (invoice_type enum must exist)
-- 2. bookings.guest_id column (verified to exist in migration 033)
-- 3. is_admin_or_super() function (exists from earlier migrations)

-- Security considerations:
-- - Guests can only see invoices for bookings they made (via guest_id match)
-- - Property owners can only see invoices they issued (via user_id match)
-- - Users can only see their own subscription invoices
-- - No user can see invoices of other invoice types they don't have access to
-- - Admins have full visibility

-- Performance considerations:
-- - Guest policy uses EXISTS with booking_id join (indexed in migration 128)
-- - invoice_type filters use indexes created in migration 128
-- - Queries should be efficient even with large datasets
