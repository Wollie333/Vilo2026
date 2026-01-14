-- ============================================================================
-- Migration: 054_create_wishlist_schema.sql
-- Description: Create user wishlist/favorites system for saved properties
-- Date: 2026-01-11
-- ============================================================================

-- ============================================================================
-- 1. CREATE USER_WISHLISTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

COMMENT ON TABLE user_wishlists IS 'User saved/favorited properties for future booking consideration';
COMMENT ON COLUMN user_wishlists.user_id IS 'User who saved this property';
COMMENT ON COLUMN user_wishlists.property_id IS 'Property that was saved';
COMMENT ON COLUMN user_wishlists.notes IS 'Optional notes from user (e.g., "for anniversary trip")';

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Index for fetching a user's wishlist
CREATE INDEX IF NOT EXISTS idx_wishlists_user
  ON user_wishlists(user_id);

-- Index for checking if property is in wishlist
CREATE INDEX IF NOT EXISTS idx_wishlists_property
  ON user_wishlists(property_id);

-- Composite index for quick wishlist checks
CREATE INDEX IF NOT EXISTS idx_wishlists_user_property
  ON user_wishlists(user_id, property_id);

-- Index for recently added to wishlist
CREATE INDEX IF NOT EXISTS idx_wishlists_created
  ON user_wishlists(user_id, created_at DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_wishlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlists
CREATE POLICY "Users can view their own wishlists"
  ON user_wishlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add to their own wishlists
CREATE POLICY "Users can add to their own wishlists"
  ON user_wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlists
CREATE POLICY "Users can remove from their own wishlists"
  ON user_wishlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update notes on their own wishlists
CREATE POLICY "Users can update their own wishlist notes"
  ON user_wishlists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTION FOR WISHLIST COUNT
-- ============================================================================

-- Function to get wishlist count for a property (useful for "X users saved this")
CREATE OR REPLACE FUNCTION get_property_wishlist_count(property_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM user_wishlists
    WHERE property_id = property_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_property_wishlist_count IS 'Returns number of users who have saved this property to their wishlist';
