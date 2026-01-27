-- ============================================================================
-- DATABASE CLEANUP SCRIPT - Remove All Transactional Data (FIXED VERSION)
-- ============================================================================
-- Purpose: Clean database for fresh testing while preserving:
--   - Super admin account(s)
--   - Subscription plans
--   - Website templates
--   - System configuration
--
-- ⚠️ WARNING: This deletes ALL user data, bookings, invoices, messages, etc.
-- Only run this in development/testing environments!
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Identify Super Admin(s) to Preserve
-- ============================================================================

-- Check which users are super admins (will be preserved)
DO $$
DECLARE
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO super_admin_count
  FROM public.users
  WHERE is_super_admin = TRUE;

  RAISE NOTICE 'Found % super admin account(s) - these will be preserved', super_admin_count;

  IF super_admin_count = 0 THEN
    RAISE EXCEPTION 'No super admin found! Create one before running cleanup.';
  END IF;
END $$;

-- Show super admin details
SELECT
  id,
  email,
  full_name,
  is_super_admin,
  created_at
FROM public.users
WHERE is_super_admin = TRUE;

-- ============================================================================
-- STEP 2: Delete Transactional Data (Bottom-Up - Respecting Foreign Keys)
-- ============================================================================

-- Chat & Communication
DO $$ BEGIN RAISE NOTICE 'Cleaning up chat and communication data...'; END $$;
DELETE FROM public.messages WHERE 1=1;
DELETE FROM public.conversations WHERE 1=1;
DELETE FROM public.whatsapp_messages WHERE 1=1;
DELETE FROM public.notifications WHERE 1=1;

-- Reviews
DO $$ BEGIN RAISE NOTICE 'Cleaning up reviews...'; END $$;
DELETE FROM public.review_responses WHERE 1=1;
DELETE FROM public.reviews WHERE 1=1;

-- Bookings & Related
DO $$ BEGIN RAISE NOTICE 'Cleaning up bookings and related data...'; END $$;
DELETE FROM public.payment_schedules WHERE 1=1;
DELETE FROM public.booking_addons WHERE 1=1;
DELETE FROM public.booking_payments WHERE 1=1;
DELETE FROM public.bookings WHERE 1=1;

-- Invoices & Credits
DO $$ BEGIN RAISE NOTICE 'Cleaning up invoices and credits...'; END $$;
DELETE FROM public.credit_memos WHERE 1=1;
DELETE FROM public.credit_notes WHERE 1=1;
DELETE FROM public.invoices WHERE 1=1;

-- Refunds
DO $$ BEGIN RAISE NOTICE 'Cleaning up refunds...'; END $$;
DELETE FROM public.refund_requests WHERE 1=1;

-- Payments & Checkouts
DO $$ BEGIN RAISE NOTICE 'Cleaning up payments and checkouts...'; END $$;
DELETE FROM public.payments WHERE 1=1;
DELETE FROM public.checkouts WHERE 1=1;

-- Subscriptions
DO $$ BEGIN RAISE NOTICE 'Cleaning up subscriptions...'; END $$;
DELETE FROM public.subscription_upgrade_requests WHERE 1=1;
DELETE FROM public.subscriptions WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);

-- Properties & Rooms
DO $$ BEGIN RAISE NOTICE 'Cleaning up properties and rooms...'; END $$;
DELETE FROM public.room_payment_rules WHERE 1=1;
DELETE FROM public.rooms WHERE 1=1;
DELETE FROM public.property_amenities WHERE 1=1;
DELETE FROM public.property_images WHERE 1=1;
DELETE FROM public.property_websites WHERE 1=1;
DELETE FROM public.properties WHERE 1=1;

-- Promotions
DO $$ BEGIN RAISE NOTICE 'Cleaning up promotions...'; END $$;
DELETE FROM public.promo_claims WHERE 1=1;
DELETE FROM public.promotion_usage WHERE 1=1;
DELETE FROM public.promotions WHERE 1=1;

-- Add-ons
DO $$ BEGIN RAISE NOTICE 'Cleaning up add-ons...'; END $$;
DELETE FROM public.addons WHERE 1=1;

-- Customers & Wishlists
DO $$ BEGIN RAISE NOTICE 'Cleaning up customers and wishlists...'; END $$;
DELETE FROM public.wishlist_items WHERE 1=1;
DELETE FROM public.customers WHERE 1=1;

-- Support Tickets
DO $$ BEGIN RAISE NOTICE 'Cleaning up support tickets...'; END $$;
DELETE FROM public.support_ticket_messages WHERE 1=1;
DELETE FROM public.support_tickets WHERE 1=1;

-- Companies & Teams (except super admin's company if any)
DO $$ BEGIN RAISE NOTICE 'Cleaning up companies...'; END $$;
DELETE FROM public.company_team_members WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE is_super_admin = TRUE AND company_id IS NOT NULL
);
DELETE FROM public.companies WHERE id NOT IN (
  SELECT company_id FROM public.users WHERE is_super_admin = TRUE AND company_id IS NOT NULL
);

-- User Settings & Preferences (except super admin)
DO $$ BEGIN RAISE NOTICE 'Cleaning up user settings...'; END $$;
DELETE FROM public.notification_preferences WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);

-- ============================================================================
-- STEP 3: Delete Non-Super-Admin Users
-- ============================================================================

DO $$ BEGIN RAISE NOTICE 'Cleaning up non-admin users...'; END $$;

-- Delete users who are NOT super admins
DELETE FROM public.users
WHERE is_super_admin = FALSE;

-- ============================================================================
-- STEP 4: Reset Sequences (Optional - for clean numbering)
-- ============================================================================

-- Reset invoice numbering
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'invoice_sequence') THEN
    ALTER SEQUENCE invoice_sequence RESTART WITH 1;
  END IF;
END $$;

-- Reset booking reference numbering
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'booking_reference_sequence') THEN
    ALTER SEQUENCE booking_reference_sequence RESTART WITH 1;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Verify Cleanup
-- ============================================================================

-- Count remaining records
DO $$
DECLARE
  user_count INTEGER;
  booking_count INTEGER;
  invoice_count INTEGER;
  property_count INTEGER;
  message_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO booking_count FROM public.bookings;
  SELECT COUNT(*) INTO invoice_count FROM public.invoices;
  SELECT COUNT(*) INTO property_count FROM public.properties;
  SELECT COUNT(*) INTO message_count FROM public.messages;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'VERIFICATION RESULTS:';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✓ Remaining users: % (should be super admin only)', user_count;
  RAISE NOTICE '✓ Remaining bookings: % (should be 0)', booking_count;
  RAISE NOTICE '✓ Remaining invoices: % (should be 0)', invoice_count;
  RAISE NOTICE '✓ Remaining properties: % (should be 0)', property_count;
  RAISE NOTICE '✓ Remaining messages: % (should be 0)', message_count;
  RAISE NOTICE '============================================================================';

  IF booking_count > 0 OR invoice_count > 0 OR property_count > 0 OR message_count > 0 THEN
    RAISE WARNING 'Some transactional data remains - check foreign key constraints';
  END IF;
END $$;

-- Show remaining users (should only be super admin)
SELECT
  id,
  email,
  full_name,
  user_type,
  is_super_admin,
  is_admin,
  created_at
FROM public.users
ORDER BY is_super_admin DESC;

-- ============================================================================
-- STEP 6: Preserved Configuration (NOT DELETED)
-- ============================================================================

-- These are intentionally NOT deleted:
-- ✓ subscription_plans - System configuration
-- ✓ member_types - System configuration
-- ✓ website_templates - System configuration
-- ✓ template_pages - System configuration
-- ✓ template_sections - System configuration
-- ✓ roles - System configuration
-- ✓ permissions - System configuration
-- ✓ invoice_settings - Can be kept or cleaned if needed
-- ✓ legal_pages - Can be kept or cleaned if needed
-- ✓ locations - Reference data
-- ✓ amenities - Reference data

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CLEANUP COMPLETE!';
  RAISE NOTICE 'Preserved: Super admin users, subscription plans, templates, system config';
  RAISE NOTICE 'Deleted: All bookings, invoices, messages, properties, regular users';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- COMMIT OR ROLLBACK
-- ============================================================================

-- IMPORTANT: Review the results above before committing!

-- Option 1: COMMIT to make changes permanent
COMMIT;

-- Option 2: ROLLBACK to undo everything (comment out COMMIT above, uncomment this)
-- ROLLBACK;

-- ============================================================================
-- NOTES
-- ============================================================================

-- If you want to also clean per-company invoice settings:
-- DELETE FROM public.invoice_settings WHERE company_id IS NOT NULL;

-- If you want to clean legal pages:
-- DELETE FROM public.legal_pages;

-- If you need to create a fresh super admin after cleanup:
-- See migration 123_create_permanent_super_admin.sql
