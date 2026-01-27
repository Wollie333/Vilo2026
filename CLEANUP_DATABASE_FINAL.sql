-- ============================================================================
-- DATABASE CLEANUP SCRIPT - Mapped to Actual Database Schema
-- ============================================================================
-- Purpose: Clean database for fresh testing while preserving:
--   - Super admin account(s)
--   - Subscription types (plans)
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
DELETE FROM public.chat_reactions WHERE 1=1;
DELETE FROM public.chat_typing_indicators WHERE 1=1;
DELETE FROM public.chat_attachments WHERE 1=1;
DELETE FROM public.chat_messages WHERE 1=1;
DELETE FROM public.chat_participants WHERE 1=1;
DELETE FROM public.chat_conversations WHERE 1=1;
DELETE FROM public.whatsapp_message_queue WHERE 1=1;
DELETE FROM public.whatsapp_message_metadata WHERE 1=1;
DELETE FROM public.whatsapp_opt_outs WHERE 1=1;
DELETE FROM public.notifications WHERE 1=1;

-- Reviews
DO $$ BEGIN RAISE NOTICE 'Cleaning up reviews...'; END $$;
DELETE FROM public.property_reviews WHERE 1=1;

-- Bookings & Related (Delete children first)
DO $$ BEGIN RAISE NOTICE 'Cleaning up bookings and related data...'; END $$;
DELETE FROM public.booking_status_history WHERE 1=1;
DELETE FROM public.booking_payment_schedules WHERE 1=1;
DELETE FROM public.booking_addons WHERE 1=1;
DELETE FROM public.booking_payments WHERE 1=1;
DELETE FROM public.booking_payments_proof_backup WHERE 1=1;
DELETE FROM public.booking_guests WHERE 1=1;
DELETE FROM public.booking_rooms WHERE 1=1;
DELETE FROM public.bookings WHERE 1=1;

-- Invoices & Credits
DO $$ BEGIN RAISE NOTICE 'Cleaning up invoices and credits...'; END $$;
DELETE FROM public.credit_memos WHERE 1=1;
DELETE FROM public.credit_notes WHERE 1=1;
DELETE FROM public.invoices WHERE 1=1;

-- Refunds
DO $$ BEGIN RAISE NOTICE 'Cleaning up refunds...'; END $$;
DELETE FROM public.refund_status_history WHERE 1=1;
DELETE FROM public.refund_comments WHERE 1=1;
DELETE FROM public.refund_documents WHERE 1=1;
DELETE FROM public.refund_requests WHERE 1=1;

-- Checkouts
DO $$ BEGIN RAISE NOTICE 'Cleaning up checkouts...'; END $$;
DELETE FROM public.checkouts WHERE 1=1;

-- Subscriptions
DO $$ BEGIN RAISE NOTICE 'Cleaning up subscriptions...'; END $$;
DELETE FROM public.subscription_upgrade_requests WHERE 1=1;
DELETE FROM public.user_subscriptions WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);

-- Properties & Rooms (Delete children first)
DO $$ BEGIN RAISE NOTICE 'Cleaning up properties and rooms...'; END $$;
DELETE FROM public.room_addon_assignments WHERE 1=1;
DELETE FROM public.room_payment_rule_assignments WHERE 1=1;
DELETE FROM public.room_payment_rules WHERE 1=1;
DELETE FROM public.room_promotion_assignments WHERE 1=1;
DELETE FROM public.room_promotions WHERE 1=1;
DELETE FROM public.room_seasonal_rates WHERE 1=1;
DELETE FROM public.room_availability_blocks WHERE 1=1;
DELETE FROM public.room_beds WHERE 1=1;
DELETE FROM public.rooms WHERE 1=1;
DELETE FROM public.property_websites WHERE 1=1;
DELETE FROM public.properties WHERE 1=1;

-- Add-ons
DO $$ BEGIN RAISE NOTICE 'Cleaning up add-ons...'; END $$;
DELETE FROM public.add_ons WHERE 1=1;

-- Customers & Wishlists
DO $$ BEGIN RAISE NOTICE 'Cleaning up customers and wishlists...'; END $$;
DELETE FROM public.user_wishlists WHERE 1=1;
DELETE FROM public.customer_properties WHERE 1=1;
DELETE FROM public.customers WHERE 1=1;

-- Support Tickets
DO $$ BEGIN RAISE NOTICE 'Cleaning up support tickets...'; END $$;
DELETE FROM public.support_internal_notes WHERE 1=1;
DELETE FROM public.support_tickets WHERE 1=1;

-- Blog (if you want to clean blog content)
DO $$ BEGIN RAISE NOTICE 'Cleaning up blog content...'; END $$;
DELETE FROM public.blog_posts WHERE 1=1;
-- DELETE FROM public.blog_categories WHERE 1=1;  -- Uncomment if you want to delete categories too

-- Companies & Teams (except super admin's company if any)
DO $$ BEGIN RAISE NOTICE 'Cleaning up companies...'; END $$;
DELETE FROM public.whatsapp_phone_company_mapping WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE is_super_admin = TRUE AND company_id IS NOT NULL
);
DELETE FROM public.company_whatsapp_config WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE is_super_admin = TRUE AND company_id IS NOT NULL
);
DELETE FROM public.company_payment_integrations WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE is_super_admin = TRUE AND company_id IS NOT NULL
);
DELETE FROM public.company_team_members WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE is_super_admin = TRUE AND company_id IS NOT NULL
);
DELETE FROM public.companies WHERE id NOT IN (
  SELECT company_id FROM public.users WHERE is_super_admin = TRUE AND company_id IS NOT NULL
);

-- User-related tables (except super admin)
DO $$ BEGIN RAISE NOTICE 'Cleaning up user settings and sessions...'; END $$;
DELETE FROM public.user_sessions WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);
DELETE FROM public.user_properties WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);
DELETE FROM public.user_profiles WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);
DELETE FROM public.notification_preferences WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);
DELETE FROM public.user_permissions WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM public.users WHERE is_super_admin = FALSE
);

-- Audit log (optional - uncomment if you want to clean audit trail)
-- DELETE FROM public.audit_log WHERE 1=1;

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

DO $$ BEGIN RAISE NOTICE 'Resetting sequences...'; END $$;

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

DO $$
DECLARE
  user_count INTEGER;
  booking_count INTEGER;
  invoice_count INTEGER;
  property_count INTEGER;
  message_count INTEGER;
  review_count INTEGER;
  customer_count INTEGER;
  room_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO booking_count FROM public.bookings;
  SELECT COUNT(*) INTO invoice_count FROM public.invoices;
  SELECT COUNT(*) INTO property_count FROM public.properties;
  SELECT COUNT(*) INTO message_count FROM public.chat_messages;
  SELECT COUNT(*) INTO review_count FROM public.property_reviews;
  SELECT COUNT(*) INTO customer_count FROM public.customers;
  SELECT COUNT(*) INTO room_count FROM public.rooms;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'VERIFICATION RESULTS:';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✓ Remaining users: % (should be super admin only)', user_count;
  RAISE NOTICE '✓ Remaining bookings: % (should be 0)', booking_count;
  RAISE NOTICE '✓ Remaining invoices: % (should be 0)', invoice_count;
  RAISE NOTICE '✓ Remaining properties: % (should be 0)', property_count;
  RAISE NOTICE '✓ Remaining rooms: % (should be 0)', room_count;
  RAISE NOTICE '✓ Remaining messages: % (should be 0)', message_count;
  RAISE NOTICE '✓ Remaining reviews: % (should be 0)', review_count;
  RAISE NOTICE '✓ Remaining customers: % (should be 0)', customer_count;
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
-- ✓ subscription_types - System configuration (subscription plans)
-- ✓ subscription_type_permissions - Plan permissions
-- ✓ user_types - System configuration
-- ✓ user_type_permissions - User type permissions
-- ✓ website_templates - System configuration
-- ✓ website_template_pages - Template pages
-- ✓ website_template_page_sections - Template sections
-- ✓ template_page_sections - Page sections
-- ✓ template_categories - Template categories
-- ✓ roles - System configuration
-- ✓ permissions - System configuration
-- ✓ role_permissions - Role-permission mappings
-- ✓ permission_templates - Permission templates
-- ✓ invoice_settings - Can be kept or cleaned if needed
-- ✓ cancellation_policies - Reference data
-- ✓ countries, provinces, cities - Location reference data
-- ✓ payment_integrations - Payment gateway configs
-- ✓ notification_templates - System notification templates
-- ✓ notification_types - Notification type definitions
-- ✓ whatsapp_message_templates - WhatsApp template messages
-- ✓ support_canned_responses - Support response templates

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CLEANUP COMPLETE!';
  RAISE NOTICE 'Preserved: Super admin users, subscription types, templates, system config';
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
-- ADDITIONAL CLEANUP OPTIONS (Uncomment if needed)
-- ============================================================================

-- Clean per-company invoice settings:
-- DELETE FROM public.invoice_settings WHERE company_id IS NOT NULL;

-- Clean blog categories:
-- DELETE FROM public.blog_categories WHERE 1=1;

-- Clean audit log:
-- DELETE FROM public.audit_log WHERE 1=1;

-- Clean cancellation policies:
-- DELETE FROM public.cancellation_policies WHERE 1=1;

-- Clean website pages:
-- DELETE FROM public.website_pages WHERE 1=1;

-- ============================================================================
-- NOTES
-- ============================================================================

-- If you need to create a fresh super admin after cleanup:
-- UPDATE public.users SET is_super_admin = TRUE, is_admin = TRUE
-- WHERE email = 'your-email@example.com';
