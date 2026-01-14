-- ============================================================================
-- TEMPORARY MIGRATION: Complete System Reset
-- ============================================================================
-- Description: Deletes ALL data from the system except super admin users
-- Date: 2026-01-12
--
-- WARNING: THIS IS EXTREMELY DESTRUCTIVE
-- This will delete:
-- - All bookings and related data
-- - All properties, rooms, and related data
-- - All companies and related data
-- - All reviews, wishlists, invoices, checkouts
-- - All non-super-admin users and their data
--
-- ONLY KEEPS:
-- - Super admin users
-- - System configuration (subscription types, user types, permissions)
-- ============================================================================

-- ============================================================================
-- STEP 1: DRY RUN - Inspect what will be deleted
-- ============================================================================

-- Run this query first to see what will be deleted:
SELECT
  'Users to delete' as category,
  COUNT(*) as count
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name != 'super_admin'

UNION ALL

SELECT 'Properties to delete', COUNT(*) FROM public.properties

UNION ALL

SELECT 'Companies to delete', COUNT(*) FROM public.companies

UNION ALL

SELECT 'Bookings to delete', COUNT(*) FROM public.bookings

UNION ALL

SELECT 'Rooms to delete', COUNT(*) FROM public.rooms

UNION ALL

SELECT 'Reviews to delete', COUNT(*) FROM public.reviews

UNION ALL

SELECT 'Invoices to delete', COUNT(*) FROM public.invoices

UNION ALL

SELECT 'Checkouts to delete', COUNT(*) FROM public.checkouts

UNION ALL

SELECT 'Wishlists to delete', COUNT(*) FROM public.wishlists

UNION ALL

SELECT 'User subscriptions to delete', COUNT(*) FROM public.user_subscriptions;

-- ============================================================================
-- STEP 2: Create backup function (optional but recommended)
-- ============================================================================

CREATE OR REPLACE FUNCTION backup_system_data()
RETURNS TABLE(
  backup_summary TEXT
) AS $$
BEGIN
  -- This is a placeholder - you should use pg_dump for real backups
  RETURN QUERY SELECT 'Please use pg_dump to create a backup before proceeding' as backup_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Complete system reset function
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_system_reset()
RETURNS TABLE(
  step_number INT,
  step_name TEXT,
  records_deleted INT,
  status TEXT
) AS $$
DECLARE
  v_deleted_count INT;
  v_step INT := 0;
BEGIN
  -- Safety check: Ensure super admin exists
  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: No super admin user found. Aborting.';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting Complete System Reset';
  RAISE NOTICE '========================================';

  -- ========================================
  -- BOOKINGS AND RELATED DATA
  -- ========================================

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.booking_payments;
  DELETE FROM public.booking_payments;
  RETURN QUERY SELECT v_step, 'Delete booking_payments', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % booking_payments', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.booking_addons;
  DELETE FROM public.booking_addons;
  RETURN QUERY SELECT v_step, 'Delete booking_addons', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % booking_addons', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.bookings;
  DELETE FROM public.bookings;
  RETURN QUERY SELECT v_step, 'Delete bookings', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % bookings', v_step, v_deleted_count;

  -- ========================================
  -- REVIEWS AND RATINGS
  -- ========================================

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.review_responses;
  DELETE FROM public.review_responses;
  RETURN QUERY SELECT v_step, 'Delete review_responses', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % review_responses', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.reviews;
  DELETE FROM public.reviews;
  RETURN QUERY SELECT v_step, 'Delete reviews', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % reviews', v_step, v_deleted_count;

  -- ========================================
  -- INVOICES AND FINANCIAL RECORDS
  -- ========================================

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.invoice_line_items;
  DELETE FROM public.invoice_line_items;
  RETURN QUERY SELECT v_step, 'Delete invoice_line_items', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % invoice_line_items', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.credit_notes;
  DELETE FROM public.credit_notes;
  RETURN QUERY SELECT v_step, 'Delete credit_notes', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % credit_notes', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.invoices;
  DELETE FROM public.invoices;
  RETURN QUERY SELECT v_step, 'Delete invoices', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % invoices', v_step, v_deleted_count;

  -- ========================================
  -- CHECKOUTS AND PAYMENTS
  -- ========================================

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.checkouts;
  DELETE FROM public.checkouts;
  RETURN QUERY SELECT v_step, 'Delete checkouts', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % checkouts', v_step, v_deleted_count;

  -- ========================================
  -- WISHLISTS
  -- ========================================

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.wishlists;
  DELETE FROM public.wishlists;
  RETURN QUERY SELECT v_step, 'Delete wishlists', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % wishlists', v_step, v_deleted_count;

  -- ========================================
  -- CHAT AND MESSAGES
  -- ========================================

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.chat_messages;
  DELETE FROM public.chat_messages;
  RETURN QUERY SELECT v_step, 'Delete chat_messages', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % chat_messages', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.chat_participants;
  DELETE FROM public.chat_participants;
  RETURN QUERY SELECT v_step, 'Delete chat_participants', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % chat_participants', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.chats;
  DELETE FROM public.chats;
  RETURN QUERY SELECT v_step, 'Delete chats', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % chats', v_step, v_deleted_count;

  -- ========================================
  -- PROPERTY-RELATED DATA
  -- ========================================

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.room_payment_rule_assignments;
  DELETE FROM public.room_payment_rule_assignments;
  RETURN QUERY SELECT v_step, 'Delete room_payment_rule_assignments', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % room_payment_rule_assignments', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.property_payment_rules;
  DELETE FROM public.property_payment_rules;
  RETURN QUERY SELECT v_step, 'Delete property_payment_rules', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % property_payment_rules', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.room_assignments;
  DELETE FROM public.room_assignments;
  RETURN QUERY SELECT v_step, 'Delete room_assignments', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % room_assignments', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.seasonal_rates;
  DELETE FROM public.seasonal_rates;
  RETURN QUERY SELECT v_step, 'Delete seasonal_rates', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % seasonal_rates', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.room_beds;
  DELETE FROM public.room_beds;
  RETURN QUERY SELECT v_step, 'Delete room_beds', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % room_beds', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.rooms;
  DELETE FROM public.rooms;
  RETURN QUERY SELECT v_step, 'Delete rooms', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % rooms', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.property_promotions;
  DELETE FROM public.property_promotions;
  RETURN QUERY SELECT v_step, 'Delete property_promotions', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % property_promotions', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.property_addons;
  DELETE FROM public.property_addons;
  RETURN QUERY SELECT v_step, 'Delete property_addons', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % property_addons', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.properties;
  DELETE FROM public.properties;
  RETURN QUERY SELECT v_step, 'Delete properties', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % properties', v_step, v_deleted_count;

  -- ========================================
  -- COMPANY-RELATED DATA
  -- ========================================

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.company_team_members;
  DELETE FROM public.company_team_members;
  RETURN QUERY SELECT v_step, 'Delete company_team_members', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % company_team_members', v_step, v_deleted_count;

  v_step := v_step + 1;
  SELECT COUNT(*) INTO v_deleted_count FROM public.companies;
  DELETE FROM public.companies;
  RETURN QUERY SELECT v_step, 'Delete companies', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % companies', v_step, v_deleted_count;

  -- ========================================
  -- USER-RELATED DATA (NON-SUPER-ADMIN)
  -- ========================================

  v_step := v_step + 1;
  DELETE FROM public.user_subscriptions
  WHERE user_id IN (
    SELECT u.id FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, 'Delete user_subscriptions (non-admin)', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % user_subscriptions', v_step, v_deleted_count;

  v_step := v_step + 1;
  DELETE FROM public.user_permissions
  WHERE user_id IN (
    SELECT u.id FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, 'Delete user_permissions (non-admin)', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % user_permissions', v_step, v_deleted_count;

  v_step := v_step + 1;
  DELETE FROM public.notification_preferences
  WHERE user_id IN (
    SELECT u.id FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, 'Delete notification_preferences (non-admin)', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % notification_preferences', v_step, v_deleted_count;

  v_step := v_step + 1;
  DELETE FROM public.notifications
  WHERE user_id IN (
    SELECT u.id FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, 'Delete notifications (non-admin)', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % notifications', v_step, v_deleted_count;

  -- ========================================
  -- AUDIT LOGS (NON-SUPER-ADMIN ACTORS)
  -- ========================================

  v_step := v_step + 1;
  DELETE FROM public.audit_logs
  WHERE actor_id IN (
    SELECT u.id FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, 'Delete audit_logs (non-admin actors)', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % audit_logs', v_step, v_deleted_count;

  -- ========================================
  -- USERS (NON-SUPER-ADMIN)
  -- ========================================

  v_step := v_step + 1;
  DELETE FROM public.users
  WHERE user_type_id IN (
    SELECT id FROM public.user_types WHERE name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, 'Delete users (non-super-admin)', v_deleted_count, 'COMPLETED';
  RAISE NOTICE 'Step %: Deleted % non-super-admin users', v_step, v_deleted_count;

  -- ========================================
  -- FINAL SUMMARY
  -- ========================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'System Reset Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Remaining super admin users:';

  -- Show remaining users
  FOR v_step IN
    SELECT COUNT(*) FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name = 'super_admin'
  LOOP
    RAISE NOTICE '  Super admins remaining: %', v_step;
  END LOOP;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXECUTION INSTRUCTIONS
-- ============================================================================

/*

STEP 1: Review what will be deleted (DRY RUN)
----------------------------------------------
Run the SELECT query at the top of this file to see counts of all data that will be deleted.


STEP 2: Create a backup (CRITICAL!)
------------------------------------
pg_dump -U your_user -d your_database -F c -b -v -f "backup_before_reset_$(date +%Y%m%d_%H%M%S).backup"

Or use Supabase dashboard to create a backup.


STEP 3: Execute the reset
--------------------------
SELECT * FROM complete_system_reset();

This will:
- Delete ALL bookings, properties, companies, reviews, invoices, etc.
- Delete ALL non-super-admin users
- Keep only super admin users and system configuration


STEP 4: Verify the results
---------------------------
-- Check remaining users
SELECT u.email, ut.name as user_type
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
ORDER BY ut.name, u.email;

-- Check data is cleared
SELECT 'Properties' as table_name, COUNT(*) FROM public.properties
UNION ALL
SELECT 'Bookings', COUNT(*) FROM public.bookings
UNION ALL
SELECT 'Companies', COUNT(*) FROM public.companies
UNION ALL
SELECT 'Users (non-admin)', COUNT(*) FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name != 'super_admin';


STEP 5: Clean up functions (optional)
--------------------------------------
DROP FUNCTION IF EXISTS complete_system_reset();
DROP FUNCTION IF EXISTS backup_system_data();

*/

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================

-- Check super admin exists before allowing execution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name = 'super_admin'
  ) THEN
    RAISE EXCEPTION '❌ SAFETY CHECK FAILED: No super admin user found!';
  ELSE
    RAISE NOTICE '✅ Safety check passed: Super admin user exists';
  END IF;
END $$;
