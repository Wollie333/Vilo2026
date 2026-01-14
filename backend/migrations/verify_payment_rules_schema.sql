-- Verification script for payment rules schema
-- Run this to confirm all objects from migrations 036 and 037 exist

-- Check enums
SELECT 'Checking enums...' as status;
SELECT
  typname as enum_name,
  CASE
    WHEN typname = 'payment_rule_type' THEN '✓'
    WHEN typname = 'amount_type' THEN '✓'
    WHEN typname = 'due_timing' THEN '✓'
    WHEN typname = 'milestone_status' THEN '✓'
    ELSE '?'
  END as exists
FROM pg_type
WHERE typname IN ('payment_rule_type', 'amount_type', 'due_timing', 'milestone_status')
ORDER BY typname;

-- Check tables
SELECT 'Checking tables...' as status;
SELECT
  tablename,
  '✓' as exists
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('room_payment_rules', 'booking_payment_schedules')
ORDER BY tablename;

-- Check booking_payments columns
SELECT 'Checking booking_payments new columns...' as status;
SELECT
  column_name,
  data_type,
  '✓' as exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'booking_payments'
  AND column_name IN ('receipt_number', 'receipt_url', 'applied_to_milestone_id')
ORDER BY column_name;

-- Check invoice_settings receipt columns
SELECT 'Checking invoice_settings receipt columns...' as status;
SELECT
  column_name,
  data_type,
  column_default,
  '✓' as exists
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoice_settings'
  AND column_name IN ('receipt_prefix', 'receipt_next_sequence')
ORDER BY column_name;

-- Check functions
SELECT 'Checking functions...' as status;
SELECT
  routine_name,
  '✓' as exists
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_receipt_number', 'update_milestone_status_on_payment')
ORDER BY routine_name;

-- Check RLS policies
SELECT 'Checking RLS policies...' as status;
SELECT
  tablename,
  policyname,
  '✓' as exists
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('room_payment_rules', 'booking_payment_schedules')
ORDER BY tablename, policyname;

-- Summary
SELECT 'Schema verification complete!' as status;
