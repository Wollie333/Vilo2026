-- ============================================================================
-- STEP-BY-STEP: Grant Super Admin Access
-- ============================================================================
--
-- BEFORE YOU RUN THIS:
-- 1. First run FIND_MY_EMAIL.sql to see your email
-- 2. Copy your email from the results
-- 3. Replace the email in line 18 below with YOUR email
-- 4. Replace the email in line 64 below with YOUR email (for verification)
-- 5. Click Run
--
-- ============================================================================

-- 👇 STEP 1: CHANGE THIS LINE - PUT YOUR EMAIL HERE 👇
-- Example: 'john@example.com'

DO $$
DECLARE
  v_user_id UUID;
  v_super_admin_role_id UUID;
  v_user_email TEXT := 'YOUR_EMAIL_HERE'; -- 👈👈👈 CHANGE THIS LINE!!!
BEGIN

  RAISE NOTICE '';
  RAISE NOTICE '🔍 Looking for user with email: %', v_user_email;
  RAISE NOTICE '';

  -- Find user by email
  SELECT id INTO v_user_id
  FROM users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" not found. Did you replace YOUR_EMAIL_HERE with your actual email?', v_user_email;
  END IF;

  RAISE NOTICE '✅ Found user!';
  RAISE NOTICE '   Email: %', v_user_email;
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '';

  -- Get or create super_admin role
  SELECT id INTO v_super_admin_role_id
  FROM user_roles
  WHERE name = 'super_admin';

  IF v_super_admin_role_id IS NULL THEN
    RAISE NOTICE '📝 Creating super_admin role...';
    INSERT INTO user_roles (name, display_name, description, permissions)
    VALUES (
      'super_admin',
      'Super Admin',
      'Full system access including platform administration and email management',
      '{"*": ["*"]}'::jsonb
    )
    RETURNING id INTO v_super_admin_role_id;
    RAISE NOTICE '✅ Created super_admin role: %', v_super_admin_role_id;
  ELSE
    RAISE NOTICE '✅ super_admin role exists: %', v_super_admin_role_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🔐 Assigning super_admin role to user...';

  -- Assign super_admin role to user
  INSERT INTO user_user_roles (user_id, role_id)
  VALUES (v_user_id, v_super_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE '✅ Done!';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 SUCCESS! % is now a SUPER ADMIN', v_user_email;
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '1. Log out of your application';
  RAISE NOTICE '2. Log back in to refresh your auth token';
  RAISE NOTICE '3. Navigate to /admin/email';
  RAISE NOTICE '4. You should now see 16 email templates ready to manage!';
  RAISE NOTICE '';

END $$;

-- ============================================================================
-- VERIFICATION: Check your new role
-- ============================================================================
-- 👇 STEP 2: CHANGE THIS LINE TOO - PUT YOUR EMAIL HERE 👇

SELECT
  u.email,
  u.full_name,
  ur.name as role_name,
  ur.display_name as role_display_name,
  uur.created_at as role_assigned_at
FROM users u
JOIN user_user_roles uur ON u.id = uur.user_id
JOIN user_roles ur ON uur.role_id = ur.id
WHERE u.email = 'YOUR_EMAIL_HERE' -- 👈👈👈 CHANGE THIS LINE TOO!!!
ORDER BY uur.created_at DESC;

-- You should see a row with: role_name = 'super_admin'
