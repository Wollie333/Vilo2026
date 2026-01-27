-- ============================================================================
-- Migration: Fix Double Booking Prevention
-- Issue: Availability checking function may not exist or have errors
-- Fix: Recreate check_room_availability function with improved logic
-- Date: 2026-01-24
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_room_availability(UUID, DATE, DATE, UUID);

-- Create improved room availability checking function
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
  -- Validate input dates
  IF p_check_in >= p_check_out THEN
    RAISE EXCEPTION 'Check-in date must be before check-out date';
  END IF;

  -- Get room data
  SELECT inventory_mode, total_units
  INTO v_room
  FROM public.rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room with ID % not found', p_room_id;
  END IF;

  -- Log availability check (for debugging)
  RAISE NOTICE 'Checking availability for room % (mode: %, units: %) from % to %',
    p_room_id, v_room.inventory_mode, v_room.total_units, p_check_in, p_check_out;

  -- Check for availability blocks
  SELECT EXISTS(
    SELECT 1 FROM public.room_availability_blocks
    WHERE room_id = p_room_id
      AND start_date < p_check_out
      AND end_date > p_check_in
  ) INTO v_blocked;

  IF v_blocked THEN
    RAISE NOTICE 'Room % is blocked for selected dates', p_room_id;
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

    RAISE NOTICE 'Single unit room: % bookings found', v_booked_units;
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

    RAISE NOTICE 'Multiple unit room: % units booked out of %', v_booked_units, v_room.total_units;
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

  -- Calculate availability
  DECLARE
    v_available_units INTEGER;
    v_is_available BOOLEAN;
  BEGIN
    v_available_units := v_room.total_units - v_booked_units;
    v_is_available := v_available_units > 0;

    RAISE NOTICE 'Availability result: available=%, available_units=% (total=%, booked=%)',
      v_is_available, v_available_units, v_room.total_units, v_booked_units;

    -- Return result
    RETURN QUERY SELECT
      v_is_available,
      v_available_units,
      v_conflicts;
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_room_availability(UUID, DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_room_availability(UUID, DATE, DATE, UUID) TO service_role;

-- ============================================================================
-- Verify function works
-- ============================================================================

COMMENT ON FUNCTION check_room_availability IS 'Checks if a room is available for booking on specified dates. Prevents double bookings by checking existing bookings and availability blocks.';
