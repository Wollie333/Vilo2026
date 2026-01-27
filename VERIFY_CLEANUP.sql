-- ============================================================================
-- VERIFY CLEANUP WAS SUCCESSFUL
-- ============================================================================

-- Check remaining users (should only be super admin)
SELECT
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  u.created_at
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_id = r.id
ORDER BY u.email;

-- Check if transactional data was deleted (should all be 0)
SELECT
  'bookings' as table_name, COUNT(*) as count FROM public.bookings
UNION ALL
SELECT 'invoices', COUNT(*) FROM public.invoices
UNION ALL
SELECT 'properties', COUNT(*) FROM public.properties
UNION ALL
SELECT 'rooms', COUNT(*) FROM public.rooms
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM public.chat_messages
UNION ALL
SELECT 'companies', COUNT(*) FROM public.companies
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'property_reviews', COUNT(*) FROM public.property_reviews
UNION ALL
SELECT 'checkouts', COUNT(*) FROM public.checkouts
UNION ALL
SELECT 'credit_memos', COUNT(*) FROM public.credit_memos
ORDER BY table_name;

-- Check that system config was preserved (should have records)
SELECT
  'subscription_types' as table_name, COUNT(*) as count FROM public.subscription_types
UNION ALL
SELECT 'user_types', COUNT(*) FROM public.user_types
UNION ALL
SELECT 'roles', COUNT(*) FROM public.roles
UNION ALL
SELECT 'website_templates', COUNT(*) FROM public.website_templates
ORDER BY table_name;
