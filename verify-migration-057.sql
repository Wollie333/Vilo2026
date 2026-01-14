-- Verification queries for migration 057
-- Run these in Supabase SQL Editor to confirm the migration worked

-- 1. Check that property_id and room_id columns exist and room_id is now nullable
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'room_payment_rules'
  AND column_name IN ('property_id', 'room_id')
ORDER BY column_name;

-- Expected output:
-- property_id | uuid | YES | NULL
-- room_id     | uuid | YES | NULL


-- 2. Check that the check constraint was added
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.room_payment_rules'::regclass
  AND conname = 'room_or_property_required';

-- Expected output:
-- room_or_property_required | CHECK (...)


-- 3. Check that new indexes were created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'room_payment_rules'
  AND schemaname = 'public'
  AND indexname LIKE '%property%'
ORDER BY indexname;

-- Expected output:
-- idx_room_payment_rules_property_id
-- idx_room_payment_rules_property_active


-- 4. Verify RLS policies were updated
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'room_payment_rules'
  AND schemaname = 'public'
ORDER BY policyname;

-- Expected output: 4 policies (select, insert, update, delete)


-- 5. Test that we can query with property_id filter (should not error)
SELECT
  id,
  rule_name,
  property_id,
  room_id,
  rule_type,
  is_active
FROM room_payment_rules
LIMIT 5;

-- Should return successfully (even if no rows)
