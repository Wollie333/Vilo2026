-- ============================================================================
-- Migration 035: Add booking fields to invoices table
-- ============================================================================
-- This migration adds booking-related fields to the invoices table to support
-- generating invoices for room bookings in addition to subscription checkouts.
-- ============================================================================

-- Add booking-related columns to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS booking_reference TEXT,
ADD COLUMN IF NOT EXISTS property_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Create index for booking lookups
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id) WHERE booking_id IS NOT NULL;

-- Create index for booking reference lookups
CREATE INDEX IF NOT EXISTS idx_invoices_booking_reference ON invoices(booking_reference) WHERE booking_reference IS NOT NULL;

-- Add comment
COMMENT ON COLUMN invoices.booking_id IS 'Reference to booking (for booking invoices)';
COMMENT ON COLUMN invoices.booking_reference IS 'Booking reference number (snapshot)';
COMMENT ON COLUMN invoices.property_name IS 'Property name (snapshot for booking invoices)';
COMMENT ON COLUMN invoices.customer_phone IS 'Customer phone number';
