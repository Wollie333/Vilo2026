-- Check NOT NULL constraints in bookings table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;
