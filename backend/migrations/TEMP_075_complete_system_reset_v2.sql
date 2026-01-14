-- ============================================================================
-- TEMPORARY MIGRATION: Complete System Reset (v2 - Safe for Missing Tables)
-- ============================================================================
-- Description: Deletes ALL data from the system except super admin users
-- Date: 2026-01-12
--
-- WARNING: THIS IS EXTREMELY DESTRUCTIVE
-- This will delete:
-- - All bookings and related data
-- - All properties, rooms, and related data
-- - All companies and related data
-- - All invoices, checkouts (if they exist)
-- - All non-super-admin users and their data
--
-- ONLY KEEPS:
-- - Super admin users
-- - System configuration (subscription types, user types, permissions)
--
-- This version safely handles tables that don't exist yet
-- ============================================================================

-- ============================================================================
-- STEP 1: Complete system reset function (handles missing tables)
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
  v_table_exists BOOLEAN;
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

  -- Check and delete booking_payments
  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_payments'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.booking_payments;
    DELETE FROM public.booking_payments;
    RETURN QUERY SELECT v_step, 'Delete booking_payments', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % booking_payments', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete booking_payments', 0, 'SKIPPED (table does not exist)';
    RAISE NOTICE 'Step %: Skipped booking_payments (table does not exist)', v_step;
  END IF;

  -- Check and delete booking_addons
  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_addons'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.booking_addons;
    DELETE FROM public.booking_addons;
    RETURN QUERY SELECT v_step, 'Delete booking_addons', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % booking_addons', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete booking_addons', 0, 'SKIPPED (table does not exist)';
    RAISE NOTICE 'Step %: Skipped booking_addons (table does not exist)', v_step;
  END IF;

  -- Check and delete bookings
  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.bookings;
    DELETE FROM public.bookings;
    RETURN QUERY SELECT v_step, 'Delete bookings', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % bookings', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete bookings', 0, 'SKIPPED (table does not exist)';
    RAISE NOTICE 'Step %: Skipped bookings (table does not exist)', v_step;
  END IF;

  -- ========================================
  -- REVIEWS AND RATINGS (if exists)
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'review_responses'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.review_responses;
    DELETE FROM public.review_responses;
    RETURN QUERY SELECT v_step, 'Delete review_responses', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % review_responses', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete review_responses', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.reviews;
    DELETE FROM public.reviews;
    RETURN QUERY SELECT v_step, 'Delete reviews', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % reviews', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete reviews', 0, 'SKIPPED (table does not exist)';
  END IF;

  -- ========================================
  -- INVOICES AND FINANCIAL RECORDS
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoice_line_items'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.invoice_line_items;
    DELETE FROM public.invoice_line_items;
    RETURN QUERY SELECT v_step, 'Delete invoice_line_items', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % invoice_line_items', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete invoice_line_items', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'credit_notes'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.credit_notes;
    DELETE FROM public.credit_notes;
    RETURN QUERY SELECT v_step, 'Delete credit_notes', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % credit_notes', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete credit_notes', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.invoices;
    DELETE FROM public.invoices;
    RETURN QUERY SELECT v_step, 'Delete invoices', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % invoices', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete invoices', 0, 'SKIPPED (table does not exist)';
  END IF;

  -- ========================================
  -- CHECKOUTS AND PAYMENTS
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'checkouts'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.checkouts;
    DELETE FROM public.checkouts;
    RETURN QUERY SELECT v_step, 'Delete checkouts', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % checkouts', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete checkouts', 0, 'SKIPPED (table does not exist)';
  END IF;

  -- ========================================
  -- WISHLISTS (if exists)
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wishlists'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.wishlists;
    DELETE FROM public.wishlists;
    RETURN QUERY SELECT v_step, 'Delete wishlists', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % wishlists', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete wishlists', 0, 'SKIPPED (table does not exist)';
  END IF;

  -- ========================================
  -- CHAT AND MESSAGES (if exists)
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_messages'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.chat_messages;
    DELETE FROM public.chat_messages;
    RETURN QUERY SELECT v_step, 'Delete chat_messages', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % chat_messages', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete chat_messages', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_participants'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.chat_participants;
    DELETE FROM public.chat_participants;
    RETURN QUERY SELECT v_step, 'Delete chat_participants', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % chat_participants', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete chat_participants', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chats'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.chats;
    DELETE FROM public.chats;
    RETURN QUERY SELECT v_step, 'Delete chats', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % chats', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete chats', 0, 'SKIPPED (table does not exist)';
  END IF;

  -- ========================================
  -- PROPERTY-RELATED DATA
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'room_payment_rule_assignments'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.room_payment_rule_assignments;
    DELETE FROM public.room_payment_rule_assignments;
    RETURN QUERY SELECT v_step, 'Delete room_payment_rule_assignments', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % room_payment_rule_assignments', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete room_payment_rule_assignments', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'property_payment_rules'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.property_payment_rules;
    DELETE FROM public.property_payment_rules;
    RETURN QUERY SELECT v_step, 'Delete property_payment_rules', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % property_payment_rules', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete property_payment_rules', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'room_assignments'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.room_assignments;
    DELETE FROM public.room_assignments;
    RETURN QUERY SELECT v_step, 'Delete room_assignments', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % room_assignments', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete room_assignments', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'seasonal_rates'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.seasonal_rates;
    DELETE FROM public.seasonal_rates;
    RETURN QUERY SELECT v_step, 'Delete seasonal_rates', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % seasonal_rates', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete seasonal_rates', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'room_beds'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.room_beds;
    DELETE FROM public.room_beds;
    RETURN QUERY SELECT v_step, 'Delete room_beds', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % room_beds', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete room_beds', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.rooms;
    DELETE FROM public.rooms;
    RETURN QUERY SELECT v_step, 'Delete rooms', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % rooms', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete rooms', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'property_promotions'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.property_promotions;
    DELETE FROM public.property_promotions;
    RETURN QUERY SELECT v_step, 'Delete property_promotions', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % property_promotions', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete property_promotions', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'property_addons'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.property_addons;
    DELETE FROM public.property_addons;
    RETURN QUERY SELECT v_step, 'Delete property_addons', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % property_addons', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete property_addons', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'properties'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.properties;
    DELETE FROM public.properties;
    RETURN QUERY SELECT v_step, 'Delete properties', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % properties', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete properties', 0, 'SKIPPED (table does not exist)';
  END IF;

  -- ========================================
  -- COMPANY-RELATED DATA
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_team_members'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.company_team_members;
    DELETE FROM public.company_team_members;
    RETURN QUERY SELECT v_step, 'Delete company_team_members', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % company_team_members', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete company_team_members', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.companies;
    DELETE FROM public.companies;
    RETURN QUERY SELECT v_step, 'Delete companies', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % companies', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete companies', 0, 'SKIPPED (table does not exist)';
  END IF;

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
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notification_preferences'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.notification_preferences
    WHERE user_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name != 'super_admin'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'Delete notification_preferences (non-admin)', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % notification_preferences', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete notification_preferences (non-admin)', 0, 'SKIPPED (table does not exist)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.notifications
    WHERE user_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name != 'super_admin'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'Delete notifications (non-admin)', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % notifications', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete notifications (non-admin)', 0, 'SKIPPED (table does not exist)';
  END IF;

  -- ========================================
  -- AUDIT LOGS (NON-SUPER-ADMIN ACTORS)
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.audit_logs
    WHERE actor_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name != 'super_admin'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'Delete audit_logs (non-admin actors)', v_deleted_count, 'COMPLETED';
    RAISE NOTICE 'Step %: Deleted % audit_logs', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'Delete audit_logs (non-admin actors)', 0, 'SKIPPED (table does not exist)';
  END IF;

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

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXECUTION INSTRUCTIONS
-- ============================================================================

/*

STEP 1: Run the safe dry run query
-----------------------------------
Use the DRY_RUN_SAFE.sql file in the project root


STEP 2: Create a backup (CRITICAL!)
------------------------------------
Use Supabase Dashboard → Settings → Database → Create Backup


STEP 3: Load this function
---------------------------
Copy this entire file and paste into Supabase SQL Editor.
Click "Run" to create the function.

You should see: ✅ Function created successfully


STEP 4: Execute the reset
--------------------------
SELECT * FROM complete_system_reset();

This will show a table with each step and whether it was completed or skipped.


STEP 5: Verify results
-----------------------
SELECT u.email, ut.name as user_type
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id;

Should only show super admin users.


STEP 6: Clean up (optional)
----------------------------
DROP FUNCTION IF EXISTS complete_system_reset();

*/
