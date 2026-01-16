-- Migration 051: Rename friendliness to location
-- Changes the rating category from "friendliness" to "location" to better reflect property location rating

-- Rename the column
ALTER TABLE property_reviews
  RENAME COLUMN rating_friendliness TO rating_location;

-- Update the overall rating calculation trigger (if it exists as a computed column)
-- The rating_overall is a GENERATED column, so we need to drop and recreate it
ALTER TABLE property_reviews
  DROP COLUMN rating_overall;

ALTER TABLE property_reviews
  ADD COLUMN rating_overall DECIMAL(2,1) GENERATED ALWAYS AS (
    (rating_safety + rating_cleanliness + rating_location + rating_comfort + rating_scenery) / 5.0
  ) STORED;

-- Add comment to document the change
COMMENT ON COLUMN property_reviews.rating_location IS 'Rating for property location (1-5 scale), formerly friendliness';
