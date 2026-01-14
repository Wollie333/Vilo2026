-- Migration: 033_create_bookings_schema.sql
-- Description: Create bookings and related tables for reservation management
-- Author: Claude
-- Date: 2026-01-05

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Booking status enum
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'checked_in',
    'checked_out',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment status enum
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'partial',
    'paid',
    'refunded',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment method enum
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'paystack',
    'paypal',
    'stripe',
    'eft',
    'cash',
    'card_on_arrival',
    'manual',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Booking source enum
DO $$ BEGIN
  CREATE TYPE booking_source AS ENUM (
    'vilo',
    'website',
    'manual',
    'airbnb',
    'booking_com',
    'lekkerslaap',
    'expedia',
    'tripadvisor',
    'vrbo',
    'other',
    'block'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Refund status enum
DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM (
    'requested',
    'under_review',
    'approved',
    'rejected',
    'processing',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- BOOKINGS TABLE
-- Core booking/reservation records
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Booking Reference (human-readable)
  booking_reference VARCHAR(20) UNIQUE,

  -- Guest Information (can be linked user or guest details)
  guest_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50),

  -- Stay Details
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_nights INTEGER NOT NULL,

  -- Guest Count
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  children_ages JSONB DEFAULT '[]'::jsonb,
  infants INTEGER NOT NULL DEFAULT 0,

  -- Pricing Summary
  room_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  addons_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Coupon/Discount Applied
  coupon_code VARCHAR(50),
  coupon_id UUID REFERENCES public.room_promotions(id) ON DELETE SET NULL,
  coupon_discount_type VARCHAR(20),
  coupon_discount_value DECIMAL(12, 2),

  -- Booking Status
  booking_status booking_status NOT NULL DEFAULT 'pending',
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES public.users(id),

  -- Payment Information
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  payment_reference VARCHAR(255),
  payment_gateway_id VARCHAR(255),
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  payment_received_at TIMESTAMPTZ,

  -- Source/Channel
  source booking_source NOT NULL DEFAULT 'vilo',
  external_id VARCHAR(255),
  external_url TEXT,
  synced_at TIMESTAMPTZ,

  -- Guest Notes & Requests
  special_requests TEXT,
  internal_notes TEXT,

  -- Checkout Recovery Data
  checkout_data JSONB,

  -- Check-in/Check-out Tracking
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES public.users(id),
  checked_out_at TIMESTAMPTZ,
  checked_out_by UUID REFERENCES public.users(id),

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id),
  cancellation_reason TEXT,

  -- Invoice
  invoice_id UUID,
  invoice_generated_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),

  -- Constraints
  CONSTRAINT booking_dates_check CHECK (check_out_date > check_in_date),
  CONSTRAINT booking_nights_check CHECK (total_nights > 0),
  CONSTRAINT booking_adults_check CHECK (adults >= 1)
);

-- Comments
COMMENT ON TABLE public.bookings IS 'Guest booking/reservation records';
COMMENT ON COLUMN public.bookings.booking_reference IS 'Human-readable reference (e.g., VILO-ABC123)';
COMMENT ON COLUMN public.bookings.guest_id IS 'Linked user account (null for guest checkout)';
COMMENT ON COLUMN public.bookings.children_ages IS 'Array of child ages for pricing: [5, 8, 12]';
COMMENT ON COLUMN public.bookings.source IS 'Booking channel/origin';
COMMENT ON COLUMN public.bookings.external_id IS 'ID from external booking platform';
COMMENT ON COLUMN public.bookings.checkout_data IS 'Stored checkout state for recovery';
COMMENT ON COLUMN public.bookings.internal_notes IS 'Staff-only notes (not visible to guest)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_property ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON public.bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON public.bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON public.bookings(source);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_external ON public.bookings(source, external_id);

-- ============================================================================
-- BOOKING ROOMS TABLE
-- Rooms included in each booking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,

  -- Room snapshot at time of booking
  room_name VARCHAR(255) NOT NULL,
  room_code VARCHAR(20),

  -- Guest allocation for this room
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  children_ages JSONB DEFAULT '[]'::jsonb,

  -- Pricing for this room
  pricing_mode pricing_mode NOT NULL,
  nightly_rates JSONB NOT NULL DEFAULT '[]'::jsonb,
  room_subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Unit allocation (for room_type inventory)
  unit_number INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.booking_rooms IS 'Rooms included in a booking';
COMMENT ON COLUMN public.booking_rooms.nightly_rates IS 'Array of rates per night: [{date, rate, rate_name}]';
COMMENT ON COLUMN public.booking_rooms.unit_number IS 'Which unit of room_type (1, 2, 3...) for inventory';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_rooms_booking ON public.booking_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_rooms_room ON public.booking_rooms(room_id);

-- ============================================================================
-- BOOKING ADD-ONS TABLE
-- Extras purchased with booking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE RESTRICT,

  -- Add-on snapshot at time of booking
  addon_name VARCHAR(100) NOT NULL,
  pricing_type addon_pricing_type NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,

  -- Quantity
  quantity INTEGER NOT NULL DEFAULT 1,

  -- Calculated total
  addon_total DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.booking_addons IS 'Add-ons/extras included in a booking';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking ON public.booking_addons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_addon ON public.booking_addons(addon_id);

-- ============================================================================
-- BOOKING GUESTS TABLE
-- Individual guest details for the booking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- Guest details
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Type
  is_primary BOOLEAN DEFAULT false,
  is_adult BOOLEAN DEFAULT true,
  age INTEGER,

  -- Documents (for check-in)
  id_type VARCHAR(50),
  id_number VARCHAR(100),
  nationality VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.booking_guests IS 'Individual guest details for check-in';
COMMENT ON COLUMN public.booking_guests.is_primary IS 'Main guest making the booking';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_guests_booking ON public.booking_guests(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_guests_email ON public.booking_guests(email);

-- ============================================================================
-- BOOKING STATUS HISTORY TABLE
-- Track all status changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- Status change
  old_status booking_status,
  new_status booking_status NOT NULL,

  -- Who made the change
  changed_by UUID REFERENCES public.users(id),
  change_reason TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.booking_status_history IS 'Audit trail of booking status changes';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_status_history_booking ON public.booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON public.booking_status_history(created_at);

-- ============================================================================
-- BOOKING PAYMENTS TABLE
-- Track payment transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- Payment details
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  payment_method payment_method NOT NULL,

  -- Gateway details
  gateway_reference VARCHAR(255),
  gateway_response JSONB,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,

  -- Proof (for EFT/manual)
  proof_url TEXT,
  proof_verified_by UUID REFERENCES public.users(id),
  proof_verified_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Comments
COMMENT ON TABLE public.booking_payments IS 'Payment transactions for bookings';
COMMENT ON COLUMN public.booking_payments.proof_url IS 'Uploaded proof of payment (for EFT)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking ON public.booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_status ON public.booking_payments(status);
CREATE INDEX IF NOT EXISTS idx_booking_payments_gateway ON public.booking_payments(gateway_reference);

-- ============================================================================
-- REFUND REQUESTS TABLE
-- Handle refund requests and processing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- Refund details
  requested_amount DECIMAL(12, 2) NOT NULL,
  approved_amount DECIMAL(12, 2),
  refunded_amount DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Status
  status refund_status NOT NULL DEFAULT 'requested',

  -- Request details
  reason TEXT NOT NULL,
  requested_by UUID REFERENCES public.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),

  -- Review details
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Processing details
  processed_by UUID REFERENCES public.users(id),
  processed_at TIMESTAMPTZ,
  gateway_refund_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.refund_requests IS 'Refund requests and processing';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_booking ON public.refund_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Bookings updated_at trigger
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Booking rooms updated_at trigger
DROP TRIGGER IF EXISTS update_booking_rooms_updated_at ON public.booking_rooms;
CREATE TRIGGER update_booking_rooms_updated_at
  BEFORE UPDATE ON public.booking_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Booking addons updated_at trigger
DROP TRIGGER IF EXISTS update_booking_addons_updated_at ON public.booking_addons;
CREATE TRIGGER update_booking_addons_updated_at
  BEFORE UPDATE ON public.booking_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Booking guests updated_at trigger
DROP TRIGGER IF EXISTS update_booking_guests_updated_at ON public.booking_guests;
CREATE TRIGGER update_booking_guests_updated_at
  BEFORE UPDATE ON public.booking_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Booking payments updated_at trigger
DROP TRIGGER IF EXISTS update_booking_payments_updated_at ON public.booking_payments;
CREATE TRIGGER update_booking_payments_updated_at
  BEFORE UPDATE ON public.booking_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Refund requests updated_at trigger
DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON public.refund_requests;
CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- ============================================================================
-- AUTO-GENERATE BOOKING REFERENCE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_ref VARCHAR(20);
  v_exists BOOLEAN;
BEGIN
  IF NEW.booking_reference IS NULL THEN
    LOOP
      -- Generate reference like VILO-ABC123
      v_ref := 'VILO-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

      -- Check if reference exists
      SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_reference = v_ref) INTO v_exists;

      EXIT WHEN NOT v_exists;
    END LOOP;

    NEW.booking_reference := v_ref;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_booking_reference_trigger ON public.bookings;
CREATE TRIGGER generate_booking_reference_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_reference();

-- ============================================================================
-- STATUS HISTORY TRIGGER
-- Auto-log status changes
-- ============================================================================

CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_booking_status_change_trigger ON public.bookings;
CREATE TRIGGER log_booking_status_change_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change();

-- ============================================================================
-- UPDATE ROOM AVAILABILITY FUNCTION
-- Now properly checks bookings
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

  -- Count booked units from confirmed/checked-in bookings
  SELECT COALESCE(COUNT(DISTINCT br.unit_number), 0)::INTEGER
  INTO v_booked_units
  FROM public.booking_rooms br
  JOIN public.bookings b ON br.booking_id = b.id
  WHERE br.room_id = p_room_id
    AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
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
    'status', b.booking_status
  )), '[]'::JSONB)
  INTO v_conflicts
  FROM public.booking_rooms br
  JOIN public.bookings b ON br.booking_id = b.id
  WHERE br.room_id = p_room_id
    AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
    AND b.check_in_date < p_check_out
    AND b.check_out_date > p_check_in
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);

  RETURN QUERY SELECT
    (v_room.total_units - v_booked_units) > 0,
    v_room.total_units - v_booked_units,
    v_conflicts;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CALCULATE BOOKING TOTALS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_booking_totals(p_booking_id UUID)
RETURNS TABLE (
  room_total DECIMAL(12, 2),
  addons_total DECIMAL(12, 2),
  subtotal DECIMAL(12, 2),
  discount_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2)
) AS $$
DECLARE
  v_room_total DECIMAL(12, 2);
  v_addons_total DECIMAL(12, 2);
  v_subtotal DECIMAL(12, 2);
  v_discount DECIMAL(12, 2);
  v_booking RECORD;
BEGIN
  -- Get booking
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::DECIMAL, 0::DECIMAL, 0::DECIMAL, 0::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;

  -- Sum room totals
  SELECT COALESCE(SUM(room_subtotal), 0) INTO v_room_total
  FROM public.booking_rooms WHERE booking_id = p_booking_id;

  -- Sum addon totals
  SELECT COALESCE(SUM(addon_total), 0) INTO v_addons_total
  FROM public.booking_addons WHERE booking_id = p_booking_id;

  -- Calculate subtotal
  v_subtotal := v_room_total + v_addons_total;

  -- Get discount
  v_discount := COALESCE(v_booking.discount_amount, 0);

  RETURN QUERY SELECT
    v_room_total,
    v_addons_total,
    v_subtotal,
    v_discount,
    GREATEST(0, v_subtotal - v_discount);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Bookings: Property owners/team can manage, guests can view own
DROP POLICY IF EXISTS bookings_select_policy ON public.bookings;
CREATE POLICY bookings_select_policy ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR has_permission('bookings', 'read')
    OR guest_id = auth.uid()
    OR property_id IN (
      SELECT property_id FROM public.user_properties WHERE user_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS bookings_insert_policy ON public.bookings;
CREATE POLICY bookings_insert_policy ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_super_admin()
    OR has_permission('bookings', 'create')
    OR property_id IN (
      SELECT property_id FROM public.user_properties WHERE user_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    -- Allow guests to create their own bookings
    OR guest_id = auth.uid()
  );

DROP POLICY IF EXISTS bookings_update_policy ON public.bookings;
CREATE POLICY bookings_update_policy ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    is_super_admin()
    OR has_permission('bookings', 'update')
    OR property_id IN (
      SELECT property_id FROM public.user_properties WHERE user_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS bookings_delete_policy ON public.bookings;
CREATE POLICY bookings_delete_policy ON public.bookings
  FOR DELETE
  TO authenticated
  USING (
    is_super_admin()
    OR has_permission('bookings', 'delete')
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- Booking Rooms: Follow booking access
DROP POLICY IF EXISTS booking_rooms_select_policy ON public.booking_rooms;
CREATE POLICY booking_rooms_select_policy ON public.booking_rooms
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

DROP POLICY IF EXISTS booking_rooms_modify_policy ON public.booking_rooms;
CREATE POLICY booking_rooms_modify_policy ON public.booking_rooms
  FOR ALL
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

-- Booking Addons: Follow booking access
DROP POLICY IF EXISTS booking_addons_select_policy ON public.booking_addons;
CREATE POLICY booking_addons_select_policy ON public.booking_addons
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

DROP POLICY IF EXISTS booking_addons_modify_policy ON public.booking_addons;
CREATE POLICY booking_addons_modify_policy ON public.booking_addons
  FOR ALL
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

-- Booking Guests: Follow booking access
DROP POLICY IF EXISTS booking_guests_select_policy ON public.booking_guests;
CREATE POLICY booking_guests_select_policy ON public.booking_guests
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

DROP POLICY IF EXISTS booking_guests_modify_policy ON public.booking_guests;
CREATE POLICY booking_guests_modify_policy ON public.booking_guests
  FOR ALL
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

-- Status History: Follow booking access (read-only for most)
DROP POLICY IF EXISTS status_history_select_policy ON public.booking_status_history;
CREATE POLICY status_history_select_policy ON public.booking_status_history
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

DROP POLICY IF EXISTS status_history_insert_policy ON public.booking_status_history;
CREATE POLICY status_history_insert_policy ON public.booking_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    booking_id IN (SELECT id FROM public.bookings)
  );

-- Booking Payments: Follow booking access
DROP POLICY IF EXISTS booking_payments_select_policy ON public.booking_payments;
CREATE POLICY booking_payments_select_policy ON public.booking_payments
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

DROP POLICY IF EXISTS booking_payments_modify_policy ON public.booking_payments;
CREATE POLICY booking_payments_modify_policy ON public.booking_payments
  FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR booking_id IN (
      SELECT b.id FROM public.bookings b
      WHERE b.property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
      )
    )
  );

-- Refund Requests: Follow booking access
DROP POLICY IF EXISTS refund_requests_select_policy ON public.refund_requests;
CREATE POLICY refund_requests_select_policy ON public.refund_requests
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (SELECT id FROM public.bookings)
  );

DROP POLICY IF EXISTS refund_requests_insert_policy ON public.refund_requests;
CREATE POLICY refund_requests_insert_policy ON public.refund_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    booking_id IN (SELECT id FROM public.bookings)
  );

DROP POLICY IF EXISTS refund_requests_update_policy ON public.refund_requests;
CREATE POLICY refund_requests_update_policy ON public.refund_requests
  FOR UPDATE
  TO authenticated
  USING (
    is_super_admin()
    OR has_permission('refunds', 'manage')
    OR booking_id IN (
      SELECT b.id FROM public.bookings b
      WHERE b.property_id IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.bookings TO service_role;
GRANT ALL ON public.booking_rooms TO service_role;
GRANT ALL ON public.booking_addons TO service_role;
GRANT ALL ON public.booking_guests TO service_role;
GRANT ALL ON public.booking_status_history TO service_role;
GRANT ALL ON public.booking_payments TO service_role;
GRANT ALL ON public.refund_requests TO service_role;

GRANT SELECT ON public.bookings TO authenticated;
GRANT SELECT ON public.booking_rooms TO authenticated;
GRANT SELECT ON public.booking_addons TO authenticated;
GRANT SELECT ON public.booking_guests TO authenticated;
GRANT SELECT ON public.booking_status_history TO authenticated;
GRANT SELECT ON public.booking_payments TO authenticated;
GRANT SELECT ON public.refund_requests TO authenticated;

-- Grant DML for authenticated (RLS will control access)
GRANT INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.booking_rooms TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.booking_addons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.booking_guests TO authenticated;
GRANT INSERT ON public.booking_status_history TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.booking_payments TO authenticated;
GRANT INSERT, UPDATE ON public.refund_requests TO authenticated;

-- ============================================================================
-- ADD BOOKINGS PERMISSION
-- ============================================================================

INSERT INTO public.permissions (resource, action, description)
VALUES
  ('bookings', 'manage', 'Manage bookings and reservations'),
  ('refunds', 'manage', 'Process refund requests')
ON CONFLICT (resource, action) DO NOTHING;
