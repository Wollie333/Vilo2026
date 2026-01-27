-- ============================================================================
-- CHECK ALL MEMBER TYPES (Should be 5 total)
-- ============================================================================
-- Expected:
--   SaaS (internal): super_admin, admin
--   Customer: guest, free, paid
-- ============================================================================

-- Show ALL user types
SELECT
  '=== ALL USER TYPES ===' as info,
  id,
  name,
  display_name,
  category,
  can_have_subscription,
  is_system_type,
  sort_order
FROM public.user_types
ORDER BY category, sort_order;

-- Count by category
SELECT
  '=== COUNT BY CATEGORY ===' as info,
  category,
  COUNT(*) as count
FROM public.user_types
GROUP BY category
ORDER BY category;

-- Total count
SELECT
  '=== TOTAL COUNT ===' as info,
  COUNT(*) as total_user_types
FROM public.user_types;

-- Check which ones are missing
DO $$
DECLARE
  super_admin_exists BOOLEAN;
  admin_exists BOOLEAN;
  guest_exists BOOLEAN;
  free_exists BOOLEAN;
  paid_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_types WHERE name = 'super_admin') INTO super_admin_exists;
  SELECT EXISTS(SELECT 1 FROM public.user_types WHERE name = 'admin') INTO admin_exists;
  SELECT EXISTS(SELECT 1 FROM public.user_types WHERE name = 'guest') INTO guest_exists;
  SELECT EXISTS(SELECT 1 FROM public.user_types WHERE name = 'free') INTO free_exists;
  SELECT EXISTS(SELECT 1 FROM public.user_types WHERE name = 'paid') INTO paid_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Member Type Existence Check:';
  RAISE NOTICE '  SaaS Types:';
  RAISE NOTICE '    - super_admin: %', super_admin_exists;
  RAISE NOTICE '    - admin: %', admin_exists;
  RAISE NOTICE '  Customer Types:';
  RAISE NOTICE '    - guest: %', guest_exists;
  RAISE NOTICE '    - free: %', free_exists;
  RAISE NOTICE '    - paid: %', paid_exists;
  RAISE NOTICE '========================================';

  -- Create missing types
  IF NOT super_admin_exists THEN
    RAISE NOTICE 'Creating super_admin type...';
    INSERT INTO public.user_types (name, display_name, description, category, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('super_admin', 'Super Administrator', 'Platform super administrators', 'saas', true, false, false, 1);
  END IF;

  IF NOT admin_exists THEN
    RAISE NOTICE 'Creating admin type...';
    INSERT INTO public.user_types (name, display_name, description, category, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('admin', 'Administrator', 'Platform administrators', 'saas', true, false, false, 2);
  END IF;

  IF NOT guest_exists THEN
    RAISE NOTICE 'Creating guest type...';
    INSERT INTO public.user_types (name, display_name, description, category, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('guest', 'Guest', 'Public website booking guests', 'customer', false, false, false, 10);
  END IF;

  IF NOT free_exists THEN
    RAISE NOTICE 'Creating free type...';
    INSERT INTO public.user_types (name, display_name, description, category, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('free', 'Free Customer', 'Customers without paid subscriptions', 'customer', true, true, true, 11);
  END IF;

  IF NOT paid_exists THEN
    RAISE NOTICE 'Creating paid type...';
    INSERT INTO public.user_types (name, display_name, description, category, is_system_type, can_have_subscription, can_have_team, sort_order)
    VALUES ('paid', 'Paid Customer', 'Customers with active paid subscriptions', 'customer', true, true, true, 12);
  END IF;
END $$;

-- Final verification - should show 5 types
SELECT
  '=== FINAL STATE (Should be 5) ===' as info,
  name,
  display_name,
  category,
  sort_order
FROM public.user_types
ORDER BY category, sort_order;
