-- ============================================================================
-- CHECK AND FIX SUPER ADMIN ROLE
-- ============================================================================
-- This script checks the current state and fixes the super admin user
-- ============================================================================

-- STEP 1: Check what roles exist
-- ============================================================================
SELECT
  'Available Roles' as info,
  id,
  name,
  description
FROM roles
ORDER BY name;

-- STEP 2: Check what user types exist
-- ============================================================================
SELECT
  'Available User Types' as info,
  id,
  name,
  category,
  description
FROM user_types
ORDER BY name;

-- STEP 3: Check current super admin state
-- ============================================================================
SELECT
  'Current Super Admin User' as info,
  u.id,
  u.email,
  u.full_name,
  u.user_type_id,
  ut.name as user_type_name,
  ut.category as user_type_category
FROM users u
LEFT JOIN user_types ut ON ut.id = u.user_type_id
WHERE u.email = 'admin@vilo.com';

-- STEP 4: Check super admin's current roles
-- ============================================================================
SELECT
  'Current User Roles' as info,
  ur.id,
  ur.user_id,
  r.name as role_name
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id IN (
  SELECT id FROM users WHERE email = 'admin@vilo.com'
);

-- STEP 5: Check subscription types
-- ============================================================================
SELECT
  'Available Subscription Types' as info,
  id,
  name,
  display_name,
  price_cents,
  currency,
  billing_cycle_days,
  is_active
FROM subscription_types
WHERE is_active = true
ORDER BY price_cents;

-- STEP 6: Check super admin's subscriptions
-- ============================================================================
SELECT
  'Current Subscriptions' as info,
  us.id,
  us.user_id,
  us.subscription_status,
  st.name as plan_name,
  st.display_name
FROM user_subscriptions us
LEFT JOIN subscription_types st ON st.id = us.subscription_type_id
WHERE us.user_id IN (
  SELECT id FROM users WHERE email = 'admin@vilo.com'
);

-- ============================================================================
-- FIX: Add super_admin role if missing
-- ============================================================================
DO $$
DECLARE
  v_user_id UUID;
  v_super_admin_role_id UUID;
  v_existing_role_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FIXING SUPER ADMIN ROLE ===';
  RAISE NOTICE '';

  -- Get super admin user ID
  SELECT id INTO v_user_id
  FROM users
  WHERE email = 'admin@vilo.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Super admin user not found!';
  END IF;

  RAISE NOTICE 'Found user: %', v_user_id;

  -- Get super_admin role ID
  SELECT id INTO v_super_admin_role_id
  FROM roles
  WHERE name = 'super_admin'
  LIMIT 1;

  IF v_super_admin_role_id IS NULL THEN
    RAISE NOTICE '⚠️  super_admin role does not exist in roles table!';
    RAISE NOTICE 'Creating super_admin role...';

    INSERT INTO roles (name, description)
    VALUES ('super_admin', 'Super Administrator with full system access')
    RETURNING id INTO v_super_admin_role_id;

    RAISE NOTICE '✅ Created super_admin role: %', v_super_admin_role_id;
  ELSE
    RAISE NOTICE 'Found super_admin role: %', v_super_admin_role_id;
  END IF;

  -- Check if user already has the role
  SELECT COUNT(*) INTO v_existing_role_count
  FROM user_roles
  WHERE user_id = v_user_id
    AND role_id = v_super_admin_role_id;

  IF v_existing_role_count = 0 THEN
    RAISE NOTICE 'Adding super_admin role to user...';

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_id, v_super_admin_role_id);

    RAISE NOTICE '✅ Successfully assigned super_admin role to user';
  ELSE
    RAISE NOTICE '✅ User already has super_admin role (% assignment(s))', v_existing_role_count;
  END IF;

  -- Clean up any duplicate role assignments
  DELETE FROM user_roles
  WHERE id NOT IN (
    SELECT MIN(id)
    FROM user_roles
    WHERE user_id = v_user_id
    GROUP BY user_id, role_id
  )
  AND user_id = v_user_id;

  GET DIAGNOSTICS v_existing_role_count = ROW_COUNT;
  IF v_existing_role_count > 0 THEN
    RAISE NOTICE '✅ Cleaned up % duplicate role assignment(s)', v_existing_role_count;
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION: Check final state
-- ============================================================================
SELECT
  '=== FINAL STATE ===' as info,
  u.id as user_id,
  u.email,
  u.full_name,
  ut.name as user_type,
  r.name as role_name,
  ur.id as user_role_id
FROM users u
LEFT JOIN user_types ut ON ut.id = u.user_type_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'admin@vilo.com';

-- Show summary
DO $$
DECLARE
  v_user_type TEXT;
  v_role_count INTEGER;
  v_has_super_admin_role BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY ===';

  SELECT ut.name INTO v_user_type
  FROM users u
  LEFT JOIN user_types ut ON ut.id = u.user_type_id
  WHERE u.email = 'admin@vilo.com';

  SELECT COUNT(*) INTO v_role_count
  FROM user_roles ur
  WHERE ur.user_id IN (
    SELECT id FROM users WHERE email = 'admin@vilo.com'
  );

  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id IN (SELECT id FROM users WHERE email = 'admin@vilo.com')
      AND r.name = 'super_admin'
  ) INTO v_has_super_admin_role;

  RAISE NOTICE 'Super Admin Email: admin@vilo.com';
  RAISE NOTICE 'User Type: %', COALESCE(v_user_type, 'NULL');
  RAISE NOTICE 'Total Role Assignments: %', v_role_count;
  RAISE NOTICE 'Has super_admin role: %', v_has_super_admin_role;
  RAISE NOTICE '';

  IF v_user_type = 'super_admin' AND v_has_super_admin_role THEN
    RAISE NOTICE '✅ Super admin is properly configured!';
  ELSIF v_user_type = 'super_admin' AND NOT v_has_super_admin_role THEN
    RAISE WARNING '⚠️  User has super_admin user_type but missing role assignment';
  ELSIF v_user_type IS NULL THEN
    RAISE WARNING '⚠️  User has no user_type assigned';
  ELSE
    RAISE WARNING '⚠️  User type is "%" but should be "super_admin"', v_user_type;
  END IF;

  RAISE NOTICE '';
END $$;
