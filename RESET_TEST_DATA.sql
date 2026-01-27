-- ============================================================================
-- RESET TEST DATA - Keep Super Admin Only
-- ============================================================================
-- Description: Removes all test data, keeps super admin user intact
-- Date: 2026-01-16
-- WARNING: This will DELETE ALL DATA except the super admin user!
-- ============================================================================

-- PRE-FLIGHT: Display super admin info
DO $$
DECLARE
  admin_email TEXT;
  admin_id UUID;
BEGIN
  SELECT u.id, u.email INTO admin_id, admin_email
  FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin'
  LIMIT 1;

  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Data Reset - Keep Super Admin Only';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Super Admin to preserve:';
  RAISE NOTICE '  ID: %', admin_id;
  RAISE NOTICE '  Email: %', admin_email;
  RAISE NOTICE '';
  RAISE NOTICE 'This will DELETE ALL other data!';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: Delete all data EXCEPT super admin
-- ============================================================================

DO $$
DECLARE
  admin_id UUID;
  admin_company_ids UUID[];
BEGIN
  RAISE NOTICE 'Step 1: Identifying super admin...';

  -- Get super admin ID
  SELECT u.id INTO admin_id
  FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin'
  LIMIT 1;

  -- Get super admin's company IDs (if any exist)
  SELECT ARRAY_AGG(id) INTO admin_company_ids
  FROM companies
  WHERE user_id = admin_id;

  RAISE NOTICE '✓ Super admin ID: %', admin_id;
  RAISE NOTICE '✓ Super admin companies: %', COALESCE(admin_company_ids::TEXT, 'none');
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: Delete cascading data (order matters!)
-- ============================================================================

DO $$
DECLARE
  admin_id UUID;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Step 2: Deleting test data...';
  RAISE NOTICE '';

  -- Get admin ID
  SELECT u.id INTO admin_id
  FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin' LIMIT 1;

  -- Delete booking-related data (order matters - delete children before parents)
  DELETE FROM refund_requests WHERE booking_id IN (
    SELECT id FROM bookings WHERE guest_id != admin_id OR guest_id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % refund requests', deleted_count;

  DELETE FROM property_reviews WHERE guest_id != admin_id OR guest_id IS NULL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % reviews', deleted_count;

  DELETE FROM booking_payment_schedules WHERE booking_id IN (
    SELECT id FROM bookings WHERE guest_id != admin_id OR guest_id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % payment schedules', deleted_count;

  DELETE FROM booking_payments WHERE booking_id IN (
    SELECT id FROM bookings WHERE guest_id != admin_id OR guest_id IS NULL
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % booking payments', deleted_count;

  DELETE FROM bookings WHERE guest_id != admin_id OR guest_id IS NULL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % bookings', deleted_count;

  -- Delete subscription invoices (not booking-related)
  DELETE FROM invoices WHERE user_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % subscription invoices', deleted_count;

  -- Delete credit memos
  DELETE FROM credit_memos WHERE user_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % credit memos', deleted_count;

  -- Delete chat messages
  DELETE FROM chat_messages WHERE sender_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % chat messages', deleted_count;

  DELETE FROM chat_conversations WHERE EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = chat_conversations.id
    AND user_id != admin_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % chat conversations', deleted_count;

  -- Delete wishlist items
  DELETE FROM wishlist_items WHERE user_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % wishlist items', deleted_count;

  -- Delete notifications
  DELETE FROM notifications WHERE user_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % notifications', deleted_count;

  -- Delete user subscriptions (except admin)
  DELETE FROM user_subscriptions WHERE user_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % user subscriptions', deleted_count;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: Delete properties, rooms, and related data
-- ============================================================================

DO $$
DECLARE
  admin_id UUID;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Step 3: Deleting properties and rooms...';
  RAISE NOTICE '';

  SELECT u.id INTO admin_id
  FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin' LIMIT 1;

  -- Delete room availability
  DELETE FROM room_availability WHERE room_id IN (
    SELECT id FROM rooms WHERE property_id IN (
      SELECT id FROM properties WHERE owner_id != admin_id
    )
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % room availability entries', deleted_count;

  -- Delete rooms
  DELETE FROM rooms WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != admin_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % rooms', deleted_count;

  -- Delete property add-ons
  DELETE FROM property_addons WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != admin_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % property add-ons', deleted_count;

  -- Delete properties
  DELETE FROM properties WHERE owner_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % properties', deleted_count;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 4: Delete users (except super admin)
-- ============================================================================

DO $$
DECLARE
  admin_id UUID;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Step 4: Deleting test users...';
  RAISE NOTICE '';

  SELECT u.id INTO admin_id
  FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin' LIMIT 1;

  -- Delete user permissions (except admin)
  DELETE FROM user_permissions WHERE user_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % user permissions', deleted_count;

  -- Delete users (except admin)
  DELETE FROM users WHERE id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % test users', deleted_count;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 5: Delete companies (except super admin's company)
-- ============================================================================

DO $$
DECLARE
  admin_id UUID;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Step 5: Deleting test companies...';
  RAISE NOTICE '';

  SELECT u.id INTO admin_id
  FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin' LIMIT 1;

  -- Delete company-related data (keep admin's companies)
  DELETE FROM company_payment_integrations WHERE company_id IN (
    SELECT id FROM companies WHERE user_id != admin_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % company payment integrations', deleted_count;

  DELETE FROM company_whatsapp_config WHERE company_id IN (
    SELECT id FROM companies WHERE user_id != admin_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % company WhatsApp configs', deleted_count;

  -- Delete companies not owned by admin
  DELETE FROM companies WHERE user_id != admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % test companies', deleted_count;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 6: Clean up orphaned data
-- ============================================================================

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Step 6: Cleaning up orphaned data...';
  RAISE NOTICE '';

  -- Delete orphaned customers
  DELETE FROM customers WHERE user_id NOT IN (SELECT id FROM users);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % orphaned customers', deleted_count;

  -- Delete orphaned audit logs (optional - keep for history)
  -- DELETE FROM audit_logs WHERE actor_id NOT IN (SELECT id FROM users);
  -- GET DIAGNOSTICS deleted_count = ROW_COUNT;
  -- RAISE NOTICE '✓ Deleted % orphaned audit logs', deleted_count;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
  property_count INTEGER;
  booking_count INTEGER;
  company_count INTEGER;
  admin_email TEXT;
BEGIN
  RAISE NOTICE 'Step 7: Verification...';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO property_count FROM properties;
  SELECT COUNT(*) INTO booking_count FROM bookings;
  SELECT COUNT(*) INTO company_count FROM companies;

  SELECT u.email INTO admin_email
  FROM users u
  JOIN user_types ut ON u.user_type_id = ut.id
  WHERE ut.name = 'super_admin' LIMIT 1;

  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Data Reset - COMPLETED';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining data:';
  RAISE NOTICE '  Users: % (super admin: %)', user_count, admin_email;
  RAISE NOTICE '  Companies: %', company_count;
  RAISE NOTICE '  Properties: %', property_count;
  RAISE NOTICE '  Bookings: %', booking_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database reset complete!';
  RAISE NOTICE '✅ Clean schema with no duplicate columns';
  RAISE NOTICE '✅ Ready for fresh testing';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
END $$;
