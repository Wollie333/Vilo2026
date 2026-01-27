-- Diagnostic Query: Check Booking Visibility Issue
-- Run this in Supabase SQL Editor to diagnose why bookings aren't showing

-- 1. Check recent bookings and their property relationships
SELECT
  b.id as booking_id,
  b.booking_reference,
  b.created_at as booking_created,
  b.property_id,
  p.name as property_name,
  p.owner_id as property_owner_id,
  p.company_id,
  b.guest_name,
  b.booking_status,
  b.payment_status
FROM bookings b
LEFT JOIN properties p ON b.property_id = p.id
ORDER BY b.created_at DESC
LIMIT 20;

-- 2. Check if properties have owner_id set
SELECT
  id,
  name,
  owner_id,
  company_id,
  created_at,
  CASE
    WHEN owner_id IS NULL THEN '❌ MISSING OWNER_ID'
    ELSE '✓ Has owner_id'
  END as owner_status
FROM properties
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check user's properties and their bookings count
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  COUNT(DISTINCT p.id) as properties_count,
  COUNT(DISTINCT b.id) as bookings_count
FROM users u
LEFT JOIN properties p ON p.owner_id = u.id
LEFT JOIN bookings b ON b.property_id = p.id
WHERE u.user_type IN ('owner', 'admin', 'super_admin')
GROUP BY u.id, u.email, u.full_name
ORDER BY bookings_count DESC;

-- 4. Find orphaned bookings (bookings with no owner_id on property)
SELECT
  b.id as booking_id,
  b.booking_reference,
  b.property_id,
  p.name as property_name,
  p.owner_id,
  '⚠️ This booking will NOT show up for any owner' as issue
FROM bookings b
LEFT JOIN properties p ON b.property_id = p.id
WHERE p.owner_id IS NULL
ORDER BY b.created_at DESC;
