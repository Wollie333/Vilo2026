-- ============================================================================
-- VERIFICATION SCRIPT: Check Super Admin and Their Business Data
-- ============================================================================
-- Description: Run this FIRST to verify super admin exists and see their data
-- Date: 2026-01-12
--
-- INSTRUCTIONS:
-- 1. Copy this entire query
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run"
-- 4. Verify you see your super admin user, company, and properties
-- ============================================================================

-- ========================================
-- SECTION 1: Super Admin Users
-- ========================================

SELECT
  '=== SUPER ADMIN USERS (WILL BE PRESERVED) ===' as section,
  u.id,
  u.email,
  u.full_name,
  ut.name as user_type,
  u.status,
  u.created_at
FROM public.users u
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name = 'super_admin'
ORDER BY u.created_at;

-- ========================================
-- SECTION 2: Super Admin Companies
-- ========================================

SELECT
  '=== SUPER ADMIN COMPANIES (WILL BE PRESERVED) ===' as section,
  c.id,
  c.name,
  c.slug,
  u.email as owner_email,
  c.created_at
FROM public.companies c
JOIN public.users u ON c.user_id = u.id
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name = 'super_admin'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')
ORDER BY c.created_at;

-- ========================================
-- SECTION 3: Super Admin Properties
-- ========================================

SELECT
  '=== SUPER ADMIN PROPERTIES (WILL BE PRESERVED) ===' as section,
  p.id,
  p.name,
  p.slug,
  c.name as company_name,
  u.email as owner_email,
  p.created_at
FROM public.properties p
JOIN public.companies c ON p.company_id = c.id
JOIN public.users u ON c.user_id = u.id
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name = 'super_admin'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties')
ORDER BY p.created_at;

-- ========================================
-- SECTION 4: Super Admin Rooms
-- ========================================

SELECT
  '=== SUPER ADMIN ROOMS (WILL BE PRESERVED) ===' as section,
  r.id,
  r.name,
  p.name as property_name,
  r.room_type,
  r.base_price,
  r.created_at
FROM public.rooms r
JOIN public.properties p ON r.property_id = p.id
JOIN public.companies c ON p.company_id = c.id
JOIN public.users u ON c.user_id = u.id
JOIN public.user_types ut ON u.user_type_id = ut.id
WHERE ut.name = 'super_admin'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms')
ORDER BY p.name, r.name;

-- ========================================
-- SECTION 5: Summary Counts
-- ========================================

SELECT
  'SUMMARY: Super Admin Data to Preserve' as section,
  (SELECT COUNT(*) FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.name = 'super_admin') as super_admin_users,

  (SELECT COUNT(*) FROM public.companies c
   JOIN public.users u ON c.user_id = u.id
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.name = 'super_admin'
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')) as super_admin_companies,

  (SELECT COUNT(*) FROM public.properties p
   JOIN public.companies c ON p.company_id = c.id
   JOIN public.users u ON c.user_id = u.id
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.name = 'super_admin'
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties')) as super_admin_properties,

  (SELECT COUNT(*) FROM public.rooms r
   JOIN public.properties p ON r.property_id = p.id
   JOIN public.companies c ON p.company_id = c.id
   JOIN public.users u ON c.user_id = u.id
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.name = 'super_admin'
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms')) as super_admin_rooms;

-- ========================================
-- SECTION 6: Non-Admin Data (TO BE DELETED)
-- ========================================

SELECT
  'WARNING: Non-Admin Data to Delete' as section,
  (SELECT COUNT(*) FROM public.users u
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.name != 'super_admin') as non_admin_users,

  (SELECT COUNT(*) FROM public.companies c
   JOIN public.users u ON c.user_id = u.id
   JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE ut.name != 'super_admin'
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies')) as non_admin_companies,

  (SELECT COUNT(*) FROM public.properties p
   LEFT JOIN public.companies c ON p.company_id = c.id
   LEFT JOIN public.users u ON c.user_id = u.id
   LEFT JOIN public.user_types ut ON u.user_type_id = ut.id
   WHERE (ut.name != 'super_admin' OR ut.name IS NULL)
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties')) as non_admin_properties,

  (SELECT COUNT(*) FROM public.bookings
   WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings')) as all_bookings;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- You should see:
-- 1. Section 1: Your super admin user account
-- 2. Section 2: Your company (if you have one)
-- 3. Section 3: Your properties (if you have any)
-- 4. Section 4: Your rooms (if you have any)
-- 5. Section 5: Summary counts showing what will be preserved
-- 6. Section 6: Summary of what will be deleted
--
-- ⚠️  IF YOU SEE ZERO SUPER ADMINS, DO NOT PROCEED WITH DELETION!
--     You need to create or assign a super admin first.
-- ============================================================================
