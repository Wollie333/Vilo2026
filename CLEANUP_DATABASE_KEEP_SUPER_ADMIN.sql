-- ============================================================================
-- CLEANUP DATABASE - DELETE ALL USERS EXCEPT SUPER ADMIN
-- ============================================================================
-- Description: Removes all users except admin@vilo.com and all their data
-- Date: 2026-01-25
-- WARNING: This will permanently delete data. Run with caution.
-- ============================================================================

BEGIN;

-- Get the super admin user ID
DO $$
DECLARE
  v_super_admin_id UUID;
BEGIN
  -- Find super admin
  SELECT id INTO v_super_admin_id
  FROM public.users
  WHERE email = 'admin@vilo.com';

  IF v_super_admin_id IS NULL THEN
    RAISE EXCEPTION 'Super admin (admin@vilo.com) not found. Aborting cleanup.';
  END IF;

  RAISE NOTICE 'Super admin ID: %', v_super_admin_id;

  -- ============================================================================
  -- DELETE USER DATA (in order to respect foreign key constraints)
  -- ============================================================================

  -- 1. Delete WhatsApp related data
  RAISE NOTICE 'Deleting WhatsApp data...';
  DELETE FROM whatsapp_messages WHERE user_id != v_super_admin_id;
  DELETE FROM whatsapp_templates WHERE user_id != v_super_admin_id;
  DELETE FROM company_whatsapp_configs WHERE user_id != v_super_admin_id;

  -- 2. Delete support tickets
  RAISE NOTICE 'Deleting support tickets...';
  DELETE FROM support_tickets WHERE user_id != v_super_admin_id;

  -- 3. Delete email templates
  RAISE NOTICE 'Deleting email templates...';
  DELETE FROM email_templates WHERE user_id != v_super_admin_id;

  -- 4. Delete customer data
  RAISE NOTICE 'Deleting customers...';
  DELETE FROM customers WHERE user_id != v_super_admin_id;

  -- 5. Delete reviews (both as reviewer and for properties owned by non-super-admin)
  RAISE NOTICE 'Deleting reviews...';
  DELETE FROM reviews WHERE reviewer_id != v_super_admin_id;
  DELETE FROM reviews WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != v_super_admin_id
  );

  -- 6. Delete refunds (for bookings by non-super-admin)
  RAISE NOTICE 'Deleting refunds...';
  DELETE FROM refunds WHERE booking_id IN (
    SELECT id FROM bookings WHERE guest_id != v_super_admin_id
  );

  -- 7. Delete invoices (subscription and booking invoices)
  RAISE NOTICE 'Deleting invoices...';
  DELETE FROM invoices WHERE user_id != v_super_admin_id;

  -- 8. Delete payment schedules
  RAISE NOTICE 'Deleting payment schedules...';
  DELETE FROM payment_schedules WHERE booking_id IN (
    SELECT id FROM bookings WHERE guest_id != v_super_admin_id
  );

  -- 9. Delete payments
  RAISE NOTICE 'Deleting payments...';
  DELETE FROM payments WHERE booking_id IN (
    SELECT id FROM bookings WHERE guest_id != v_super_admin_id
  );
  DELETE FROM payments WHERE subscription_id IN (
    SELECT id FROM subscriptions WHERE user_id != v_super_admin_id
  );

  -- 10. Delete bookings (as guest or for properties owned by non-super-admin)
  RAISE NOTICE 'Deleting bookings...';
  DELETE FROM bookings WHERE guest_id != v_super_admin_id;
  DELETE FROM bookings WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != v_super_admin_id
  );

  -- 11. Delete rooms (for properties owned by non-super-admin)
  RAISE NOTICE 'Deleting rooms...';
  DELETE FROM rooms WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != v_super_admin_id
  );

  -- 12. Delete add-ons (for properties owned by non-super-admin)
  RAISE NOTICE 'Deleting add-ons...';
  DELETE FROM add_ons WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != v_super_admin_id
  );

  -- 13. Delete promotions (for properties owned by non-super-admin)
  RAISE NOTICE 'Deleting promotions...';
  DELETE FROM promotions WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != v_super_admin_id
  );

  -- 14. Delete cancellation policies (for properties owned by non-super-admin)
  RAISE NOTICE 'Deleting cancellation policies...';
  DELETE FROM cancellation_policies WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != v_super_admin_id
  );

  -- 15. Delete property websites (for properties owned by non-super-admin)
  RAISE NOTICE 'Deleting property websites...';
  DELETE FROM property_websites WHERE property_id IN (
    SELECT id FROM properties WHERE owner_id != v_super_admin_id
  );

  -- 16. Delete properties (owned by non-super-admin)
  RAISE NOTICE 'Deleting properties...';
  DELETE FROM properties WHERE owner_id != v_super_admin_id;

  -- 17. Delete company payment integrations
  RAISE NOTICE 'Deleting company payment integrations...';
  DELETE FROM company_payment_integrations WHERE company_id IN (
    SELECT id FROM companies WHERE user_id != v_super_admin_id
  );

  -- 18. Delete companies (owned by non-super-admin)
  RAISE NOTICE 'Deleting companies...';
  DELETE FROM companies WHERE user_id != v_super_admin_id;

  -- 19. Delete subscriptions (non-super-admin)
  RAISE NOTICE 'Deleting subscriptions...';
  DELETE FROM subscriptions WHERE user_id != v_super_admin_id;

  -- 20. Delete user permissions
  RAISE NOTICE 'Deleting user permissions...';
  DELETE FROM user_permissions WHERE user_id != v_super_admin_id;

  -- 21. Delete user roles (keep only super admin roles)
  RAISE NOTICE 'Deleting user roles...';
  DELETE FROM user_roles WHERE user_id != v_super_admin_id;

  -- 22. Delete audit logs (for non-super-admin)
  RAISE NOTICE 'Deleting audit logs...';
  DELETE FROM audit_logs WHERE user_id != v_super_admin_id;

  -- 23. Delete chat messages and conversations
  RAISE NOTICE 'Deleting chat data...';
  DELETE FROM chat_messages WHERE conversation_id IN (
    SELECT id FROM chat_conversations WHERE user_id != v_super_admin_id
  );
  DELETE FROM chat_conversations WHERE user_id != v_super_admin_id;

  -- 24. Delete wishlists
  RAISE NOTICE 'Deleting wishlists...';
  DELETE FROM wishlists WHERE user_id != v_super_admin_id;

  -- 25. Delete upgrade requests
  RAISE NOTICE 'Deleting upgrade requests...';
  DELETE FROM upgrade_requests WHERE user_id != v_super_admin_id;

  -- ============================================================================
  -- DELETE USERS (except super admin)
  -- ============================================================================

  RAISE NOTICE 'Deleting users (except super admin)...';

  -- First, delete from auth.users (Supabase auth table)
  -- Note: This may require special permissions
  DELETE FROM auth.users WHERE id != v_super_admin_id;

  -- Then delete from public.users
  DELETE FROM public.users WHERE id != v_super_admin_id;

  -- ============================================================================
  -- VERIFY CLEANUP
  -- ============================================================================

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'CLEANUP COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Remaining users: %', (SELECT COUNT(*) FROM public.users);
  RAISE NOTICE 'Super admin email: %', (SELECT email FROM public.users WHERE id = v_super_admin_id);
  RAISE NOTICE 'Super admin ID: %', v_super_admin_id;
  RAISE NOTICE '============================================================';

END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check remaining data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Companies', COUNT(*) FROM companies
UNION ALL
SELECT 'Properties', COUNT(*) FROM properties
UNION ALL
SELECT 'Rooms', COUNT(*) FROM rooms
UNION ALL
SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers;

-- Show super admin details
SELECT
  id,
  email,
  full_name,
  user_type_id,
  status,
  created_at
FROM users
WHERE email = 'admin@vilo.com';
