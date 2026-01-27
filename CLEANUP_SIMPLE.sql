BEGIN;

-- Find super admin users
DO $$
DECLARE
  super_admin_count INTEGER;
  super_admin_role_id UUID;
BEGIN
  SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found!';
  END IF;
  SELECT COUNT(DISTINCT user_id) INTO super_admin_count FROM public.user_roles WHERE role_id = super_admin_role_id;
  RAISE NOTICE 'Found % super admin(s) - will be preserved', super_admin_count;
  IF super_admin_count = 0 THEN
    RAISE EXCEPTION 'No super admin found!';
  END IF;
END $$;

-- Create temp table for super admins
CREATE TEMP TABLE super_admin_users AS
SELECT DISTINCT ur.user_id
FROM public.user_roles ur
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'super_admin';

-- Delete chat data
DELETE FROM public.chat_reactions;
DELETE FROM public.chat_typing_indicators;
DELETE FROM public.chat_attachments;
DELETE FROM public.chat_messages;
DELETE FROM public.chat_participants;
DELETE FROM public.chat_conversations;
DELETE FROM public.whatsapp_message_queue;
DELETE FROM public.whatsapp_message_metadata;
DELETE FROM public.whatsapp_opt_outs;
DELETE FROM public.notifications;

-- Delete reviews
DELETE FROM public.property_reviews;

-- Delete bookings
DELETE FROM public.booking_status_history;
DELETE FROM public.booking_payment_schedules;
DELETE FROM public.booking_addons;
DELETE FROM public.booking_payments;
DELETE FROM public.booking_payments_proof_backup;
DELETE FROM public.booking_guests;
DELETE FROM public.booking_rooms;
DELETE FROM public.bookings;

-- Delete invoices
DELETE FROM public.credit_memos;
DELETE FROM public.credit_notes;
DELETE FROM public.invoices;

-- Delete refunds
DELETE FROM public.refund_status_history;
DELETE FROM public.refund_comments;
DELETE FROM public.refund_documents;
DELETE FROM public.refund_requests;

-- Delete checkouts
DELETE FROM public.checkouts;

-- Delete subscriptions (except super admin)
DELETE FROM public.subscription_upgrade_requests;
DELETE FROM public.user_subscriptions WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);

-- Delete rooms
DELETE FROM public.room_addon_assignments;
DELETE FROM public.room_payment_rule_assignments;
DELETE FROM public.room_payment_rules;
DELETE FROM public.room_promotion_assignments;
DELETE FROM public.room_promotions;
DELETE FROM public.room_seasonal_rates;
DELETE FROM public.room_availability_blocks;
DELETE FROM public.room_beds;
DELETE FROM public.rooms;

-- Delete properties
DELETE FROM public.property_websites;
DELETE FROM public.properties;

-- Delete add-ons
DELETE FROM public.add_ons;

-- Delete customers
DELETE FROM public.user_wishlists;
DELETE FROM public.customer_properties;
DELETE FROM public.customers;

-- Delete support
DELETE FROM public.support_internal_notes;
DELETE FROM public.support_tickets;

-- Delete blog
DELETE FROM public.blog_posts;

-- Delete companies (except super admin's)
DELETE FROM public.whatsapp_phone_company_mapping
WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE company_id IS NOT NULL AND id IN (SELECT user_id FROM super_admin_users)
);

DELETE FROM public.company_whatsapp_config
WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE company_id IS NOT NULL AND id IN (SELECT user_id FROM super_admin_users)
);

DELETE FROM public.company_payment_integrations
WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE company_id IS NOT NULL AND id IN (SELECT user_id FROM super_admin_users)
);

DELETE FROM public.company_team_members
WHERE company_id NOT IN (
  SELECT company_id FROM public.users WHERE company_id IS NOT NULL AND id IN (SELECT user_id FROM super_admin_users)
);

DELETE FROM public.companies
WHERE id NOT IN (
  SELECT company_id FROM public.users WHERE company_id IS NOT NULL AND id IN (SELECT user_id FROM super_admin_users)
);

-- Delete user data (except super admin)
DELETE FROM public.user_sessions WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);
DELETE FROM public.user_properties WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);
DELETE FROM public.user_profiles WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);
DELETE FROM public.notification_preferences WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);
DELETE FROM public.user_permissions WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT user_id FROM super_admin_users);

-- Delete users (except super admin)
DELETE FROM public.users WHERE id NOT IN (SELECT user_id FROM super_admin_users);

-- Clean up
DROP TABLE super_admin_users;

-- Show results
DO $$
DECLARE
  user_count INTEGER;
  booking_count INTEGER;
  invoice_count INTEGER;
  property_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO booking_count FROM public.bookings;
  SELECT COUNT(*) INTO invoice_count FROM public.invoices;
  SELECT COUNT(*) INTO property_count FROM public.properties;

  RAISE NOTICE '================================';
  RAISE NOTICE 'CLEANUP COMPLETE!';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Users remaining: %', user_count;
  RAISE NOTICE 'Bookings remaining: %', booking_count;
  RAISE NOTICE 'Invoices remaining: %', invoice_count;
  RAISE NOTICE 'Properties remaining: %', property_count;
  RAISE NOTICE '================================';
END $$;

COMMIT;
