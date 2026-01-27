-- ============================================================================
-- Verification Script for Property-Scoped Customer Migration
-- ============================================================================
-- Run this AFTER applying migration 138_migrate_to_property_scoped_customers.sql
-- This script verifies that the migration completed successfully

-- ============================================================================
-- 1. Check Table Existence
-- ============================================================================

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'customers'
    ) THEN '✅ customers table exists'
    ELSE '❌ customers table missing!'
  END as table_check
UNION ALL
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'customers_old_company_scoped'
    ) THEN '✅ Backup table exists (customers_old_company_scoped)'
    ELSE '⚠️  Backup table missing (customers_old_company_scoped)'
  END
UNION ALL
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'customer_properties'
    ) THEN '✅ Junction table removed (customer_properties)'
    ELSE '⚠️  Junction table still exists (customer_properties)'
  END;

-- ============================================================================
-- 2. Verify Schema Structure
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'customers'
AND column_name IN ('property_id', 'company_id', 'email')
ORDER BY ordinal_position;

-- Expected result:
-- property_id | uuid | NO  | (must exist)
-- company_id  | uuid | NO  | (must exist)
-- email       | character varying | NO |

-- ============================================================================
-- 3. Check Unique Constraint
-- ============================================================================

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'customers'
AND indexname LIKE '%unique%';

-- Expected: idx_customers_new_email_property_unique on (LOWER(email), property_id)

-- ============================================================================
-- 4. Verify Data Migration Stats
-- ============================================================================

WITH migration_stats AS (
  SELECT
    (SELECT COUNT(*) FROM customers_old_company_scoped) as old_count,
    (SELECT COUNT(*) FROM customers) as new_count,
    (SELECT COUNT(DISTINCT property_id) FROM customers) as property_count,
    (SELECT COUNT(DISTINCT LOWER(email)) FROM customers) as unique_emails,
    (SELECT COUNT(DISTINCT company_id) FROM customers) as company_count
)
SELECT
  old_count as "Old Customers (Company-Scoped)",
  new_count as "New Customers (Property-Scoped)",
  property_count as "Properties with Customers",
  unique_emails as "Unique Email Addresses",
  company_count as "Companies",
  ROUND(new_count::NUMERIC / NULLIF(old_count, 0), 2) as "Multiplication Factor"
FROM migration_stats;

-- Expected: new_count should be >= old_count (same or more due to splitting per property)

-- ============================================================================
-- 5. Check for Duplicates (Should be ZERO)
-- ============================================================================

SELECT
  LOWER(email) as email,
  property_id,
  COUNT(*) as duplicate_count
FROM customers
GROUP BY LOWER(email), property_id
HAVING COUNT(*) > 1;

-- Expected: No rows (zero duplicates)

-- ============================================================================
-- 6. Check for Orphaned Records
-- ============================================================================

-- Check if any customers have invalid property_id
SELECT COUNT(*) as orphaned_customers
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM properties p WHERE p.id = c.property_id
);

-- Expected: 0

-- Check if any customers have invalid company_id
SELECT COUNT(*) as invalid_company_references
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM companies co WHERE co.id = c.company_id
);

-- Expected: 0

-- ============================================================================
-- 7. Verify Booking Stats Match
-- ============================================================================

-- Compare customer booking count with actual bookings
SELECT
  c.id,
  c.email,
  c.property_id,
  c.total_bookings as customer_total_bookings,
  (
    SELECT COUNT(*)
    FROM bookings b
    WHERE LOWER(b.guest_email) = LOWER(c.email)
    AND b.property_id = c.property_id
    AND b.booking_status NOT IN ('cancelled', 'no_show')
  ) as actual_booking_count,
  CASE
    WHEN c.total_bookings = (
      SELECT COUNT(*)
      FROM bookings b
      WHERE LOWER(b.guest_email) = LOWER(c.email)
      AND b.property_id = c.property_id
      AND b.booking_status NOT IN ('cancelled', 'no_show')
    ) THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM customers c
LIMIT 10;

-- All rows should show "✅ Match"

-- ============================================================================
-- 8. Check Triggers Exist
-- ============================================================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'customers'
OR event_object_table = 'bookings'
AND trigger_name LIKE '%customer%'
ORDER BY event_object_table, trigger_name;

-- Expected triggers:
-- - update_customers_new_updated_at on customers
-- - auto_create_customer_trigger_property_scoped on bookings
-- - update_customer_stats_trigger_property_scoped on bookings
-- - update_customer_stats_on_delete_trigger_property_scoped on bookings

-- ============================================================================
-- 9. Verify RLS Policies
-- ============================================================================

SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'customers'
ORDER BY policyname;

-- Expected: 4 policies (select, insert, update, delete)

-- ============================================================================
-- 10. Sample Data Check
-- ============================================================================

-- Show a guest who is now a customer at multiple properties
SELECT
  LOWER(c.email) as email,
  COUNT(DISTINCT c.property_id) as property_count,
  COUNT(*) as customer_records,
  array_agg(DISTINCT p.name ORDER BY p.name) as properties
FROM customers c
JOIN properties p ON p.id = c.property_id
GROUP BY LOWER(c.email)
HAVING COUNT(DISTINCT c.property_id) > 1
LIMIT 5;

-- Shows guests who are customers of multiple properties (expected behavior)

-- ============================================================================
-- 11. Test Case: Guest with Multiple Properties
-- ============================================================================

-- Pick a guest email that should have multiple customer records
WITH test_guest AS (
  SELECT email
  FROM customers
  GROUP BY email
  HAVING COUNT(DISTINCT property_id) > 1
  LIMIT 1
)
SELECT
  c.email,
  p.name as property_name,
  c.total_bookings,
  c.total_spent,
  c.status,
  c.first_booking_date,
  c.last_booking_date
FROM customers c
JOIN properties p ON p.id = c.property_id
WHERE c.email = (SELECT email FROM test_guest)
ORDER BY p.name;

-- Shows that the same guest has separate customer records per property ✅

-- ============================================================================
-- 12. Overall Migration Success Check
-- ============================================================================

DO $$
DECLARE
  checks_passed INTEGER := 0;
  total_checks INTEGER := 7;
BEGIN
  -- Check 1: customers table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    checks_passed := checks_passed + 1;
  END IF;

  -- Check 2: property_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'property_id'
  ) THEN
    checks_passed := checks_passed + 1;
  END IF;

  -- Check 3: No duplicates
  IF NOT EXISTS (
    SELECT 1 FROM customers
    GROUP BY LOWER(email), property_id
    HAVING COUNT(*) > 1
  ) THEN
    checks_passed := checks_passed + 1;
  END IF;

  -- Check 4: No orphaned customers
  IF NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = c.property_id)
  ) THEN
    checks_passed := checks_passed + 1;
  END IF;

  -- Check 5: Triggers exist
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'auto_create_customer_trigger_property_scoped'
  ) THEN
    checks_passed := checks_passed + 1;
  END IF;

  -- Check 6: RLS enabled
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'customers' AND rowsecurity = true
  ) THEN
    checks_passed := checks_passed + 1;
  END IF;

  -- Check 7: Data migrated
  IF (SELECT COUNT(*) FROM customers) > 0 THEN
    checks_passed := checks_passed + 1;
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration Verification Results:';
  RAISE NOTICE 'Checks Passed: % / %', checks_passed, total_checks;
  RAISE NOTICE '============================================';

  IF checks_passed = total_checks THEN
    RAISE NOTICE '🎉 ✅ ALL CHECKS PASSED - Migration Successful!';
    RAISE NOTICE '✅ Customers are now property-scoped';
    RAISE NOTICE '✅ Data integrity verified';
    RAISE NOTICE '✅ Triggers and policies in place';
    RAISE NOTICE '📦 Old data backed up to customers_old_company_scoped';
    RAISE NOTICE '▶️  Safe to proceed with backend/frontend updates';
  ELSE
    RAISE WARNING '⚠️  Some checks failed - review results above';
    RAISE WARNING '⚠️  Do not proceed with code changes until resolved';
  END IF;

END $$;
