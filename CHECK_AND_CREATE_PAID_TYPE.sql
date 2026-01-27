-- ============================================================================
-- CHECK AND CREATE PAID USER TYPE
-- ============================================================================

BEGIN;

-- Show current customer user types
SELECT
  '=== CURRENT CUSTOMER USER TYPES ===' as info,
  id,
  name,
  display_name,
  category,
  can_have_subscription,
  is_system_type,
  sort_order
FROM public.user_types
WHERE category = 'customer'
ORDER BY sort_order;

-- Check if 'paid' exists
DO $$
DECLARE
  paid_exists BOOLEAN;
  free_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_types WHERE name = 'paid') INTO paid_exists;
  SELECT EXISTS(SELECT 1 FROM public.user_types WHERE name = 'free') INTO free_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'User Type Check:';
  RAISE NOTICE '  - paid type exists: %', paid_exists;
  RAISE NOTICE '  - free type exists: %', free_exists;
  RAISE NOTICE '========================================';

  -- Create 'paid' if it doesn't exist
  IF NOT paid_exists THEN
    RAISE NOTICE 'Creating paid user type...';

    INSERT INTO public.user_types (
      name,
      display_name,
      description,
      category,
      is_system_type,
      can_have_subscription,
      can_have_team,
      sort_order,
      created_at,
      updated_at
    ) VALUES (
      'paid',
      'Paid Customer',
      'Customers with active paid subscriptions',
      'customer',
      true,
      true,
      true,
      11,  -- After 'free' (which is 10)
      NOW(),
      NOW()
    );

    RAISE NOTICE '✓ Created paid user type';
  ELSE
    RAISE NOTICE '✓ Paid user type already exists';
  END IF;

  -- Create 'free' if it doesn't exist either
  IF NOT free_exists THEN
    RAISE NOTICE 'Creating free user type...';

    INSERT INTO public.user_types (
      name,
      display_name,
      description,
      category,
      is_system_type,
      can_have_subscription,
      can_have_team,
      sort_order,
      created_at,
      updated_at
    ) VALUES (
      'free',
      'Free Customer',
      'Customers without paid subscriptions',
      'customer',
      true,
      true,
      true,
      10,
      NOW(),
      NOW()
    );

    RAISE NOTICE '✓ Created free user type';
  ELSE
    RAISE NOTICE '✓ Free user type already exists';
  END IF;
END $$;

-- Show final state
SELECT
  '=== AFTER CREATION ===' as info,
  id,
  name,
  display_name,
  category,
  can_have_subscription,
  is_system_type,
  sort_order
FROM public.user_types
WHERE category = 'customer'
ORDER BY sort_order;

-- Show count
SELECT
  'FINAL COUNT' as status,
  COUNT(*) as total_customer_types
FROM public.user_types
WHERE category = 'customer';

COMMIT;
