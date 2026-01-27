-- ============================================================================
-- RESET DATABASE - Keep Only Super Admin
-- ============================================================================
-- WARNING: This will permanently delete ALL users (except super admin),
-- ALL customers, and related data like bookings, conversations, etc.
-- Created: 2026-01-25
-- ============================================================================

-- STEP 1: Identify Super Admin
-- ============================================================================
SELECT
  u.id,
  u.email,
  u.full_name,
  u.user_type_id,
  r.name as role
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name = 'super_admin';

-- STEP 2: Preview what will be deleted
-- ============================================================================

-- Users to delete (all except super admin)
SELECT
  'Users to delete' as item,
  COUNT(*) as count
FROM users
WHERE id NOT IN (
  SELECT ur.user_id
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.name = 'super_admin'
);

-- Customers to delete
SELECT
  'Customers to delete' as item,
  COUNT(*) as count
FROM customers;

-- STEP 3: DELETE ALL DATA (EXCEPT SUPER ADMIN)
-- ============================================================================

BEGIN;

-- Set session to replica mode to disable triggers (including system triggers)
SET session_replication_role = 'replica';

DO $$
DECLARE
  super_admin_id UUID;
  deleted_count INTEGER;
BEGIN
  -- Get super admin user ID
  SELECT ur.user_id INTO super_admin_id
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.name = 'super_admin'
  LIMIT 1;

  IF super_admin_id IS NULL THEN
    RAISE EXCEPTION 'No super admin found! Aborting to prevent deleting all users.';
  END IF;

  RAISE NOTICE 'Super admin ID: %', super_admin_id;
  RAISE NOTICE 'Session set to replica mode - triggers disabled';
  RAISE NOTICE 'Starting deletion...';

  -- Delete from chat tables (if they exist)
  BEGIN
    DELETE FROM chat_messages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat messages', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ chat_messages table does not exist, skipping';
  END;

  BEGIN
    DELETE FROM chat_participants;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat participants', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ chat_participants table does not exist, skipping';
  END;

  BEGIN
    DELETE FROM chat_reactions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat reactions', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ chat_reactions table does not exist, skipping';
  END;

  BEGIN
    DELETE FROM chat_attachments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat attachments', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ chat_attachments table does not exist, skipping';
  END;

  BEGIN
    DELETE FROM chat_conversations;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat conversations', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ chat_conversations table does not exist, skipping';
  END;

  -- Delete support tickets
  BEGIN
    DELETE FROM support_tickets;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % support tickets', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ support_tickets table does not exist, skipping';
  END;

  -- Delete bookings
  BEGIN
    DELETE FROM bookings;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % bookings', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ bookings table does not exist, skipping';
  END;

  -- Delete property reviews
  BEGIN
    DELETE FROM property_reviews;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % property reviews', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ property_reviews table does not exist, skipping';
  END;

  -- Delete invoices
  BEGIN
    DELETE FROM invoices;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % invoices', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ invoices table does not exist, skipping';
  END;

  -- Delete payment schedules
  BEGIN
    DELETE FROM payment_schedules;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % payment schedules', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ payment_schedules table does not exist, skipping';
  END;

  -- Delete payments
  BEGIN
    DELETE FROM payments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % payments', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ payments table does not exist, skipping';
  END;

  -- Delete refunds
  BEGIN
    DELETE FROM refunds;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % refunds', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ refunds table does not exist, skipping';
  END;

  -- Delete customers
  BEGIN
    DELETE FROM customers;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % customers', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ customers table does not exist, skipping';
  END;

  -- Delete rooms
  BEGIN
    DELETE FROM rooms;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % rooms', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ rooms table does not exist, skipping';
  END;

  -- Delete addons
  BEGIN
    DELETE FROM addons;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % addons', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ addons table does not exist, skipping';
  END;

  -- Delete promotions
  BEGIN
    DELETE FROM promotions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % promotions', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ promotions table does not exist, skipping';
  END;

  -- Delete property websites
  BEGIN
    DELETE FROM property_website_pages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % property website pages', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ property_website_pages table does not exist, skipping';
  END;

  BEGIN
    DELETE FROM property_websites;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % property websites', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ property_websites table does not exist, skipping';
  END;

  -- Delete properties
  BEGIN
    DELETE FROM properties;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % properties', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ properties table does not exist, skipping';
  END;

  -- Delete subscriptions
  BEGIN
    DELETE FROM subscriptions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % subscriptions', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ subscriptions table does not exist, skipping';
  END;

  -- Delete companies
  BEGIN
    DELETE FROM companies;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % companies', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ companies table does not exist, skipping';
  END;

  -- Delete user sessions/tokens for non-admin users
  BEGIN
    DELETE FROM user_sessions WHERE user_id != super_admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % user sessions for non-admin users', deleted_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '⊘ user_sessions table does not exist, skipping';
  END;

  -- Delete user_roles for non-admin users
  DELETE FROM user_roles WHERE user_id != super_admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % user roles for non-admin users', deleted_count;

  -- Delete all users EXCEPT super admin
  DELETE FROM users WHERE id != super_admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % users (kept super admin)', deleted_count;

  RAISE NOTICE 'Deletion complete.';
END $$;

-- Reset session back to normal (re-enable triggers)
SET session_replication_role = 'origin';

-- STEP 4: Verify Results
-- ============================================================================
DO $$
DECLARE
  user_count INTEGER;
  customer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;

  BEGIN
    SELECT COUNT(*) INTO customer_count FROM customers;
  EXCEPTION WHEN undefined_table THEN
    customer_count := 0;
  END;

  RAISE NOTICE '=== CLEANUP SUMMARY ===';
  RAISE NOTICE 'Remaining users: %', user_count;
  RAISE NOTICE 'Remaining customers: %', customer_count;

  IF user_count = 1 THEN
    RAISE NOTICE '✓ SUCCESS: System reset to super admin only';
  ELSE
    RAISE WARNING 'Warning: % users remain (expected 1)', user_count;
  END IF;
END $$;

-- IMPORTANT: Review the output above, then choose:
-- COMMIT; -- To save the deletion
-- ROLLBACK; -- To undo everything

-- Uncomment ONE of the lines below:
COMMIT;
-- ROLLBACK;

-- ============================================================================
-- VERIFICATION QUERIES (run after COMMIT)
-- ============================================================================

-- Check remaining user (should be only super admin)
SELECT
  u.id,
  u.email,
  u.full_name,
  u.user_type_id,
  r.name as role,
  u.created_at
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id;
