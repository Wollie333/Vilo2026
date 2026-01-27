-- ============================================================================
-- DELETE ALL TEST BOOKINGS
-- ============================================================================
-- Purpose: Delete all bookings and related data to start fresh for testing
-- WARNING: This will permanently delete ALL booking data!
-- Date: 2026-01-24

BEGIN;

-- Step 1: Delete all booking status history
DELETE FROM public.booking_status_history;

-- Step 2: Delete all booking payments
DELETE FROM public.booking_payments;

-- Step 3: Delete all booking guests
DELETE FROM public.booking_guests;

-- Step 4: Delete all booking add-ons
DELETE FROM public.booking_addons;

-- Step 5: Delete all booking rooms (the many-to-many relationship)
DELETE FROM public.booking_rooms;

-- Step 6: Delete all invoices related to bookings
DELETE FROM public.invoices WHERE booking_id IS NOT NULL;

-- Step 7: Delete all refund requests
DELETE FROM public.refund_requests;

-- Step 8: Delete all bookings
DELETE FROM public.bookings;

-- Verify deletion
SELECT
  'bookings' as table_name, COUNT(*) as remaining_records
FROM public.bookings
UNION ALL
SELECT
  'booking_rooms' as table_name, COUNT(*) as remaining_records
FROM public.booking_rooms
UNION ALL
SELECT
  'booking_addons' as table_name, COUNT(*) as remaining_records
FROM public.booking_addons
UNION ALL
SELECT
  'booking_guests' as table_name, COUNT(*) as remaining_records
FROM public.booking_guests
UNION ALL
SELECT
  'booking_payments' as table_name, COUNT(*) as remaining_records
FROM public.booking_payments
UNION ALL
SELECT
  'booking_status_history' as table_name, COUNT(*) as remaining_records
FROM public.booking_status_history
UNION ALL
SELECT
  'invoices (with booking_id)' as table_name, COUNT(*) as remaining_records
FROM public.invoices
WHERE booking_id IS NOT NULL
UNION ALL
SELECT
  'refund_requests' as table_name, COUNT(*) as remaining_records
FROM public.refund_requests;

COMMIT;

-- ============================================================================
-- EXPECTED OUTPUT: All counts should be 0
-- ============================================================================
