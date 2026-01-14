-- ============================================================================
-- SIMPLE ONE-CLICK BACKUP
-- ============================================================================
-- Instructions:
-- 1. Copy this entire file
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run"
-- 4. Copy the entire output (it will be JSON)
-- 5. Save to a file: backup_2026-01-12.json
-- ============================================================================

SELECT jsonb_pretty(
  jsonb_build_object(
    'backup_date', NOW()::text,
    'backup_info', 'Vilo Database Backup - Complete data export',

    'users', (
      SELECT COALESCE(jsonb_agg(row_to_json(u)), '[]'::jsonb)
      FROM (
        SELECT u.* FROM public.users u
        JOIN public.user_types ut ON u.user_type_id = ut.id
        WHERE ut.name != 'super_admin'
      ) u
    ),

    'companies', (
      SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
      FROM public.companies c
    ),

    'properties', (
      SELECT COALESCE(jsonb_agg(row_to_json(p)), '[]'::jsonb)
      FROM public.properties p
    ),

    'rooms', (
      SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
      FROM public.rooms r
    ),

    'bookings', (
      SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb)
      FROM public.bookings b
    ),

    'invoices', (
      SELECT COALESCE(jsonb_agg(row_to_json(i)), '[]'::jsonb)
      FROM public.invoices i
    ),

    'checkouts', (
      SELECT COALESCE(jsonb_agg(row_to_json(ch)), '[]'::jsonb)
      FROM public.checkouts ch
    ),

    'user_subscriptions', (
      SELECT COALESCE(jsonb_agg(row_to_json(us)), '[]'::jsonb)
      FROM public.user_subscriptions us
    )
  )
) as backup_json;

-- ============================================================================
-- After running this:
-- 1. Copy the ENTIRE output (all the JSON)
-- 2. Save it to: C:\Users\Wollie\Desktop\Vilo\ViloNew\backup_2026-01-12.json
-- 3. That's your backup - keep it safe!
-- ============================================================================
