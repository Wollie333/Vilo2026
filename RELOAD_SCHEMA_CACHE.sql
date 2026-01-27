-- Reload Supabase PostgREST Schema Cache
-- Run this in your Supabase SQL Editor to force schema cache reload

-- Method 1: Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Method 2: Reload config (if above doesn't work)
NOTIFY pgrst, 'reload config';

-- Verify the bookings table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name IN ('id', 'room_id', 'property_id', 'guest_id', 'company_id', 'booking_reference')
ORDER BY column_name;

-- Expected output should show:
-- room_id, property_id, guest_id (but NOT company_id)
