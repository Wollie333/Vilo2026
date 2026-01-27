-- ============================================================================
-- FIX USER TYPES - Ensure default customer user type exists
-- ============================================================================
-- The signup flow requires a user_type with category='customer'
-- This script creates one if it doesn't exist
-- ============================================================================

BEGIN;

-- Check if customer user type exists
DO $$
DECLARE
  customer_type_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_type_count
  FROM public.user_types
  WHERE category = 'customer' AND is_active = true;

  RAISE NOTICE 'Customer user types found: %', customer_type_count;

  -- Create default customer type if none exists
  IF customer_type_count = 0 THEN
    INSERT INTO public.user_types (
      name,
      category,
      description,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      'Guest',
      'customer',
      'Default customer type for guests making bookings',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created default customer user type: Guest';
  END IF;
END $$;

-- Show all user types after fix
SELECT
  id,
  name,
  category,
  is_active,
  description,
  created_at
FROM public.user_types
ORDER BY category, name;

COMMIT;
