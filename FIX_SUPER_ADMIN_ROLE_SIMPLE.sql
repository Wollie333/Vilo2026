-- ============================================================================
-- FIX SUPER ADMIN ROLE - SIMPLE VERSION
-- ============================================================================
-- This script checks and fixes the super admin role assignment
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
  'Current User Roles (BEFORE FIX)' as info,
  ur.id,
  ur.user_id,
  r.name as role_name
FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id IN (
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
  v_deleted_count INTEGER;
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
    RAISE EXCEPTION 'Super admin user (admin@vilo.com) not found!';
  END IF;

  RAISE NOTICE '✓ Found user: %', v_user_id;

  -- Get super_admin role ID
  SELECT id INTO v_super_admin_role_id
  FROM roles
  WHERE name = 'super_admin'
  LIMIT 1;

  IF v_super_admin_role_id IS NULL THEN
    RAISE NOTICE '⚠️  super_admin role does not exist in roles table!';
    RAISE NOTICE '   Creating super_admin role...';

    INSERT INTO roles (name, description)
    VALUES ('super_admin', 'Super Administrator with full system access')
    RETURNING id INTO v_super_admin_role_id;

    RAISE NOTICE '✅ Created super_admin role: %', v_super_admin_role_id;
  ELSE
    RAISE NOTICE '✓ Found super_admin role: %', v_super_admin_role_id;
  END IF;

  -- Check if user already has the role
  SELECT COUNT(*) INTO v_existing_role_count
  FROM user_roles
  WHERE user_id = v_user_id
    AND role_id = v_super_admin_role_id;

  IF v_existing_role_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  User does NOT have super_admin role assigned';
    RAISE NOTICE '   Adding super_admin role to user...';

    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_id, v_super_admin_role_id);

    RAISE NOTICE '✅ Successfully assigned super_admin role to user';
  ELSIF v_existing_role_count = 1 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ User already has super_admin role (1 assignment)';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  User has % super_admin role assignments (duplicate detected)', v_existing_role_count;
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

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  IF v_deleted_count > 0 THEN
    RAISE NOTICE '✅ Cleaned up % duplicate role assignment(s)', v_deleted_count;
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION: Check final state
-- ============================================================================
SELECT
  '=== FINAL STATE (AFTER FIX) ===' as info,
  u.id as user_id,
  u.email,
  u.full_name,
  ut.name as user_type,
  r.name as role_name,
  ur.id as user_role_id,
  ur.created_at as role_assigned_at
FROM users u
LEFT JOIN user_types ut ON ut.id = u.user_type_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'admin@vilo.com'
ORDER BY r.name;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
DECLARE
  v_user_type TEXT;
  v_role_count INTEGER;
  v_has_super_admin_role BOOLEAN;
  v_role_names TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '           SUMMARY REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Get user type
  SELECT ut.name INTO v_user_type
  FROM users u
  LEFT JOIN user_types ut ON ut.id = u.user_type_id
  WHERE u.email = 'admin@vilo.com';

  -- Get role count
  SELECT COUNT(*) INTO v_role_count
  FROM user_roles ur
  WHERE ur.user_id IN (
    SELECT id FROM users WHERE email = 'admin@vilo.com'
  );

  -- Check if has super_admin role
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id IN (SELECT id FROM users WHERE email = 'admin@vilo.com')
      AND r.name = 'super_admin'
  ) INTO v_has_super_admin_role;

  -- Get all role names
  SELECT STRING_AGG(r.name, ', ' ORDER BY r.name) INTO v_role_names
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id IN (SELECT id FROM users WHERE email = 'admin@vilo.com');

  RAISE NOTICE 'Email:              admin@vilo.com';
  RAISE NOTICE 'User Type:          %', COALESCE(v_user_type, '(NULL - NOT SET)');
  RAISE NOTICE 'Role Count:         %', v_role_count;
  RAISE NOTICE 'Roles:              %', COALESCE(v_role_names, '(NONE)');
  RAISE NOTICE 'Has super_admin:    %', v_has_super_admin_role;
  RAISE NOTICE '';

  IF v_user_type = 'super_admin' AND v_has_super_admin_role THEN
    RAISE NOTICE '✅ ✅ ✅  SUPER ADMIN IS PROPERLY CONFIGURED!  ✅ ✅ ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'The user has:';
    RAISE NOTICE '  1. user_type = super_admin';
    RAISE NOTICE '  2. role = super_admin';
    RAISE NOTICE '';
    RAISE NOTICE 'Dashboard should now load successfully!';
  ELSIF v_user_type = 'super_admin' AND NOT v_has_super_admin_role THEN
    RAISE WARNING '⚠️  WARNING: User has super_admin user_type but MISSING role assignment';
    RAISE WARNING 'This should have been fixed by this script. Please check output above.';
  ELSIF v_user_type IS NULL THEN
    RAISE WARNING '⚠️  WARNING: User has NO user_type assigned!';
    RAISE WARNING 'Please assign user_type = super_admin manually.';
  ELSE
    RAISE WARNING '⚠️  WARNING: User type is "%" but should be "super_admin"', v_user_type;
    RAISE WARNING 'Please change user_type to super_admin manually.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
