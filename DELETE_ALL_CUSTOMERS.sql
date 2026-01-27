-- ============================================================================
-- DELETE ALL CUSTOMERS - Test Data Cleanup
-- ============================================================================
-- WARNING: This will permanently delete ALL customer records and related data
-- Created: 2026-01-25
-- ============================================================================

-- STEP 1: Check what will be deleted
-- ============================================================================
SELECT
  'Customers to delete' as item,
  COUNT(*) as count
FROM customers;

-- STEP 2: Show customer breakdown by property
-- ============================================================================
SELECT
  p.name as property_name,
  COUNT(c.id) as customer_count
FROM customers c
LEFT JOIN properties p ON p.id = c.property_id
GROUP BY p.name
ORDER BY customer_count DESC;

-- STEP 3: Check related data that might be affected
-- ============================================================================

-- Check bookings linked to customers (if any)
SELECT
  'Bookings with customer references' as item,
  COUNT(*) as count
FROM bookings
WHERE guest_id IN (SELECT id FROM customers WHERE user_id IS NOT NULL);

-- STEP 4: Delete all customers
-- ============================================================================
-- This will delete all customer records
-- Foreign keys will handle cascading or prevent deletion if needed

BEGIN;

-- Store count before deletion
DO $$
DECLARE
  customer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM customers;
  RAISE NOTICE 'Deleting % customer records...', customer_count;
END $$;

-- Delete all customers
DELETE FROM customers;

-- Verify deletion
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count FROM customers;
  IF remaining_count = 0 THEN
    RAISE NOTICE '✓ Successfully deleted all customers';
  ELSE
    RAISE WARNING 'Warning: % customers remain', remaining_count;
  END IF;
END $$;

-- COMMIT the transaction
-- IMPORTANT: Uncomment the line below to actually commit the deletion
-- COMMIT;

-- If you want to rollback instead, use:
ROLLBACK;

-- ============================================================================
-- VERIFICATION QUERIES (run after commit)
-- ============================================================================

-- Verify customers table is empty
SELECT COUNT(*) as remaining_customers FROM customers;

-- Check if any orphaned data exists
SELECT
  'Orphaned bookings' as item,
  COUNT(*) as count
FROM bookings b
WHERE b.guest_id NOT IN (SELECT id FROM users);
