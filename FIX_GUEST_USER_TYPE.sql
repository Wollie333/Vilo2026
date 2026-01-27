-- ============================================================================
-- FIX GUEST USER TYPE - Ensure guest type exists with correct category
-- ============================================================================
-- The signup flow requires a user_type with category='customer' and is_active=true
-- Migration 116 creates 'guest' but we need to ensure it's properly configured
-- ============================================================================

BEGIN;

-- Show current state
SELECT 'BEFORE FIX:' as status, id, name, category, is_active, is_system_type
FROM public.user_types
WHERE name = 'guest' OR category = 'customer';

-- Create or update guest user type
INSERT INTO public.user_types (
  name,
  display_name,
  category,
  is_system_type,
  can_have_subscription,
  can_have_team,
  is_active,
  sort_order,
  created_at,
  updated_at
) VALUES (
  'guest',
  'Guest',
  'customer',  -- CRITICAL: Must be 'customer' for signup to work
  FALSE,
  FALSE,
  FALSE,
  TRUE,        -- CRITICAL: Must be active
  100,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  category = 'customer',
  is_active = TRUE,
  updated_at = NOW();

-- Grant basic permissions to guests if not exists
-- Allow guests to view and manage their own bookings
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT
  ut.id,
  p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'guest'
  AND p.resource = 'bookings'
  AND p.action IN ('read', 'update')
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- Grant profile permissions
INSERT INTO public.user_type_permissions (user_type_id, permission_id)
SELECT
  ut.id,
  p.id
FROM public.user_types ut
CROSS JOIN public.permissions p
WHERE ut.name = 'guest'
  AND p.resource = 'profile'
  AND p.action IN ('read', 'update')
ON CONFLICT (user_type_id, permission_id) DO NOTHING;

-- Show final state
SELECT 'AFTER FIX:' as status, id, name, category, is_active, is_system_type
FROM public.user_types
ORDER BY category, sort_order;

-- Verify customer types exist
DO $$
DECLARE
  customer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_count
  FROM public.user_types
  WHERE category = 'customer' AND is_active = TRUE;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customer user types (active): %', customer_count;
  RAISE NOTICE '========================================';

  IF customer_count > 0 THEN
    RAISE NOTICE '✓ Signup should work now!';
  ELSE
    RAISE WARNING '✗ No customer user types found - signup will fail!';
  END IF;
END $$;

COMMIT;
