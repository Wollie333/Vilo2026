-- ============================================================================
-- SAFE DRY RUN - Checks what will be deleted (only core tables)
-- ============================================================================
-- Run this in Supabase SQL Editor to see what will be deleted
-- This version only checks tables that definitely exist in your schema
-- ============================================================================

SELECT
  'Users to delete (non-admin)' as category,
  COUNT(*) as count
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name != 'super_admin'

UNION ALL

SELECT 'User subscriptions to delete', COUNT(*) FROM public.user_subscriptions

UNION ALL

SELECT 'Companies to delete', COUNT(*) FROM public.companies

UNION ALL

SELECT 'Properties to delete', COUNT(*) FROM public.properties

UNION ALL

SELECT 'Rooms to delete', COUNT(*) FROM public.rooms

UNION ALL

SELECT 'Bookings to delete', COUNT(*) FROM public.bookings

UNION ALL

SELECT 'Invoices to delete', COUNT(*) FROM public.invoices

UNION ALL

SELECT 'Checkouts to delete', COUNT(*) FROM public.checkouts;

-- ============================================================================
-- If you get an error about a table not existing, that's OK!
-- It just means that table hasn't been created yet.
-- The reset script will skip tables that don't exist.
-- ============================================================================
