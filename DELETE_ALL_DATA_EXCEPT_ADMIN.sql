-- ============================================================================
-- PRODUCTION SCRIPT: Delete All Data Except Super Admin's Business
-- ============================================================================
-- Description: Deletes ALL data except super admin user, company, properties, rooms
-- Date: 2026-01-12
--
-- ⚠️  EXTREMELY DESTRUCTIVE - USE WITH CAUTION ⚠️
--
-- WILL DELETE:
-- - All bookings, payments, and related transactional data
-- - All properties, rooms, and companies NOT owned by super admin
-- - All invoices, checkouts, credit notes
-- - All reviews, wishlists, and chats
-- - All non-super-admin users and their data
--
-- WILL PRESERVE:
-- - Super admin users ✅
-- - Super admin's companies ✅
-- - Super admin's properties ✅
-- - Super admin's rooms ✅
-- - Super admin's property addons, promotions, payment rules ✅
-- - System configuration (subscription types, user types, permissions) ✅
-- - Locations (countries, provinces, cities) ✅
--
-- PREREQUISITES:
-- 1. ✅ Run VERIFY_SUPER_ADMIN.sql and confirm your data shows up
-- 2. ✅ Run DRY_RUN_DATA_DELETION.sql and review counts
-- 3. ✅ Create a backup in Supabase (Settings → Database → Create Backup)
-- ============================================================================

-- ============================================================================
-- Create helper function to identify super admin properties
-- ============================================================================

CREATE OR REPLACE FUNCTION is_super_admin_property(p_property_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if property belongs to super admin (via company)
  SELECT EXISTS (
    SELECT 1
    FROM public.properties p
    JOIN public.companies c ON p.company_id = c.id
    JOIN public.users u ON c.user_id = u.id
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE p.id = p_property_id
      AND ut.name = 'super_admin'
  ) INTO v_is_admin;

  RETURN v_is_admin;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Main deletion function
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_all_data_except_super_admin()
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
  v_super_admin_count INT;
  v_preserved_companies INT;
  v_preserved_properties INT;
  v_preserved_rooms INT;
BEGIN
  -- ========================================
  -- SAFETY CHECK: Verify super admin exists
  -- ========================================

  SELECT COUNT(*) INTO v_super_admin_count
  FROM public.users u
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin';

  IF v_super_admin_count = 0 THEN
    RAISE EXCEPTION '🛑 SAFETY CHECK FAILED: No super admin user found. Aborting deletion to prevent lockout.';
  END IF;

  RAISE NOTICE '✅ Safety check passed: % super admin(s) found', v_super_admin_count;

  -- Count what will be preserved
  SELECT COUNT(*) INTO v_preserved_companies
  FROM public.companies c
  JOIN public.users u ON c.user_id = u.id
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin'
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies');

  SELECT COUNT(*) INTO v_preserved_properties
  FROM public.properties p
  JOIN public.companies c ON p.company_id = c.id
  JOIN public.users u ON c.user_id = u.id
  JOIN public.user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin'
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties');

  SELECT COUNT(*) INTO v_preserved_rooms
  FROM public.rooms r
  WHERE is_super_admin_property(r.property_id)
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting Selective Data Deletion';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔒 Will preserve: % companies, % properties, % rooms', v_preserved_companies, v_preserved_properties, v_preserved_rooms;
  RAISE NOTICE '========================================';

  -- ========================================
  -- SECTION 1: BOOKINGS AND PAYMENTS (ALL)
  -- Note: Deleting ALL bookings regardless of property ownership
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_payments'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.booking_payments;
    DELETE FROM public.booking_payments;
    RETURN QUERY SELECT v_step, 'booking_payments (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % booking_payments', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'booking_payments', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_addons'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.booking_addons;
    DELETE FROM public.booking_addons;
    RETURN QUERY SELECT v_step, 'booking_addons (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % booking_addons', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'booking_addons', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.bookings;
    DELETE FROM public.bookings;
    RETURN QUERY SELECT v_step, 'bookings (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % bookings', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'bookings', 0, 'SKIPPED (table not found)';
  END IF;

  -- ========================================
  -- SECTION 2: REVIEWS (ALL)
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'review_responses'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.review_responses;
    DELETE FROM public.review_responses;
    RETURN QUERY SELECT v_step, 'review_responses (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % review_responses', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'review_responses', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.reviews;
    DELETE FROM public.reviews;
    RETURN QUERY SELECT v_step, 'reviews (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % reviews', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'reviews', 0, 'SKIPPED (table not found)';
  END IF;

  -- ========================================
  -- SECTION 3: INVOICES (ALL)
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoice_line_items'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.invoice_line_items;
    DELETE FROM public.invoice_line_items;
    RETURN QUERY SELECT v_step, 'invoice_line_items (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % invoice_line_items', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'invoice_line_items', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'credit_notes'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.credit_notes;
    DELETE FROM public.credit_notes;
    RETURN QUERY SELECT v_step, 'credit_notes (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % credit_notes', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'credit_notes', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.invoices;
    DELETE FROM public.invoices;
    RETURN QUERY SELECT v_step, 'invoices (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % invoices', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'invoices', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'checkouts'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.checkouts;
    DELETE FROM public.checkouts;
    RETURN QUERY SELECT v_step, 'checkouts (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % checkouts', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'checkouts', 0, 'SKIPPED (table not found)';
  END IF;

  -- ========================================
  -- SECTION 4: WISHLISTS (ALL)
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wishlists'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.wishlists;
    DELETE FROM public.wishlists;
    RETURN QUERY SELECT v_step, 'wishlists (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % wishlists', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'wishlists', 0, 'SKIPPED (table not found)';
  END IF;

  -- ========================================
  -- SECTION 5: CHAT (ALL)
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_messages'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.chat_messages;
    DELETE FROM public.chat_messages;
    RETURN QUERY SELECT v_step, 'chat_messages (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % chat_messages', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'chat_messages', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_participants'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.chat_participants;
    DELETE FROM public.chat_participants;
    RETURN QUERY SELECT v_step, 'chat_participants (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % chat_participants', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'chat_participants', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chats'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    SELECT COUNT(*) INTO v_deleted_count FROM public.chats;
    DELETE FROM public.chats;
    RETURN QUERY SELECT v_step, 'chats (all)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % chats', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'chats', 0, 'SKIPPED (table not found)';
  END IF;

  -- ========================================
  -- SECTION 6: NON-ADMIN PROPERTY DATA
  -- Delete property-related data for NON-admin properties only
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'room_payment_rule_assignments'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.room_payment_rule_assignments
    WHERE room_id IN (
      SELECT r.id FROM public.rooms r
      WHERE NOT is_super_admin_property(r.property_id)
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'room_payment_rule_assignments (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % room_payment_rule_assignments', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'room_payment_rule_assignments', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'property_payment_rules'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.property_payment_rules
    WHERE property_id IN (
      SELECT p.id FROM public.properties p
      WHERE NOT is_super_admin_property(p.id)
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'property_payment_rules (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % property_payment_rules', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'property_payment_rules', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'room_assignments'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.room_assignments
    WHERE room_id IN (
      SELECT r.id FROM public.rooms r
      WHERE NOT is_super_admin_property(r.property_id)
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'room_assignments (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % room_assignments', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'room_assignments', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'seasonal_rates'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.seasonal_rates
    WHERE room_id IN (
      SELECT r.id FROM public.rooms r
      WHERE NOT is_super_admin_property(r.property_id)
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'seasonal_rates (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % seasonal_rates', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'seasonal_rates', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'room_beds'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.room_beds
    WHERE room_id IN (
      SELECT r.id FROM public.rooms r
      WHERE NOT is_super_admin_property(r.property_id)
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'room_beds (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % room_beds', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'room_beds', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rooms'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.rooms
    WHERE NOT is_super_admin_property(property_id);
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, '🏠 rooms (non-admin only)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] ⚠️  Deleted % non-admin rooms (preserved admin rooms)', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'rooms', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'property_promotions'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.property_promotions
    WHERE property_id IN (
      SELECT p.id FROM public.properties p
      WHERE NOT is_super_admin_property(p.id)
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'property_promotions (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % property_promotions', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'property_promotions', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'property_addons'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.property_addons
    WHERE property_id IN (
      SELECT p.id FROM public.properties p
      WHERE NOT is_super_admin_property(p.id)
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'property_addons (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % property_addons', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'property_addons', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'properties'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.properties p
    WHERE NOT is_super_admin_property(p.id);
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, '🏢 properties (non-admin only)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] ⚠️  Deleted % non-admin properties (preserved admin properties)', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'properties', 0, 'SKIPPED (table not found)';
  END IF;

  -- ========================================
  -- SECTION 7: NON-ADMIN COMPANIES
  -- ========================================

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'company_team_members'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.company_team_members
    WHERE company_id IN (
      SELECT c.id FROM public.companies c
      JOIN public.users u ON c.user_id = u.id
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name != 'super_admin'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, 'company_team_members (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % company_team_members', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'company_team_members', 0, 'SKIPPED (table not found)';
  END IF;

  v_step := v_step + 1;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    DELETE FROM public.companies c
    WHERE c.user_id IN (
      SELECT u.id FROM public.users u
      JOIN public.user_types ut ON u.user_type_id = ut.id
      WHERE ut.name != 'super_admin'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN QUERY SELECT v_step, '🏭 companies (non-admin only)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] ⚠️  Deleted % non-admin companies (preserved admin companies)', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'companies', 0, 'SKIPPED (table not found)';
  END IF;

  -- ========================================
  -- SECTION 8: NON-ADMIN USER DATA
  -- ========================================

  v_step := v_step + 1;
  DELETE FROM public.user_subscriptions
  WHERE user_id IN (
    SELECT u.id FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, 'user_subscriptions (non-admin)', v_deleted_count, 'DELETED';
  RAISE NOTICE '[%] Deleted % user_subscriptions', v_step, v_deleted_count;

  v_step := v_step + 1;
  DELETE FROM public.user_permissions
  WHERE user_id IN (
    SELECT u.id FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE ut.name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, 'user_permissions (non-admin)', v_deleted_count, 'DELETED';
  RAISE NOTICE '[%] Deleted % user_permissions', v_step, v_deleted_count;

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
    RETURN QUERY SELECT v_step, 'notification_preferences (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % notification_preferences', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'notification_preferences', 0, 'SKIPPED (table not found)';
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
    RETURN QUERY SELECT v_step, 'notifications (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % notifications', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'notifications', 0, 'SKIPPED (table not found)';
  END IF;

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
    RETURN QUERY SELECT v_step, 'audit_logs (non-admin)', v_deleted_count, 'DELETED';
    RAISE NOTICE '[%] Deleted % audit_logs', v_step, v_deleted_count;
  ELSE
    RETURN QUERY SELECT v_step, 'audit_logs', 0, 'SKIPPED (table not found)';
  END IF;

  -- ========================================
  -- SECTION 9: DELETE NON-ADMIN USERS
  -- ========================================

  v_step := v_step + 1;
  DELETE FROM public.users
  WHERE user_type_id IN (
    SELECT id FROM public.user_types WHERE name != 'super_admin'
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN QUERY SELECT v_step, '👤 USERS (non-super-admin)', v_deleted_count, 'DELETED';
  RAISE NOTICE '[%] ⚠️  Deleted % non-super-admin users', v_step, v_deleted_count;

  -- ========================================
  -- FINAL SUMMARY
  -- ========================================

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Selective Data Deletion Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔒 Super admin users preserved: %', v_super_admin_count;
  RAISE NOTICE '🔒 Companies preserved: %', v_preserved_companies;
  RAISE NOTICE '🔒 Properties preserved: %', v_preserved_properties;
  RAISE NOTICE '🔒 Rooms preserved: %', v_preserved_rooms;
  RAISE NOTICE '========================================';

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXECUTION INSTRUCTIONS
-- ============================================================================

/*

📋 STEP-BY-STEP GUIDE
=====================

STEP 1: Verify Super Admin & Their Data ✅
-------------------------------------------
Run VERIFY_SUPER_ADMIN.sql first.
Make sure you see:
- Your admin account
- Your company
- Your properties
- Your rooms


STEP 2: Dry Run Preview 👀
---------------------------
Run DRY_RUN_DATA_DELETION.sql
Review what will be preserved vs deleted


STEP 3: Create Database Backup 💾 (CRITICAL!)
----------------------------------------------
Supabase Dashboard → Settings → Database → Create Backup


STEP 4: Load Helper Function 🔧
--------------------------------
Copy this entire file and paste into Supabase SQL Editor
Click "Run"
You should see: ✅ Success. No rows returned


STEP 5: Execute the Deletion 🔴
--------------------------------
Run this command:

    SELECT * FROM delete_all_data_except_super_admin();

This will show a table with progress for each step.


STEP 6: Verify Results ✅
--------------------------
Check your preserved data:

    -- Check users (should only be super admin)
    SELECT u.email, ut.name FROM users u
    JOIN user_types ut ON u.user_type_id = ut.id;

    -- Check companies (should be your company)
    SELECT * FROM companies;

    -- Check properties (should be your properties)
    SELECT * FROM properties;

    -- Check rooms (should be your rooms)
    SELECT * FROM rooms;


STEP 7: Clean Up (Optional) 🧹
-------------------------------
DROP FUNCTION IF EXISTS delete_all_data_except_super_admin();
DROP FUNCTION IF EXISTS is_super_admin_property(UUID);

*/
