-- ============================================================================
-- Migration: 053_add_property_listing_visibility.sql (FIXED)
-- Description: Add public listing visibility controls and search optimization
-- Date: 2026-01-11
-- ============================================================================

-- 1. ADD VISIBILITY COLUMNS TO PROPERTIES
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_listed_publicly BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS listed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listing_priority INTEGER DEFAULT 0;

COMMENT ON COLUMN properties.is_listed_publicly IS 'Opt-in toggle for public directory visibility (default: false)';
COMMENT ON COLUMN properties.listed_at IS 'Timestamp when property was first listed publicly (for "new listings" sort)';
COMMENT ON COLUMN properties.listing_priority IS 'Featured property priority (0=normal, higher values=more prominent)';

-- 2. ADD LOCATION HIERARCHY FOREIGN KEYS
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES provinces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL;

COMMENT ON COLUMN properties.country_id IS 'Country reference for hierarchical location filtering';
COMMENT ON COLUMN properties.province_id IS 'Province/State reference for hierarchical location filtering';
COMMENT ON COLUMN properties.city_id IS 'City reference for hierarchical location filtering';

-- 3. CREATE SEARCH OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_properties_public_listing
  ON properties(is_listed_publicly, is_active)
  WHERE is_listed_publicly = TRUE AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_properties_location_hierarchy
  ON properties(country_id, province_id, city_id);

CREATE INDEX IF NOT EXISTS idx_properties_country
  ON properties(country_id)
  WHERE country_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_province
  ON properties(province_id)
  WHERE province_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_city
  ON properties(city_id)
  WHERE city_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_categories
  ON properties USING GIN(categories);

CREATE INDEX IF NOT EXISTS idx_properties_amenities
  ON properties USING GIN(amenities);

CREATE INDEX IF NOT EXISTS idx_properties_search_text
  ON properties USING GIN(
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(listing_title, '') || ' ' ||
      coalesce(listing_description, '') || ' ' ||
      coalesce(address_city, '') || ' ' ||
      coalesce(address_state, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_properties_featured
  ON properties(listing_priority DESC, created_at DESC)
  WHERE is_listed_publicly = TRUE AND is_active = TRUE AND listing_priority > 0;

CREATE INDEX IF NOT EXISTS idx_properties_recently_listed
  ON properties(listed_at DESC)
  WHERE is_listed_publicly = TRUE AND is_active = TRUE AND listed_at IS NOT NULL;

-- 4. UPDATE RLS POLICIES FOR PUBLIC ACCESS (FIXED - No IF NOT EXISTS)
-- Drop policies if they exist, then recreate
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow public read of listed properties" ON properties;
  DROP POLICY IF EXISTS "Allow authenticated read of listed properties" ON properties;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Allow public read of listed properties"
  ON properties
  FOR SELECT
  TO anon
  USING (is_listed_publicly = TRUE AND is_active = TRUE);

CREATE POLICY "Allow authenticated read of listed properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (is_listed_publicly = TRUE AND is_active = TRUE OR owner_id = auth.uid());

COMMENT ON TABLE properties IS 'Properties table with public directory listing support. Properties are private by default unless is_listed_publicly = true';
