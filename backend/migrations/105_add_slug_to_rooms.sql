-- Migration: 105_add_slug_to_rooms.sql
-- Description: Add slug column to rooms table for SEO-friendly URLs in public website
-- Date: 2026-01-17

-- ============================================================================
-- ADD SLUG COLUMN TO ROOMS TABLE
-- ============================================================================

-- Add slug column (nullable initially to handle existing rows)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS slug VARCHAR(150);

-- ============================================================================
-- GENERATE SLUGS FOR EXISTING ROOMS
-- ============================================================================

-- Generate slugs from room names (lowercase, replace spaces/special chars with hyphens)
UPDATE rooms
SET slug = lower(
  regexp_replace(
    regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Remove special chars except spaces and hyphens
    '\s+', '-', 'g'  -- Replace spaces with hyphens
  )
)
WHERE slug IS NULL;

-- Handle potential duplicates by appending room ID
UPDATE rooms r1
SET slug = slug || '-' || substring(id::text, 1, 8)
WHERE EXISTS (
  SELECT 1
  FROM rooms r2
  WHERE r1.property_id = r2.property_id
    AND r1.slug = r2.slug
    AND r1.id != r2.id
);

-- ============================================================================
-- ADD CONSTRAINTS AND INDEXES
-- ============================================================================

-- Make slug NOT NULL after populating existing rows
ALTER TABLE rooms ALTER COLUMN slug SET NOT NULL;

-- Create unique index on property_id + slug combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_property_slug
ON rooms(property_id, slug);

-- Create index on slug alone for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_slug
ON rooms(slug);

-- ============================================================================
-- VERIFICATION QUERY (Comment out - for manual testing)
-- ============================================================================

-- SELECT
--   id,
--   property_id,
--   name,
--   slug,
--   COUNT(*) OVER (PARTITION BY property_id, slug) as duplicate_count
-- FROM rooms
-- ORDER BY property_id, slug;
