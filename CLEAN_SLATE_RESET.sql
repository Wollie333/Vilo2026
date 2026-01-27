-- ============================================================================
-- CLEAN SLATE RESET - Keep Only Super Admin
-- ============================================================================
-- WARNING: This will PERMANENTLY delete ALL data except super admin account
-- Run this in Supabase SQL Editor
-- Created: 2026-01-25
-- ============================================================================

BEGIN;

-- Disable triggers for clean deletion
SET session_replication_role = 'replica';

DO $$
DECLARE
  super_admin_id UUID;
  deleted_count INTEGER;
BEGIN
  -- ============================================================================
  -- STEP 1: Find Super Admin
  -- ============================================================================
  SELECT ur.user_id INTO super_admin_id
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.name = 'super_admin'
  LIMIT 1;

  IF super_admin_id IS NULL THEN
    RAISE EXCEPTION 'ABORT: No super admin found! Cannot proceed.';
  END IF;

  RAISE NOTICE '=== CLEAN SLATE RESET STARTING ===';
  RAISE NOTICE 'Super Admin ID: %', super_admin_id;
  RAISE NOTICE 'All other data will be deleted...';
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 2: Delete All Data (with error handling for missing tables)
  -- ============================================================================

  -- Chat System
  BEGIN
    DELETE FROM chat_messages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat messages', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped chat_messages';
  END;

  BEGIN
    DELETE FROM chat_participants;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat participants', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped chat_participants';
  END;

  BEGIN
    DELETE FROM chat_reactions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat reactions', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped chat_reactions';
  END;

  BEGIN
    DELETE FROM chat_attachments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat attachments', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped chat_attachments';
  END;

  BEGIN
    DELETE FROM chat_conversations;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % chat conversations', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped chat_conversations';
  END;

  -- Support & Tickets
  BEGIN
    DELETE FROM support_ticket_messages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % support ticket messages', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped support_ticket_messages';
  END;

  BEGIN
    DELETE FROM support_tickets;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % support tickets', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped support_tickets';
  END;

  -- Reviews
  BEGIN
    DELETE FROM property_reviews;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % property reviews', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped property_reviews';
  END;

  BEGIN
    DELETE FROM review_responses;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % review responses', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped review_responses';
  END;

  -- Bookings & Related
  BEGIN
    DELETE FROM booking_addons;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % booking addons', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped booking_addons';
  END;

  BEGIN
    DELETE FROM booking_guests;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % booking guests', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped booking_guests';
  END;

  BEGIN
    DELETE FROM bookings;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % bookings', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped bookings';
  END;

  -- Financial Records
  BEGIN
    DELETE FROM refunds;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % refunds', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped refunds';
  END;

  BEGIN
    DELETE FROM payment_schedules;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % payment schedules', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped payment_schedules';
  END;

  BEGIN
    DELETE FROM payments;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % payments', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped payments';
  END;

  BEGIN
    DELETE FROM invoices;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % invoices', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped invoices';
  END;

  -- Customers
  BEGIN
    DELETE FROM customers;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % customers', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped customers';
  END;

  -- Property Content
  BEGIN
    DELETE FROM room_images;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % room images', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped room_images';
  END;

  BEGIN
    DELETE FROM rooms;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % rooms', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped rooms';
  END;

  BEGIN
    DELETE FROM addons;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % addons', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped addons';
  END;

  BEGIN
    DELETE FROM promotion_usage;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % promotion usage records', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped promotion_usage';
  END;

  BEGIN
    DELETE FROM promotions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % promotions', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped promotions';
  END;

  -- Property Websites
  BEGIN
    DELETE FROM property_website_page_sections;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % website page sections', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped property_website_page_sections';
  END;

  BEGIN
    DELETE FROM property_website_pages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % website pages', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped property_website_pages';
  END;

  BEGIN
    DELETE FROM property_websites;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % property websites', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped property_websites';
  END;

  BEGIN
    DELETE FROM property_images;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % property images', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped property_images';
  END;

  BEGIN
    DELETE FROM property_amenities;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % property amenities', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped property_amenities';
  END;

  -- Properties
  BEGIN
    DELETE FROM properties;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % properties', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped properties';
  END;

  -- Legal Documents
  BEGIN
    DELETE FROM cancellation_policies;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % cancellation policies', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped cancellation_policies';
  END;

  BEGIN
    DELETE FROM legal_document_sections;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % legal document sections', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped legal_document_sections';
  END;

  BEGIN
    DELETE FROM legal_documents;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % legal documents', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped legal_documents';
  END;

  -- Billing & Subscriptions
  BEGIN
    DELETE FROM subscription_history;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % subscription history records', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped subscription_history';
  END;

  BEGIN
    DELETE FROM subscriptions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % subscriptions', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped subscriptions';
  END;

  BEGIN
    DELETE FROM upgrade_requests;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % upgrade requests', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped upgrade_requests';
  END;

  -- WhatsApp Integration
  BEGIN
    DELETE FROM whatsapp_messages;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % WhatsApp messages', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped whatsapp_messages';
  END;

  BEGIN
    DELETE FROM whatsapp_templates;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % WhatsApp templates', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped whatsapp_templates';
  END;

  BEGIN
    DELETE FROM company_whatsapp_configs;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % WhatsApp configs', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped company_whatsapp_configs';
  END;

  -- Payment Integrations
  BEGIN
    DELETE FROM company_payment_integrations;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % payment integrations', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped company_payment_integrations';
  END;

  -- Companies
  BEGIN
    DELETE FROM companies;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % companies', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped companies';
  END;

  -- Audit Logs
  BEGIN
    DELETE FROM audit_logs;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % audit logs', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped audit_logs';
  END;

  -- User Sessions (keep super admin sessions)
  BEGIN
    DELETE FROM user_sessions WHERE user_id != super_admin_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Deleted % user sessions', deleted_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⊘ Skipped user_sessions';
  END;

  -- User Roles (keep super admin role)
  DELETE FROM user_roles WHERE user_id != super_admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % user roles', deleted_count;

  -- Users (keep super admin)
  DELETE FROM users WHERE id != super_admin_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % users', deleted_count;

  RAISE NOTICE '';
  RAISE NOTICE '=== DELETION COMPLETE ===';
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================================================
-- STEP 3: Verify Clean Slate
-- ============================================================================
DO $$
DECLARE
  user_count INTEGER;
  customer_count INTEGER;
  booking_count INTEGER;
  property_count INTEGER;
  company_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;

  BEGIN
    SELECT COUNT(*) INTO customer_count FROM customers;
  EXCEPTION WHEN OTHERS THEN
    customer_count := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO booking_count FROM bookings;
  EXCEPTION WHEN OTHERS THEN
    booking_count := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO property_count FROM properties;
  EXCEPTION WHEN OTHERS THEN
    property_count := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO company_count FROM companies;
  EXCEPTION WHEN OTHERS THEN
    company_count := 0;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Users remaining: %', user_count;
  RAISE NOTICE 'Customers remaining: %', customer_count;
  RAISE NOTICE 'Bookings remaining: %', booking_count;
  RAISE NOTICE 'Properties remaining: %', property_count;
  RAISE NOTICE 'Companies remaining: %', company_count;
  RAISE NOTICE '';

  IF user_count = 1 AND customer_count = 0 AND booking_count = 0 AND property_count = 0 AND company_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: Clean slate achieved - only super admin remains';
  ELSE
    RAISE WARNING '⚠️  Warning: Unexpected counts detected';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- FINAL CHECK: Show remaining super admin
-- ============================================================================
SELECT
  u.id,
  u.email,
  u.full_name,
  u.user_type_id,
  r.name as role,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id;

-- ============================================================================
-- DONE! Your database is now a clean slate with only the super admin.
-- ============================================================================
