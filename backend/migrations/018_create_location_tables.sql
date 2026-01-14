-- ============================================================================
-- Migration: Create Location Tables for Dynamic Address Fields
-- Description: Creates countries, provinces, and cities tables for cascading dropdowns
-- ============================================================================

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(3) NOT NULL UNIQUE,  -- ISO 3166-1 alpha-3
  code_2 VARCHAR(2),                 -- ISO 3166-1 alpha-2
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provinces/States table
CREATE TABLE IF NOT EXISTS provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  postal_codes TEXT[],  -- Array of valid postal codes for this city
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_provinces_country ON provinces(country_id);
CREATE INDEX IF NOT EXISTS idx_provinces_active ON provinces(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cities_province ON cities(province_id);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active) WHERE is_active = true;

-- Updated at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS countries_updated_at ON countries;
CREATE TRIGGER countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION update_location_updated_at();

DROP TRIGGER IF EXISTS provinces_updated_at ON provinces;
CREATE TRIGGER provinces_updated_at
  BEFORE UPDATE ON provinces
  FOR EACH ROW
  EXECUTE FUNCTION update_location_updated_at();

DROP TRIGGER IF EXISTS cities_updated_at ON cities;
CREATE TRIGGER cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_location_updated_at();

-- RLS Policies (locations are public read, admin write)
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read locations
CREATE POLICY "Allow read access to countries" ON countries
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to provinces" ON provinces
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to cities" ON cities
  FOR SELECT USING (true);

-- Comments
COMMENT ON TABLE countries IS 'Countries for address selection';
COMMENT ON TABLE provinces IS 'Provinces/States within countries';
COMMENT ON TABLE cities IS 'Cities within provinces with optional postal codes';
COMMENT ON COLUMN countries.code IS 'ISO 3166-1 alpha-3 country code';
COMMENT ON COLUMN countries.code_2 IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN cities.postal_codes IS 'Array of valid postal codes for this city';
