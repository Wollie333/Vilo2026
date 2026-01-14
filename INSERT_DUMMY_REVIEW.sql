-- Insert Dummy Review Data
-- This SQL creates a sample review as if the logged-in user submitted it for their completed booking

-- INSTRUCTIONS:
-- 1. Run this SQL via Supabase SQL Editor
-- 2. It will automatically use your most recent completed booking
-- 3. If you don't have any completed bookings, it will create a test booking first

-- Step 1: Find or create a completed booking for the current user
DO $$
DECLARE
  v_user_id UUID;
  v_booking_id UUID;
  v_property_id UUID;
  v_guest_name TEXT;
  v_guest_email TEXT;
  v_check_in_date DATE;
  v_check_out_date DATE;
  v_review_id UUID;
BEGIN
  -- Get current user ID (authenticated user)
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to run this script';
  END IF;

  -- Get user details
  SELECT full_name, email INTO v_guest_name, v_guest_email
  FROM users
  WHERE id = v_user_id;

  -- Try to find an existing completed booking for this user
  SELECT id, property_id, check_in_date, check_out_date
  INTO v_booking_id, v_property_id, v_check_in_date, v_check_out_date
  FROM bookings
  WHERE guest_id = v_user_id
    AND booking_status IN ('completed', 'checked_out')
    AND checked_out_at IS NOT NULL
    AND checked_out_at >= NOW() - INTERVAL '90 days' -- Within review eligibility window
    AND NOT EXISTS (
      SELECT 1 FROM property_reviews WHERE booking_id = bookings.id
    )
  ORDER BY checked_out_at DESC
  LIMIT 1;

  -- If no completed booking exists, create a dummy one
  IF v_booking_id IS NULL THEN
    RAISE NOTICE 'No eligible completed booking found. Creating a test booking...';

    -- Find any property (preferably one the user doesn't own)
    SELECT id INTO v_property_id
    FROM properties
    WHERE owner_id != v_user_id
    LIMIT 1;

    IF v_property_id IS NULL THEN
      -- If no other properties exist, just use any property
      SELECT id INTO v_property_id FROM properties LIMIT 1;
    END IF;

    IF v_property_id IS NULL THEN
      RAISE EXCEPTION 'No properties exist in the database. Please create a property first.';
    END IF;

    -- Create test booking
    v_check_in_date := CURRENT_DATE - INTERVAL '14 days';
    v_check_out_date := CURRENT_DATE - INTERVAL '7 days';

    INSERT INTO bookings (
      booking_reference,
      property_id,
      guest_id,
      check_in_date,
      check_out_date,
      booking_status,
      checked_out_at,
      num_guests,
      total_amount,
      currency
    ) VALUES (
      'TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
      v_property_id,
      v_user_id,
      v_check_in_date,
      v_check_out_date,
      'completed',
      v_check_out_date + INTERVAL '1 day',
      2,
      1500.00,
      'ZAR'
    )
    RETURNING id INTO v_booking_id;

    RAISE NOTICE 'Created test booking: %', v_booking_id;
  ELSE
    RAISE NOTICE 'Using existing booking: %', v_booking_id;
  END IF;

  -- Insert the dummy review
  INSERT INTO property_reviews (
    booking_id,
    property_id,
    guest_id,
    guest_name,
    guest_email,
    check_in_date,
    check_out_date,
    rating_safety,
    rating_cleanliness,
    rating_location,
    rating_comfort,
    rating_scenery,
    review_title,
    review_text,
    photos,
    status,
    helpful_count
  ) VALUES (
    v_booking_id,
    v_property_id,
    v_user_id,
    v_guest_name,
    v_guest_email,
    v_check_in_date,
    v_check_out_date,
    5.0,  -- Safety
    4.5,  -- Cleanliness
    4.0,  -- Location (formerly friendliness)
    5.0,  -- Comfort
    4.5,  -- Scenery
    'Amazing Stay - Highly Recommend!',
    'We had an absolutely wonderful time at this property! The location was perfect - close to all the attractions but still peaceful and quiet. The accommodation was spotless and very comfortable. We especially loved the views from the balcony. The host was very responsive and helpful with all our questions. Would definitely stay here again!',
    '[]'::jsonb,
    'published',
    0
  )
  RETURNING id INTO v_review_id;

  RAISE NOTICE '✅ Successfully created dummy review: %', v_review_id;
  RAISE NOTICE 'Review details:';
  RAISE NOTICE '  - Booking ID: %', v_booking_id;
  RAISE NOTICE '  - Property ID: %', v_property_id;
  RAISE NOTICE '  - Guest: % (%)', v_guest_name, v_guest_email;
  RAISE NOTICE '  - Overall Rating: 4.6/5.0';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now view this review in the Review Manager page!';
END $$;
