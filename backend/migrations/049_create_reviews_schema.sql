-- Migration: 049_create_reviews_schema.sql
-- Description: Create property_reviews table with 5 category ratings, moderation features, and RLS policies
-- Date: 2026-01-11

-- ============================================================================
-- PROPERTY REVIEWS TABLE
-- ============================================================================

CREATE TABLE property_reviews (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for guest checkouts

  -- Guest info (snapshot at review time)
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,

  -- Stay details (snapshot)
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,

  -- Category Ratings (1-5 scale, decimals allowed for precision)
  rating_safety DECIMAL(2,1) NOT NULL CHECK (rating_safety >= 1.0 AND rating_safety <= 5.0),
  rating_cleanliness DECIMAL(2,1) NOT NULL CHECK (rating_cleanliness >= 1.0 AND rating_cleanliness <= 5.0),
  rating_friendliness DECIMAL(2,1) NOT NULL CHECK (rating_friendliness >= 1.0 AND rating_friendliness <= 5.0),
  rating_comfort DECIMAL(2,1) NOT NULL CHECK (rating_comfort >= 1.0 AND rating_comfort <= 5.0),
  rating_scenery DECIMAL(2,1) NOT NULL CHECK (rating_scenery >= 1.0 AND rating_scenery <= 5.0),

  -- Overall rating (computed average)
  rating_overall DECIMAL(2,1) GENERATED ALWAYS AS (
    (rating_safety + rating_cleanliness + rating_friendliness + rating_comfort + rating_scenery) / 5.0
  ) STORED,

  -- Review content
  review_title VARCHAR(255), -- Optional title
  review_text TEXT NOT NULL, -- Main review body

  -- Photos (array of image URLs from storage)
  photos JSONB DEFAULT '[]'::jsonb, -- [{url, caption, order}, ...]

  -- Status and visibility
  status VARCHAR(50) NOT NULL DEFAULT 'published', -- published, hidden, withdrawn
  is_text_hidden BOOLEAN DEFAULT false, -- Property owner hid offensive text/images
  is_photos_hidden BOOLEAN DEFAULT false, -- Property owner hid offensive photos

  -- Withdrawal tracking
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawn_by UUID REFERENCES users(id) ON DELETE SET NULL,
  withdrawal_reason TEXT,
  withdrawal_requested_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Property owner who requested
  withdrawal_requested_at TIMESTAMP WITH TIME ZONE,

  -- Response from property owner
  owner_response TEXT,
  owner_response_by UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_response_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  helpful_count INTEGER DEFAULT 0, -- Future: users can mark review as helpful
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT one_review_per_booking UNIQUE (booking_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Query reviews by property
CREATE INDEX idx_reviews_property_id ON property_reviews(property_id);

-- Query reviews by guest
CREATE INDEX idx_reviews_guest_id ON property_reviews(guest_id) WHERE guest_id IS NOT NULL;

-- Query reviews by booking
CREATE INDEX idx_reviews_booking_id ON property_reviews(booking_id);

-- Filter by status
CREATE INDEX idx_reviews_status ON property_reviews(status);

-- Sort by rating
CREATE INDEX idx_reviews_overall_rating ON property_reviews(rating_overall DESC);

-- Sort by date
CREATE INDEX idx_reviews_created_at ON property_reviews(created_at DESC);

-- Composite for property page queries
CREATE INDEX idx_reviews_property_status_date
  ON property_reviews(property_id, status, created_at DESC);

-- Pending withdrawal requests (for admin dashboard)
CREATE INDEX idx_reviews_pending_withdrawals
  ON property_reviews(withdrawal_requested_at)
  WHERE withdrawal_requested_at IS NOT NULL AND withdrawn_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_property_reviews_updated_at
  BEFORE UPDATE ON property_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE property_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view published reviews (public access)
CREATE POLICY "Anyone can view published reviews"
  ON property_reviews FOR SELECT
  USING (status = 'published');

-- Guests can view their own reviews regardless of status
CREATE POLICY "Guests can view their own reviews"
  ON property_reviews FOR SELECT
  USING (guest_id = auth.uid());

-- Guests can create reviews for their own bookings (with eligibility checks)
CREATE POLICY "Guests can create reviews for their bookings"
  ON property_reviews FOR INSERT
  WITH CHECK (
    guest_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
        AND bookings.guest_id = auth.uid()
        AND bookings.booking_status IN ('checked_out', 'completed')
        AND bookings.checked_out_at IS NOT NULL
        AND bookings.checked_out_at >= NOW() - INTERVAL '90 days'
    )
  );

-- Guests can update their own reviews (text/photos only, not ratings after creation)
CREATE POLICY "Guests can update their own reviews"
  ON property_reviews FOR UPDATE
  USING (guest_id = auth.uid())
  WITH CHECK (guest_id = auth.uid());

-- Property owners can view all reviews for their properties (including hidden/withdrawn)
CREATE POLICY "Property owners see all reviews for their properties"
  ON property_reviews FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Property owners can update reviews for moderation (hide content, request withdrawal, add response)
CREATE POLICY "Property owners can moderate reviews"
  ON property_reviews FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON property_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'property_admin')
    )
  );

-- Admins can update all reviews (approve/reject withdrawals, force withdraw, etc.)
CREATE POLICY "Admins can update all reviews"
  ON property_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'property_admin')
    )
  );

-- Admins can delete reviews (hard delete for extreme cases)
CREATE POLICY "Admins can delete reviews"
  ON property_reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('super_admin', 'property_admin')
    )
  );

-- ============================================================================
-- ADD REVIEW_SENT_AT TO BOOKINGS TABLE
-- ============================================================================

-- Track when review request email was sent
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_sent_at TIMESTAMP WITH TIME ZONE;

-- Index for finding bookings eligible for review requests
CREATE INDEX IF NOT EXISTS idx_bookings_review_sent
  ON bookings(checked_out_at, review_sent_at)
  WHERE booking_status IN ('checked_out', 'completed');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE property_reviews IS 'Guest reviews for properties with 5 category ratings (Safety, Cleanliness, Friendliness, Comfort, Scenery)';
COMMENT ON COLUMN property_reviews.rating_overall IS 'Computed average of all 5 category ratings';
COMMENT ON COLUMN property_reviews.status IS 'published = visible to public, hidden = owner hid content, withdrawn = removed from scoring';
COMMENT ON COLUMN property_reviews.is_text_hidden IS 'True if property owner hid offensive review text';
COMMENT ON COLUMN property_reviews.is_photos_hidden IS 'True if property owner hid offensive photos';
COMMENT ON COLUMN property_reviews.withdrawal_requested_by IS 'Property owner who requested withdrawal (requires admin approval)';
COMMENT ON COLUMN property_reviews.withdrawn_by IS 'User who approved the withdrawal (guest themselves or admin)';
COMMENT ON COLUMN property_reviews.owner_response IS 'One public response from property owner';
COMMENT ON COLUMN bookings.review_sent_at IS 'Timestamp when review request email was sent to guest';
