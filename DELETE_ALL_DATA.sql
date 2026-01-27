-- ============================================================================
-- DELETE ALL TRANSACTIONAL DATA - NUCLEAR OPTION
-- ============================================================================
-- Deletes EVERYTHING except super admin and system configuration
-- ============================================================================

BEGIN;

-- Create temp table for super admins
CREATE TEMP TABLE super_admin_users AS
SELECT DISTINCT ur.user_id
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'super_admin';

-- ============================================================================
-- DELETE ALL TRANSACTIONAL DATA
-- ============================================================================

-- Audit log
DELETE FROM public.audit_log;

-- Blog
DELETE FROM public.blog_posts;

-- Bookings and related
DELETE FROM public.booking_status_history;
DELETE FROM public.booking_payment_schedules;
DELETE FROM public.booking_addons;
DELETE FROM public.booking_payments;
DELETE FROM public.booking_payments_proof_backup;
DELETE FROM public.booking_guests;
DELETE FROM public.booking_rooms;
DELETE FROM public.bookings;

-- Chat
DELETE FROM public.chat_reactions;
DELETE FROM public.chat_typing_indicators;
DELETE FROM public.chat_attachments;
DELETE FROM public.chat_messages;
DELETE FROM public.chat_participants;
DELETE FROM public.chat_conversations;

-- WhatsApp
DELETE FROM public.whatsapp_message_queue;
DELETE FROM public.whatsapp_message_metadata;
DELETE FROM public.whatsapp_opt_outs;
DELETE FROM public.whatsapp_phone_company_mapping;

-- Notifications
DELETE FROM public.notifications;

-- Reviews
DELETE FROM public.property_reviews;

-- Invoices and Credits
DELETE FROM public.credit_memos;
DELETE FROM public.credit_notes;
DELETE FROM public.invoices;

-- Refunds
DELETE FROM public.refund_status_history;
DELETE FROM public.refund_comments;
DELETE FROM public.refund_documents;
DELETE FROM public.refund_requests;

-- Checkouts
DELETE FROM public.checkouts;

-- Subscriptions
DELETE FROM public.subscription_upgrade_requests;
DELETE FROM public.user_subscriptions WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);

-- Rooms
DELETE FROM public.room_addon_assignments;
DELETE FROM public.room_payment_rule_assignments;
DELETE FROM public.room_payment_rules;
DELETE FROM public.room_promotion_assignments;
DELETE FROM public.room_promotions;
DELETE FROM public.room_seasonal_rates;
DELETE FROM public.room_availability_blocks;
DELETE FROM public.room_beds;
DELETE FROM public.rooms;

-- Properties
DELETE FROM public.property_websites;
DELETE FROM public.properties;

-- Add-ons
DELETE FROM public.add_ons;

-- Customers
DELETE FROM public.user_wishlists;
DELETE FROM public.customer_properties;
DELETE FROM public.customers;

-- Support
DELETE FROM public.support_internal_notes;
DELETE FROM public.support_tickets;

-- Companies
DELETE FROM public.company_whatsapp_config;
DELETE FROM public.company_payment_integrations;
DELETE FROM public.company_team_members;
DELETE FROM public.companies;

-- Website pages (user-created content)
DELETE FROM public.website_pages;

-- User sessions and data
DELETE FROM public.user_sessions;
DELETE FROM public.user_properties;
DELETE FROM public.user_profiles;
DELETE FROM public.notification_preferences;
DELETE FROM public.user_permissions;

-- User roles (except super admin)
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);

-- Users (except super admin)
DELETE FROM public.users WHERE id NOT IN (SELECT user_id FROM super_admin_users);

-- Invoice settings (company-specific)
DELETE FROM public.invoice_settings WHERE id != (
  SELECT id FROM public.invoice_settings ORDER BY created_at LIMIT 1
);

-- Cancellation policies (user-created)
DELETE FROM public.cancellation_policies;

-- Clean up
DROP TABLE super_admin_users;

-- ============================================================================
-- VERIFY CLEANUP
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
  booking_count INTEGER;
  invoice_count INTEGER;
  property_count INTEGER;
  company_count INTEGER;
  message_count INTEGER;
  chat_count INTEGER;
  support_count INTEGER;
  review_count INTEGER;
  customer_count INTEGER;
  room_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO booking_count FROM public.bookings;
  SELECT COUNT(*) INTO invoice_count FROM public.invoices;
  SELECT COUNT(*) INTO property_count FROM public.properties;
  SELECT COUNT(*) INTO company_count FROM public.companies;
  SELECT COUNT(*) INTO message_count FROM public.chat_messages;
  SELECT COUNT(*) INTO chat_count FROM public.chat_conversations;
  SELECT COUNT(*) INTO support_count FROM public.support_tickets;
  SELECT COUNT(*) INTO review_count FROM public.property_reviews;
  SELECT COUNT(*) INTO customer_count FROM public.customers;
  SELECT COUNT(*) INTO room_count FROM public.rooms;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPLETE CLEANUP FINISHED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: % (should be 1 - super admin)', user_count;
  RAISE NOTICE 'Bookings: % (should be 0)', booking_count;
  RAISE NOTICE 'Invoices: % (should be 0)', invoice_count;
  RAISE NOTICE 'Properties: % (should be 0)', property_count;
  RAISE NOTICE 'Rooms: % (should be 0)', room_count;
  RAISE NOTICE 'Companies: % (should be 0)', company_count;
  RAISE NOTICE 'Messages: % (should be 0)', message_count;
  RAISE NOTICE 'Conversations: % (should be 0)', chat_count;
  RAISE NOTICE 'Support Tickets: % (should be 0)', support_count;
  RAISE NOTICE 'Reviews: % (should be 0)', review_count;
  RAISE NOTICE 'Customers: % (should be 0)', customer_count;
  RAISE NOTICE '========================================';

  IF booking_count = 0 AND invoice_count = 0 AND property_count = 0
     AND company_count = 0 AND message_count = 0 AND support_count = 0 THEN
    RAISE NOTICE '✓ ALL TRANSACTIONAL DATA DELETED!';
  ELSE
    RAISE WARNING 'Some data remains - check foreign keys';
  END IF;
END $$;

-- Show remaining user (should be super admin only)
SELECT
  u.id,
  u.email,
  u.full_name,
  r.name as role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id;

COMMIT;
