-- Migration: 086_backfill_customers_from_bookings.sql
-- Description: Backfill customers table with historical booking data
-- Date: 2026-01-15
--
-- This migration imports existing guests from the bookings table into the
-- new customers table, aggregating their booking history and statistics.
--
-- IMPORTANT: Run this migration AFTER 085_create_customers_schema.sql

-- ============================================================================
-- BACKFILL CUSTOMERS FROM BOOKINGS
-- ============================================================================

-- Aggregate booking data and create customer records
INSERT INTO customers (
  email,
  full_name,
  phone,
  company_id,
  first_property_id,
  source,
  status,
  total_bookings,
  total_spent,
  currency,
  first_booking_date,
  last_booking_date,
  last_booking_id,
  user_id,
  created_at,
  updated_at
)
SELECT
  LOWER(guest_email) as email,
  MAX(guest_name) as full_name,  -- Use most recent non-null name
  MAX(guest_phone) as phone,     -- Use most recent non-null phone
  company_id,
  (array_agg(property_id ORDER BY created_at))[1] as first_property_id,  -- First property they booked
  'booking'::customer_source as source,
  CASE
    -- Active if they have upcoming/current bookings
    WHEN MAX(CASE WHEN booking_status IN ('confirmed', 'checked_in') THEN 1 ELSE 0 END) = 1
      THEN 'active'::customer_status
    -- Past guest if they have completed bookings
    WHEN MAX(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) = 1
      THEN 'past_guest'::customer_status
    -- Otherwise lead
    ELSE 'lead'::customer_status
  END as status,
  COUNT(*) as total_bookings,
  COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_spent,
  'ZAR' as currency,  -- Default currency
  MIN(check_in_date) as first_booking_date,
  MAX(check_in_date) as last_booking_date,
  (array_agg(id ORDER BY created_at DESC))[1] as last_booking_id,  -- Most recent booking ID
  (array_agg(guest_id ORDER BY created_at DESC) FILTER (WHERE guest_id IS NOT NULL))[1] as user_id,  -- Most recent non-null guest_id
  MIN(created_at) as created_at,
  NOW() as updated_at
FROM (
  -- Subquery to get bookings with company_id
  SELECT
    b.*,
    p.company_id
  FROM bookings b
  JOIN properties p ON p.id = b.property_id
  WHERE b.guest_email IS NOT NULL
  AND b.booking_status NOT IN ('cancelled', 'no_show')
) booking_data
GROUP BY
  LOWER(guest_email),
  company_id
-- Only insert if customer doesn't already exist (idempotent)
ON CONFLICT (LOWER(email), company_id) DO NOTHING;

-- ============================================================================
-- BACKFILL CUSTOMER_PROPERTIES JUNCTION TABLE
-- ============================================================================

-- Create per-property statistics for each customer
INSERT INTO customer_properties (
  customer_id,
  property_id,
  total_bookings,
  total_spent,
  first_booking_date,
  last_booking_date,
  created_at,
  updated_at
)
SELECT
  c.id as customer_id,
  b.property_id,
  COUNT(*) as total_bookings,
  COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) as total_spent,
  MIN(b.check_in_date) as first_booking_date,
  MAX(b.check_in_date) as last_booking_date,
  MIN(b.created_at) as created_at,
  NOW() as updated_at
FROM customers c
JOIN properties p ON p.company_id = c.company_id
JOIN bookings b ON LOWER(b.guest_email) = LOWER(c.email) AND b.property_id = p.id
WHERE b.booking_status NOT IN ('cancelled', 'no_show')
GROUP BY c.id, b.property_id
-- Only insert if relationship doesn't already exist (idempotent)
ON CONFLICT (customer_id, property_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION AND REPORTING
-- ============================================================================

DO $backfill_report$
DECLARE
  customer_count INTEGER;
  booking_count INTEGER;
  junction_count INTEGER;
BEGIN
  -- Count created customers
  SELECT COUNT(*) INTO customer_count FROM customers;

  -- Count total bookings
  SELECT COUNT(DISTINCT guest_email) INTO booking_count
  FROM bookings
  WHERE guest_email IS NOT NULL
  AND booking_status NOT IN ('cancelled', 'no_show');

  -- Count junction records
  SELECT COUNT(*) INTO junction_count FROM customer_properties;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customer Backfill Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total customers created: %', customer_count;
  RAISE NOTICE 'Unique guest emails in bookings: %', booking_count;
  RAISE NOTICE 'Customer-property relationships: %', junction_count;
  RAISE NOTICE '========================================';

  -- Sanity check: should have at least some customers if bookings exist
  IF booking_count > 0 AND customer_count = 0 THEN
    RAISE WARNING 'Expected customers to be created but none found. Check migration logic.';
  END IF;
END $backfill_report$;
