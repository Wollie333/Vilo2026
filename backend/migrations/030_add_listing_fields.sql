-- Migration: Add listing fields to properties table
-- These fields support the guest-facing listing details

-- ESSENTIALS
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(50);

-- SHOWCASE
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_title VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- STAY DETAILS
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '15:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '11:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cancellation_policy VARCHAR(50) DEFAULT 'moderate';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS whats_included JSONB DEFAULT '[]'::jsonb;

-- CATEGORIES & LOCATION
ALTER TABLE properties ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- MARKETING
ALTER TABLE properties ADD COLUMN IF NOT EXISTS promotions JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN properties.property_type IS 'Type of property: house, apartment, villa, cottage, cabin, condo, townhouse, guesthouse, hotel, bnb';
COMMENT ON COLUMN properties.listing_title IS 'Guest-facing title for the listing';
COMMENT ON COLUMN properties.listing_description IS 'Guest-facing description for the listing';
COMMENT ON COLUMN properties.highlights IS 'Array of standout features (e.g., ["Ocean view", "Private pool"])';
COMMENT ON COLUMN properties.gallery_images IS 'Array of gallery images: [{url, caption, order}]';
COMMENT ON COLUMN properties.check_in_time IS 'Check-in time (default 15:00)';
COMMENT ON COLUMN properties.check_out_time IS 'Check-out time (default 11:00)';
COMMENT ON COLUMN properties.cancellation_policy IS 'Policy: flexible, moderate, strict, non-refundable';
COMMENT ON COLUMN properties.amenities IS 'Array of available amenities';
COMMENT ON COLUMN properties.house_rules IS 'Array of house rules';
COMMENT ON COLUMN properties.whats_included IS 'Array of included items';
COMMENT ON COLUMN properties.categories IS 'Array of category tags for search filters';
COMMENT ON COLUMN properties.location_lat IS 'Latitude coordinate';
COMMENT ON COLUMN properties.location_lng IS 'Longitude coordinate';
COMMENT ON COLUMN properties.promotions IS 'Array of promotions: [{code, discount, start_date, end_date}]';
