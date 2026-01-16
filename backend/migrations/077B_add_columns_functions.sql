-- =====================================================
-- MIGRATION: 077_B_add_columns_functions.sql
-- Description: Part 2 - Add columns, functions, and triggers
-- Author: Claude
-- Date: 2026-01-14
--
-- IMPORTANT: Only run this AFTER 077_A has been committed
-- =====================================================

-- ============================================================================
-- STEP 1: ADD NEW COLUMNS TO BOOKINGS TABLE
-- ============================================================================

-- Add balance tracking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS balance_due DECIMAL(12, 2) DEFAULT 0.00;

-- Track failed checkout for abandoned cart recovery
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS failed_checkout_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS abandoned_cart_reminder_sent BOOLEAN DEFAULT false;

-- Track modification status
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS has_pending_modification BOOLEAN DEFAULT false;

-- Add total_refunded tracking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_refunded DECIMAL(12, 2) DEFAULT 0.00;

-- Comments
COMMENT ON COLUMN public.bookings.balance_due IS 'Outstanding balance to be paid';
COMMENT ON COLUMN public.bookings.failed_checkout_at IS 'When checkout was abandoned/failed';
COMMENT ON COLUMN public.bookings.abandoned_cart_reminder_sent IS 'Whether reminder email was sent for abandoned cart';
COMMENT ON COLUMN public.bookings.has_pending_modification IS 'Whether booking has pending modification awaiting guest approval';
COMMENT ON COLUMN public.bookings.total_refunded IS 'Total amount refunded for this booking';

-- ============================================================================
-- STEP 2: ADD INDEX FOR FAILED CHECKOUTS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_failed_checkout
ON public.bookings(payment_status, failed_checkout_at)
WHERE payment_status = 'failed_checkout';

COMMENT ON INDEX idx_bookings_failed_checkout IS 'Index for abandoned cart recovery queries';

-- ============================================================================
-- STEP 3: UPDATE ROOM AVAILABILITY FUNCTION (CRITICAL FIX)
-- ============================================================================

-- This function now correctly implements Option A: Room unavailable when booking_status = 'confirmed'
-- Room is blocked when status is: confirmed, pending_modification, checked_in, or checked_out
-- Room is AVAILABLE when status is: pending, cancelled, no_show, or completed

CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  available_units INTEGER,
  conflicting_bookings JSONB
) AS $$
DECLARE
  v_room RECORD;
  v_booked_units INTEGER;
  v_blocked BOOLEAN;
  v_conflicts JSONB;
BEGIN
  -- Get room data
  SELECT inventory_mode, total_units
  INTO v_room
  FROM public.rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, '[]'::JSONB;
    RETURN;
  END IF;

  -- Check for availability blocks
  SELECT EXISTS(
    SELECT 1 FROM public.room_availability_blocks
    WHERE room_id = p_room_id
      AND start_date < p_check_out
      AND end_date > p_check_in
  ) INTO v_blocked;

  IF v_blocked THEN
    RETURN QUERY SELECT false, 0, '["Room is blocked for selected dates"]'::JSONB;
    RETURN;
  END IF;

  -- CRITICAL CHANGE: Count booked units based on booking_status (not payment_status)
  -- Room is UNAVAILABLE when booking_status IN ('confirmed', 'pending_modification', 'checked_in', 'checked_out')
  SELECT COALESCE(COUNT(DISTINCT br.unit_number), 0)::INTEGER
  INTO v_booked_units
  FROM public.booking_rooms br
  JOIN public.bookings b ON br.booking_id = b.id
  WHERE br.room_id = p_room_id
    AND b.booking_status IN ('confirmed', 'pending_modification', 'checked_in', 'checked_out')
    AND b.check_in_date < p_check_out
    AND b.check_out_date > p_check_in
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);

  -- Get conflicting booking details
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'booking_id', b.id,
    'booking_reference', b.booking_reference,
    'guest_name', b.guest_name,
    'check_in', b.check_in_date,
    'check_out', b.check_out_date,
    'booking_status', b.booking_status,
    'payment_status', b.payment_status
  )), '[]'::JSONB)
  INTO v_conflicts
  FROM public.booking_rooms br
  JOIN public.bookings b ON br.booking_id = b.id
  WHERE br.room_id = p_room_id
    AND b.booking_status IN ('confirmed', 'pending_modification', 'checked_in', 'checked_out')
    AND b.check_in_date < p_check_out
    AND b.check_out_date > p_check_in
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);

  RETURN QUERY SELECT
    (v_room.total_units - v_booked_units) > 0,
    v_room.total_units - v_booked_units,
    v_conflicts;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_room_availability IS 'Check room availability - room blocked when booking_status is confirmed/pending_modification/checked_in/checked_out';

-- ============================================================================
-- STEP 4: CREATE STATUS TRANSITION VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_booking_status_transition(
  p_old_status booking_status,
  p_new_status booking_status
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow same status (no change)
  IF p_old_status = p_new_status THEN
    RETURN TRUE;
  END IF;

  -- Define valid transitions based on the plan
  CASE p_old_status
    WHEN 'pending' THEN
      -- pending can go to: confirmed, cancelled
      RETURN p_new_status IN ('confirmed', 'cancelled');

    WHEN 'confirmed' THEN
      -- confirmed can go to: pending_modification, checked_in, cancelled, no_show
      RETURN p_new_status IN ('pending_modification', 'checked_in', 'cancelled', 'no_show');

    WHEN 'pending_modification' THEN
      -- pending_modification can go to: confirmed, cancelled
      RETURN p_new_status IN ('confirmed', 'cancelled');

    WHEN 'checked_in' THEN
      -- checked_in can go to: checked_out, completed
      RETURN p_new_status IN ('checked_out', 'completed');

    WHEN 'checked_out' THEN
      -- checked_out can go to: completed
      RETURN p_new_status = 'completed';

    WHEN 'completed' THEN
      -- completed is terminal (no transitions allowed)
      RETURN FALSE;

    WHEN 'cancelled' THEN
      -- cancelled is terminal (no transitions allowed)
      RETURN FALSE;

    WHEN 'no_show' THEN
      -- no_show is terminal (no transitions allowed)
      RETURN FALSE;

    ELSE
      -- Unknown status
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_booking_status_transition IS 'Validates booking status transitions according to business rules';

-- ============================================================================
-- STEP 5: CREATE PAYMENT STATUS TRANSITION VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_payment_status_transition(
  p_old_status payment_status,
  p_new_status payment_status
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow same status (no change)
  IF p_old_status = p_new_status THEN
    RETURN TRUE;
  END IF;

  -- Define valid transitions
  CASE p_old_status
    WHEN 'pending' THEN
      -- pending can go to: verification_pending, partial, paid, failed_checkout, failed
      RETURN p_new_status IN ('verification_pending', 'partial', 'paid', 'failed_checkout', 'failed');

    WHEN 'verification_pending' THEN
      -- verification_pending can go to: paid, failed_checkout
      RETURN p_new_status IN ('paid', 'failed_checkout');

    WHEN 'partial' THEN
      -- partial can go to: paid, refunded, partially_refunded
      RETURN p_new_status IN ('paid', 'refunded', 'partially_refunded');

    WHEN 'paid' THEN
      -- paid can go to: refunded, partially_refunded
      RETURN p_new_status IN ('refunded', 'partially_refunded');

    WHEN 'refunded' THEN
      -- refunded is terminal
      RETURN FALSE;

    WHEN 'partially_refunded' THEN
      -- partially_refunded can go to: refunded (if more refunds issued)
      RETURN p_new_status = 'refunded';

    WHEN 'failed_checkout' THEN
      -- failed_checkout can recover to: pending, verification_pending, partial, paid
      RETURN p_new_status IN ('pending', 'verification_pending', 'partial', 'paid');

    WHEN 'failed' THEN
      -- failed can retry to: pending, verification_pending
      RETURN p_new_status IN ('pending', 'verification_pending');

    ELSE
      -- Unknown status
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_payment_status_transition IS 'Validates payment status transitions according to business rules';

-- ============================================================================
-- STEP 6: UPDATE STATUS CHANGE TRIGGER TO VALIDATE TRANSITIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate booking status transition
  IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
    -- Check if transition is valid
    IF NOT validate_booking_status_transition(OLD.booking_status, NEW.booking_status) THEN
      RAISE EXCEPTION 'Invalid booking status transition from % to %', OLD.booking_status, NEW.booking_status;
    END IF;

    -- Log the status change
    INSERT INTO public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.booking_status,
      NEW.booking_status,
      NEW.status_changed_by
    );

    NEW.status_changed_at := NOW();
  END IF;

  -- Validate payment status transition
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    IF NOT validate_payment_status_transition(OLD.payment_status, NEW.payment_status) THEN
      RAISE EXCEPTION 'Invalid payment status transition from % to %', OLD.payment_status, NEW.payment_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger (already exists, but ensure it uses updated function)
DROP TRIGGER IF EXISTS log_booking_status_change_trigger ON public.bookings;
CREATE TRIGGER log_booking_status_change_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change();

-- ============================================================================
-- STEP 7: CREATE HELPER FUNCTION TO CHECK IF ROOM IS AVAILABLE
-- ============================================================================

CREATE OR REPLACE FUNCTION is_room_available_for_booking(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM check_room_availability(p_room_id, p_check_in, p_check_out);
  RETURN v_result.is_available;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_room_available_for_booking IS 'Simple boolean check if room is available for given dates';

-- ============================================================================
-- STEP 8: CREATE FUNCTION TO AUTO-CALCULATE BALANCE DUE
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_balance_due(p_booking_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_total DECIMAL(12, 2);
  v_paid DECIMAL(12, 2);
  v_refunded DECIMAL(12, 2);
BEGIN
  -- Get total amount
  SELECT total_amount INTO v_total
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Get amount paid
  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM public.booking_payments
  WHERE booking_id = p_booking_id
    AND status = 'paid';

  -- Get refunded amount
  SELECT COALESCE(total_refunded, 0) INTO v_refunded
  FROM public.bookings
  WHERE id = p_booking_id;

  -- Balance = Total - Paid + Refunded
  RETURN GREATEST(0, v_total - v_paid + v_refunded);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_balance_due IS 'Calculate outstanding balance for a booking';

-- ============================================================================
-- STEP 9: CREATE TRIGGER TO AUTO-UPDATE BALANCE DUE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_booking_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Get booking_id from either NEW or OLD
  v_booking_id := COALESCE(NEW.booking_id, OLD.booking_id);

  -- Update balance_due on the booking
  UPDATE public.bookings
  SET balance_due = calculate_balance_due(v_booking_id)
  WHERE id = v_booking_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking_payments changes
DROP TRIGGER IF EXISTS update_balance_on_payment ON public.booking_payments;
CREATE TRIGGER update_balance_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.booking_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_balance();

-- Trigger for booking total_amount changes
DROP TRIGGER IF EXISTS update_balance_on_booking_change ON public.bookings;
CREATE TRIGGER update_balance_on_booking_change
  AFTER UPDATE OF total_amount, total_refunded ON public.bookings
  FOR EACH ROW
  WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount
        OR OLD.total_refunded IS DISTINCT FROM NEW.total_refunded)
  EXECUTE FUNCTION update_booking_balance();

-- ============================================================================
-- STEP 10: MIGRATION VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration 077_B completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '- New columns: balance_due, failed_checkout_at, abandoned_cart_reminder_sent, has_pending_modification, total_refunded';
  RAISE NOTICE '- Room availability now checks booking_status';
  RAISE NOTICE '- Status transition validation enabled';
  RAISE NOTICE '- Auto-calculate balance_due triggers added';
  RAISE NOTICE '';
  RAISE NOTICE 'Core status flow logic is now in place!';
  RAISE NOTICE '===========================================';
END $$;
