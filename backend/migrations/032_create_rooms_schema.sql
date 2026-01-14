-- Migration: 032_create_rooms_schema.sql
-- Description: Create rooms and related tables for accommodation management
-- Author: Claude
-- Date: 2026-01-05

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Pricing mode enum
DO $$ BEGIN
  CREATE TYPE pricing_mode AS ENUM ('per_unit', 'per_person', 'per_person_sharing');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Inventory mode enum
DO $$ BEGIN
  CREATE TYPE inventory_mode AS ENUM ('single_unit', 'room_type');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Bed type enum
DO $$ BEGIN
  CREATE TYPE bed_type AS ENUM (
    'king', 'queen', 'double', 'twin', 'single',
    'bunk', 'sofa_bed', 'futon', 'crib', 'floor_mattress'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add-on pricing type enum
DO $$ BEGIN
  CREATE TYPE addon_pricing_type AS ENUM (
    'per_booking', 'per_night', 'per_guest', 'per_guest_per_night'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ROOMS TABLE
-- Core room/accommodation unit linked to properties
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  room_code VARCHAR(20) UNIQUE,
  room_size_sqm DECIMAL(8, 2),

  -- Pricing Configuration
  pricing_mode pricing_mode NOT NULL DEFAULT 'per_unit',
  base_price_per_night DECIMAL(12, 2) NOT NULL DEFAULT 0,
  additional_person_rate DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Children Pricing
  child_price_per_night DECIMAL(12, 2),
  child_free_until_age INTEGER DEFAULT 2,
  child_age_limit INTEGER DEFAULT 12,

  -- Guest Capacity
  max_guests INTEGER NOT NULL DEFAULT 2,
  max_adults INTEGER,
  max_children INTEGER,

  -- Stay Duration Rules
  min_nights INTEGER NOT NULL DEFAULT 1,
  max_nights INTEGER,

  -- Inventory Configuration
  inventory_mode inventory_mode NOT NULL DEFAULT 'single_unit',
  total_units INTEGER NOT NULL DEFAULT 1,

  -- Features (JSONB arrays)
  amenities JSONB DEFAULT '[]'::jsonb,
  extra_options JSONB DEFAULT '[]'::jsonb,

  -- Media
  featured_image TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  paused_reason TEXT,
  paused_at TIMESTAMPTZ,

  -- Completeness tracking
  completeness_score INTEGER DEFAULT 0,

  -- Sort order within property
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Comments
COMMENT ON TABLE public.rooms IS 'Accommodation units/rooms within properties';
COMMENT ON COLUMN public.rooms.pricing_mode IS 'per_unit: flat rate, per_person: price × guests, per_person_sharing: base + additional';
COMMENT ON COLUMN public.rooms.additional_person_rate IS 'For per_person_sharing mode: extra charge per additional guest';
COMMENT ON COLUMN public.rooms.child_price_per_night IS 'Custom rate for children (null = same as adult rate)';
COMMENT ON COLUMN public.rooms.child_free_until_age IS 'Children under this age stay free (e.g., 2 = ages 0-1 free)';
COMMENT ON COLUMN public.rooms.child_age_limit IS 'Maximum age considered a child (default 12)';
COMMENT ON COLUMN public.rooms.inventory_mode IS 'single_unit: unique room, room_type: multiple identical rooms';
COMMENT ON COLUMN public.rooms.total_units IS 'Number of identical rooms available (for room_type mode)';
COMMENT ON COLUMN public.rooms.completeness_score IS 'Calculated 0-100 score based on filled fields';
COMMENT ON COLUMN public.rooms.amenities IS 'Array of room amenities: ["WiFi", "Air Conditioning", "TV"]';
COMMENT ON COLUMN public.rooms.extra_options IS 'Array of extra features: ["Kitchenette", "Private Pool"]';
COMMENT ON COLUMN public.rooms.gallery_images IS 'Array of images: [{url, caption, order}]';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rooms_property ON public.rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON public.rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_paused ON public.rooms(is_paused);
CREATE INDEX IF NOT EXISTS idx_rooms_sort ON public.rooms(property_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_pricing_mode ON public.rooms(pricing_mode);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON public.rooms(created_at);

-- ============================================================================
-- ROOM BEDS TABLE
-- Bed configurations for each room
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,

  bed_type bed_type NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  sleeps INTEGER NOT NULL DEFAULT 2,

  -- Sort order
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.room_beds IS 'Bed configurations within rooms';
COMMENT ON COLUMN public.room_beds.sleeps IS 'Number of people this bed type sleeps';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_room_beds_room ON public.room_beds(room_id);
CREATE INDEX IF NOT EXISTS idx_room_beds_type ON public.room_beds(bed_type);

-- ============================================================================
-- ROOM SEASONAL RATES TABLE
-- Date-based pricing overrides
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_seasonal_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Pricing override
  price_per_night DECIMAL(12, 2) NOT NULL,
  additional_person_rate DECIMAL(12, 2),

  -- Optional pricing mode override
  pricing_mode_override pricing_mode,

  -- Priority (higher = takes precedence when overlapping)
  priority INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: end_date must be after start_date
  CONSTRAINT seasonal_rate_dates_check CHECK (end_date >= start_date)
);

-- Comments
COMMENT ON TABLE public.room_seasonal_rates IS 'Seasonal/date-based pricing overrides';
COMMENT ON COLUMN public.room_seasonal_rates.priority IS 'When rates overlap, highest priority wins';
COMMENT ON COLUMN public.room_seasonal_rates.pricing_mode_override IS 'Optional: change pricing mode for this season';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seasonal_rates_room ON public.room_seasonal_rates(room_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_rates_dates ON public.room_seasonal_rates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_seasonal_rates_active ON public.room_seasonal_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_seasonal_rates_priority ON public.room_seasonal_rates(room_id, priority DESC);

-- ============================================================================
-- ROOM PROMOTIONS TABLE
-- Discount codes and promotional offers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Promotion Details
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Discount Configuration
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(12, 2) NOT NULL,

  -- Validity Period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Usage Limits
  max_uses INTEGER,
  max_uses_per_customer INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,

  -- Requirements
  min_booking_amount DECIMAL(12, 2),
  min_nights INTEGER,

  -- Claimable (can guests request this via contact form)
  is_claimable BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- At least one of room_id or property_id must be set
  CONSTRAINT promotion_scope_check CHECK (room_id IS NOT NULL OR property_id IS NOT NULL)
);

-- Comments
COMMENT ON TABLE public.room_promotions IS 'Promotional discount codes';
COMMENT ON COLUMN public.room_promotions.discount_type IS 'percentage, fixed_amount, or free_nights';
COMMENT ON COLUMN public.room_promotions.discount_value IS 'Discount amount (percentage or fixed)';
COMMENT ON COLUMN public.room_promotions.is_claimable IS 'If true, guests can request this code via contact form';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotions_room ON public.room_promotions(room_id);
CREATE INDEX IF NOT EXISTS idx_promotions_property ON public.room_promotions(property_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.room_promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.room_promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_validity ON public.room_promotions(valid_from, valid_until);

-- Unique code per property scope
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_unique_code
  ON public.room_promotions(code, COALESCE(property_id, '00000000-0000-0000-0000-000000000000'));

-- ============================================================================
-- ADD-ONS TABLE
-- Purchasable extras (breakfast, parking, transfers, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Details
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  price DECIMAL(12, 2) NOT NULL,
  pricing_type addon_pricing_type NOT NULL DEFAULT 'per_booking',
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Availability
  is_active BOOLEAN DEFAULT true,

  -- Room-specific (null = available for all rooms)
  room_ids JSONB DEFAULT NULL,

  -- Media
  image_url TEXT,

  -- Sort order
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.add_ons IS 'Purchasable extras for bookings';
COMMENT ON COLUMN public.add_ons.pricing_type IS 'per_booking, per_night, per_guest, per_guest_per_night';
COMMENT ON COLUMN public.add_ons.room_ids IS 'If set, only available for these room IDs (null = all rooms)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_addons_property ON public.add_ons(property_id);
CREATE INDEX IF NOT EXISTS idx_addons_active ON public.add_ons(is_active);
CREATE INDEX IF NOT EXISTS idx_addons_sort ON public.add_ons(property_id, sort_order);

-- ============================================================================
-- ROOM AVAILABILITY BLOCKS TABLE
-- Manual blocks for maintenance, personal use, etc.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.room_availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,

  -- Block details
  block_type VARCHAR(50) NOT NULL DEFAULT 'maintenance',
  reason TEXT,

  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),

  -- Constraint
  CONSTRAINT availability_block_dates_check CHECK (end_date >= start_date)
);

-- Comments
COMMENT ON TABLE public.room_availability_blocks IS 'Manual availability blocks for rooms';
COMMENT ON COLUMN public.room_availability_blocks.block_type IS 'maintenance, personal_use, renovation, other';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_blocks_room ON public.room_availability_blocks(room_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_dates ON public.room_availability_blocks(start_date, end_date);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Rooms updated_at trigger
DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Room beds updated_at trigger
DROP TRIGGER IF EXISTS update_room_beds_updated_at ON public.room_beds;
CREATE TRIGGER update_room_beds_updated_at
  BEFORE UPDATE ON public.room_beds
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Seasonal rates updated_at trigger
DROP TRIGGER IF EXISTS update_seasonal_rates_updated_at ON public.room_seasonal_rates;
CREATE TRIGGER update_seasonal_rates_updated_at
  BEFORE UPDATE ON public.room_seasonal_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Promotions updated_at trigger
DROP TRIGGER IF EXISTS update_room_promotions_updated_at ON public.room_promotions;
CREATE TRIGGER update_room_promotions_updated_at
  BEFORE UPDATE ON public.room_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Add-ons updated_at trigger
DROP TRIGGER IF EXISTS update_addons_updated_at ON public.add_ons;
CREATE TRIGGER update_addons_updated_at
  BEFORE UPDATE ON public.add_ons
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- Availability blocks updated_at trigger
DROP TRIGGER IF EXISTS update_availability_blocks_updated_at ON public.room_availability_blocks;
CREATE TRIGGER update_availability_blocks_updated_at
  BEFORE UPDATE ON public.room_availability_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

-- ============================================================================
-- AUTO-GENERATE ROOM CODE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TRIGGER AS $$
DECLARE
  v_code VARCHAR(20);
  v_exists BOOLEAN;
BEGIN
  IF NEW.room_code IS NULL THEN
    LOOP
      -- Generate code like RM-A1B2C3
      v_code := 'RM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

      -- Check if code exists
      SELECT EXISTS(SELECT 1 FROM public.rooms WHERE room_code = v_code) INTO v_exists;

      EXIT WHEN NOT v_exists;
    END LOOP;

    NEW.room_code := v_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_room_code_trigger ON public.rooms;
CREATE TRIGGER generate_room_code_trigger
  BEFORE INSERT ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION generate_room_code();

-- ============================================================================
-- COMPLETENESS SCORE CALCULATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_room_completeness(p_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_room RECORD;
  v_bed_count INTEGER;
  v_amenity_count INTEGER;
  v_gallery_count INTEGER;
BEGIN
  -- Get room data
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Room Details (20%): Name + 20+ char description
  IF v_room.name IS NOT NULL AND LENGTH(v_room.name) > 0 THEN
    v_score := v_score + 10;
  END IF;
  IF v_room.description IS NOT NULL AND LENGTH(v_room.description) >= 20 THEN
    v_score := v_score + 10;
  END IF;

  -- Bed Config (15%): At least 1 bed
  SELECT COUNT(*) INTO v_bed_count FROM public.room_beds WHERE room_id = p_room_id;
  IF v_bed_count > 0 THEN
    v_score := v_score + 15;
  END IF;

  -- Amenities (10%): 3+ amenities
  v_amenity_count := COALESCE(jsonb_array_length(v_room.amenities), 0);
  IF v_amenity_count >= 3 THEN
    v_score := v_score + 10;
  ELSIF v_amenity_count >= 1 THEN
    v_score := v_score + 5;
  END IF;

  -- Photos (15%): Featured image + 2+ gallery
  IF v_room.featured_image IS NOT NULL AND LENGTH(v_room.featured_image) > 0 THEN
    v_score := v_score + 8;
  END IF;
  v_gallery_count := COALESCE(jsonb_array_length(v_room.gallery_images), 0);
  IF v_gallery_count >= 2 THEN
    v_score := v_score + 7;
  ELSIF v_gallery_count >= 1 THEN
    v_score := v_score + 3;
  END IF;

  -- Pricing Model (5%): Always complete (has default)
  v_score := v_score + 5;

  -- Base Rates (20%): Price > 0
  IF v_room.base_price_per_night > 0 THEN
    v_score := v_score + 20;
  END IF;

  -- Stay Duration (10%): Min stay >= 1
  IF v_room.min_nights >= 1 THEN
    v_score := v_score + 10;
  END IF;

  -- Inventory (5%): Proper mode/units config
  IF (v_room.inventory_mode = 'single_unit' AND v_room.total_units = 1) OR
     (v_room.inventory_mode = 'room_type' AND v_room.total_units >= 1) THEN
    v_score := v_score + 5;
  END IF;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update completeness score
CREATE OR REPLACE FUNCTION update_room_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completeness_score := calculate_room_completeness(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_room_completeness_trigger ON public.rooms;
CREATE TRIGGER update_room_completeness_trigger
  BEFORE INSERT OR UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_room_completeness();

-- Also update when beds change
CREATE OR REPLACE FUNCTION update_room_completeness_on_beds()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_room_id := OLD.room_id;
  ELSE
    v_room_id := NEW.room_id;
  END IF;

  UPDATE public.rooms
  SET completeness_score = calculate_room_completeness(v_room_id)
  WHERE id = v_room_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_room_completeness_on_beds_trigger ON public.room_beds;
CREATE TRIGGER update_room_completeness_on_beds_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.room_beds
  FOR EACH ROW
  EXECUTE FUNCTION update_room_completeness_on_beds();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_seasonal_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_availability_blocks ENABLE ROW LEVEL SECURITY;

-- Rooms: Property owners and team can manage, super admins can manage all
DROP POLICY IF EXISTS rooms_select_policy ON public.rooms;
CREATE POLICY rooms_select_policy ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR has_permission('rooms', 'read')
    OR property_id IN (
      SELECT property_id FROM public.user_properties WHERE user_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS rooms_insert_policy ON public.rooms;
CREATE POLICY rooms_insert_policy ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_super_admin()
    OR has_permission('rooms', 'create')
    OR property_id IN (
      SELECT property_id FROM public.user_properties WHERE user_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS rooms_update_policy ON public.rooms;
CREATE POLICY rooms_update_policy ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (
    is_super_admin()
    OR has_permission('rooms', 'update')
    OR property_id IN (
      SELECT property_id FROM public.user_properties WHERE user_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS rooms_delete_policy ON public.rooms;
CREATE POLICY rooms_delete_policy ON public.rooms
  FOR DELETE
  TO authenticated
  USING (
    is_super_admin()
    OR has_permission('rooms', 'delete')
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- Room Beds: Same as rooms
DROP POLICY IF EXISTS room_beds_select_policy ON public.room_beds;
CREATE POLICY room_beds_select_policy ON public.room_beds
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (SELECT id FROM public.rooms)
  );

DROP POLICY IF EXISTS room_beds_modify_policy ON public.room_beds;
CREATE POLICY room_beds_modify_policy ON public.room_beds
  FOR ALL
  TO authenticated
  USING (
    room_id IN (SELECT id FROM public.rooms)
  );

-- Seasonal Rates: Same as rooms
DROP POLICY IF EXISTS seasonal_rates_select_policy ON public.room_seasonal_rates;
CREATE POLICY seasonal_rates_select_policy ON public.room_seasonal_rates
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (SELECT id FROM public.rooms)
  );

DROP POLICY IF EXISTS seasonal_rates_modify_policy ON public.room_seasonal_rates;
CREATE POLICY seasonal_rates_modify_policy ON public.room_seasonal_rates
  FOR ALL
  TO authenticated
  USING (
    room_id IN (SELECT id FROM public.rooms)
  );

-- Promotions: Same logic
DROP POLICY IF EXISTS promotions_select_policy ON public.room_promotions;
CREATE POLICY promotions_select_policy ON public.room_promotions
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR room_id IN (SELECT id FROM public.rooms)
    OR property_id IN (
      SELECT property_id FROM public.user_properties WHERE user_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS promotions_modify_policy ON public.room_promotions;
CREATE POLICY promotions_modify_policy ON public.room_promotions
  FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR room_id IN (SELECT id FROM public.rooms)
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- Add-ons: Property scope
DROP POLICY IF EXISTS addons_select_policy ON public.add_ons;
CREATE POLICY addons_select_policy ON public.add_ons
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR has_permission('rooms', 'read')
    OR property_id IN (
      SELECT property_id FROM public.user_properties WHERE user_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS addons_modify_policy ON public.add_ons;
CREATE POLICY addons_modify_policy ON public.add_ons
  FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- Availability Blocks: Same as rooms
DROP POLICY IF EXISTS availability_blocks_select_policy ON public.room_availability_blocks;
CREATE POLICY availability_blocks_select_policy ON public.room_availability_blocks
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (SELECT id FROM public.rooms)
  );

DROP POLICY IF EXISTS availability_blocks_modify_policy ON public.room_availability_blocks;
CREATE POLICY availability_blocks_modify_policy ON public.room_availability_blocks
  FOR ALL
  TO authenticated
  USING (
    room_id IN (SELECT id FROM public.rooms)
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get effective price for a room on a specific date
CREATE OR REPLACE FUNCTION get_room_effective_price(
  p_room_id UUID,
  p_date DATE
)
RETURNS TABLE (
  price_per_night DECIMAL(12, 2),
  additional_person_rate DECIMAL(12, 2),
  pricing_mode pricing_mode,
  rate_name VARCHAR(100),
  is_seasonal BOOLEAN
) AS $$
DECLARE
  v_room RECORD;
  v_seasonal RECORD;
BEGIN
  -- Get room base data
  SELECT r.base_price_per_night, r.additional_person_rate, r.pricing_mode
  INTO v_room
  FROM public.rooms r
  WHERE r.id = p_room_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check for seasonal rate
  SELECT sr.price_per_night, sr.additional_person_rate, sr.pricing_mode_override, sr.name
  INTO v_seasonal
  FROM public.room_seasonal_rates sr
  WHERE sr.room_id = p_room_id
    AND sr.is_active = true
    AND p_date BETWEEN sr.start_date AND sr.end_date
  ORDER BY sr.priority DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT
      v_seasonal.price_per_night,
      COALESCE(v_seasonal.additional_person_rate, v_room.additional_person_rate),
      COALESCE(v_seasonal.pricing_mode_override, v_room.pricing_mode),
      v_seasonal.name,
      true;
  ELSE
    RETURN QUERY SELECT
      v_room.base_price_per_night,
      v_room.additional_person_rate,
      v_room.pricing_mode,
      'Base Rate'::VARCHAR(100),
      false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Check room availability for date range
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

  -- Count booked units (from bookings table - will be created in next migration)
  -- For now, return full availability
  v_booked_units := 0;
  v_conflicts := '[]'::JSONB;

  RETURN QUERY SELECT
    (v_room.total_units - v_booked_units) > 0,
    v_room.total_units - v_booked_units,
    v_conflicts;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.room_beds TO service_role;
GRANT ALL ON public.room_seasonal_rates TO service_role;
GRANT ALL ON public.room_promotions TO service_role;
GRANT ALL ON public.add_ons TO service_role;
GRANT ALL ON public.room_availability_blocks TO service_role;

GRANT SELECT ON public.rooms TO authenticated;
GRANT SELECT ON public.room_beds TO authenticated;
GRANT SELECT ON public.room_seasonal_rates TO authenticated;
GRANT SELECT ON public.room_promotions TO authenticated;
GRANT SELECT ON public.add_ons TO authenticated;
GRANT SELECT ON public.room_availability_blocks TO authenticated;

-- Grant DML for authenticated (RLS will control access)
GRANT INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.room_beds TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.room_seasonal_rates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.room_promotions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.add_ons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.room_availability_blocks TO authenticated;

-- ============================================================================
-- ADD ROOMS PERMISSIONS
-- ============================================================================

INSERT INTO public.permissions (resource, action, description)
VALUES
  ('rooms', 'read', 'View rooms and accommodation units'),
  ('rooms', 'create', 'Create new rooms'),
  ('rooms', 'update', 'Update existing rooms'),
  ('rooms', 'delete', 'Delete rooms'),
  ('rooms', 'manage', 'Full room management access')
ON CONFLICT (resource, action) DO NOTHING;
