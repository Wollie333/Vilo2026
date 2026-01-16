-- Migration: 051_fix_review_rating_column.sql
-- Description: Rename rating_friendliness to rating_location to match TypeScript types
-- Date: 2026-01-15

-- ============================================================================
-- RENAME RATING COLUMN
-- ============================================================================

DO $$
BEGIN
  -- Check if rating_friendliness exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_reviews' AND column_name = 'rating_friendliness'
  ) THEN
    -- Rename column
    ALTER TABLE property_reviews
    RENAME COLUMN rating_friendliness TO rating_location;

    -- Log the change
    RAISE NOTICE 'Column rating_friendliness renamed to rating_location';
  ELSE
    RAISE NOTICE 'Column rating_friendliness does not exist, skipping rename';
  END IF;
END $$;

-- ============================================================================
-- UPDATE COMPUTED COLUMN FORMULA
-- ============================================================================

-- Drop existing generated column
ALTER TABLE property_reviews DROP COLUMN IF EXISTS rating_overall;

-- Recreate with correct formula using rating_location
ALTER TABLE property_reviews ADD COLUMN rating_overall DECIMAL(2,1) GENERATED ALWAYS AS (
  (rating_safety + rating_cleanliness + rating_location + rating_comfort + rating_scenery) / 5.0
) STORED;

-- ============================================================================
-- UPDATE COLUMN COMMENTS
-- ============================================================================

COMMENT ON COLUMN property_reviews.rating_location IS 'Rating for property location and accessibility (1.0-5.0)';
COMMENT ON COLUMN property_reviews.rating_overall IS 'Overall rating computed as average of all 5 category ratings (1.0-5.0)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Migration 051 completed successfully';
  RAISE NOTICE 'rating_friendliness renamed to rating_location';
  RAISE NOTICE 'rating_overall formula updated to use rating_location';
END $$;
