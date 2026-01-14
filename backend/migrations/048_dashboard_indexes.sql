-- ============================================================================
-- Migration: 048_dashboard_indexes
-- Description: Add indexes to optimize dashboard queries
-- Created: 2026-01-10
-- ============================================================================

-- Indexes for booking queries (property owner dashboard)
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

-- Indexes for properties queries
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);

-- Indexes for audit logs (activity feed)
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

-- Composite indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_bookings_property_status
  ON bookings(property_id, booking_status);

CREATE INDEX IF NOT EXISTS idx_bookings_guest_dates
  ON bookings(guest_id, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_bookings_owner_status
  ON bookings(property_id, booking_status, created_at);

-- Indexes for user queries (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Indexes for subscription queries (super admin dashboard)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_created ON user_subscriptions(created_at);

-- Performance comment
COMMENT ON INDEX idx_bookings_property_status IS 'Optimize property owner dashboard booking counts';
COMMENT ON INDEX idx_bookings_guest_dates IS 'Optimize guest dashboard upcoming/past stays queries';
COMMENT ON INDEX idx_audit_created_at IS 'Optimize activity feed queries across all dashboards';
