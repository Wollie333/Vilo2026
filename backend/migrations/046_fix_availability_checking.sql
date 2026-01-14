-- ============================================================================
-- Migration: Fix Room Availability Checking
-- Issue: check_room_availability was counting DISTINCT unit_numbers incorrectly
-- Fix: Count actual bookings for single_unit rooms, distinct units for multiple_units
-- ============================================================================

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

  -- Count booked units based on inventory mode
  IF v_room.inventory_mode = 'single_unit' THEN
    -- For single unit rooms, count if ANY booking exists
    SELECT COUNT(*)::INTEGER
    INTO v_booked_units
    FROM public.booking_rooms br
    JOIN public.bookings b ON br.booking_id = b.id
    WHERE br.room_id = p_room_id
      AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
      AND b.check_in_date < p_check_out
      AND b.check_out_date > p_check_in
      AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);
  ELSE
    -- For multiple unit rooms, count distinct unit numbers
    SELECT COALESCE(COUNT(DISTINCT br.unit_number), 0)::INTEGER
    INTO v_booked_units
    FROM public.booking_rooms br
    JOIN public.bookings b ON br.booking_id = b.id
    WHERE br.room_id = p_room_id
      AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
      AND b.check_in_date < p_check_out
      AND b.check_out_date > p_check_in
      AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);
  END IF;

  -- Get conflicting booking details
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'booking_id', b.id,
    'booking_reference', b.booking_reference,
    'guest_name', b.guest_name,
    'check_in', b.check_in_date,
    'check_out', b.check_out_date,
    'status', b.booking_status,
    'unit_number', br.unit_number
  )), '[]'::JSONB)
  INTO v_conflicts
  FROM public.booking_rooms br
  JOIN public.bookings b ON br.booking_id = b.id
  WHERE br.room_id = p_room_id
    AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
    AND b.check_in_date < p_check_out
    AND b.check_out_date > p_check_in
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);

  -- Check if available
  RETURN QUERY SELECT
    (v_room.total_units - v_booked_units) > 0,
    v_room.total_units - v_booked_units,
    v_conflicts;
END;
$$ LANGUAGE plpgsql;
