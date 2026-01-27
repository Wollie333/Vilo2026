-- ============================================================================
-- VERIFY PAID USER TYPE EXISTS
-- ============================================================================
-- Check if 'paid' user type exists for upgrade after payment
-- ============================================================================

-- Check for paid user type
SELECT
  'PAID USER TYPE' as check_name,
  id,
  name,
  display_name,
  category,
  can_have_subscription,
  is_system_type
FROM public.user_types
WHERE name = 'paid' AND category = 'customer';

-- Check all customer user types
SELECT
  'ALL CUSTOMER TYPES' as check_name,
  id,
  name,
  display_name,
  category,
  can_have_subscription
FROM public.user_types
WHERE category = 'customer'
ORDER BY name;

-- If paid type doesn't exist, create it
DO $$
DECLARE
  paid_type_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO paid_type_count
  FROM public.user_types
  WHERE name = 'paid' AND category = 'customer';

  IF paid_type_count = 0 THEN
    RAISE NOTICE 'Creating paid user type...';

    INSERT INTO public.user_types (
      name,
      display_name,
      description,
      category,
      is_system_type,
      can_have_subscription,
      can_have_team,
      sort_order
    ) VALUES (
      'paid',
      'Paid Customer',
      'Customers with active paid subscriptions',
      'customer',
      true,
      true,
      true,
      10
    );

    RAISE NOTICE '✓ Paid user type created successfully';
  ELSE
    RAISE NOTICE '✓ Paid user type already exists';
  END IF;
END $$;

-- Verify again
SELECT
  'FINAL CHECK' as status,
  COUNT(*) as paid_type_count
FROM public.user_types
WHERE name = 'paid' AND category = 'customer';
