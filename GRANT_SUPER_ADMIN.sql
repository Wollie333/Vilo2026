-- ============================================================================
-- Grant Super Admin Access
-- ============================================================================
-- Run this in Supabase SQL Editor to grant yourself super admin access
-- IMPORTANT: Replace YOUR_EMAIL_HERE with your actual email address
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_super_admin_role_id UUID;
  v_user_email TEXT := 'YOUR_EMAIL_HERE'; -- 👈 REPLACE THIS WITH YOUR EMAIL
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please check the email and try again.', v_user_email;
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', v_user_email, v_user_id;

  -- Get or create super_admin role
  SELECT id INTO v_super_admin_role_id
  FROM user_roles
  WHERE name = 'super_admin';

  -- If super_admin role doesn't exist, create it
  IF v_super_admin_role_id IS NULL THEN
    INSERT INTO user_roles (
      name,
      display_name,
      description,
      permissions
    )
    VALUES (
      'super_admin',
      'Super Admin',
      'Full system access including platform administration and email management',
      '{"*": ["*"]}'::jsonb
    )
    RETURNING id INTO v_super_admin_role_id;

    RAISE NOTICE '✅ Created super_admin role: %', v_super_admin_role_id;
  ELSE
    RAISE NOTICE '✅ super_admin role already exists: %', v_super_admin_role_id;
  END IF;

  -- Assign super_admin role to user
  INSERT INTO user_user_roles (user_id, role_id)
  VALUES (v_user_id, v_super_admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE '🎉 SUCCESS! User % is now a super admin', v_user_email;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Log out of your application';
  RAISE NOTICE '2. Log back in to refresh your auth token';
  RAISE NOTICE '3. Navigate to /admin/email to access Email Management';

END $$;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- After running the above, run this to verify your roles:

SELECT
  u.email,
  u.full_name,
  ur.name as role_name,
  ur.display_name as role_display_name,
  uur.created_at as role_assigned_at
FROM users u
JOIN user_user_roles uur ON u.id = uur.user_id
JOIN user_roles ur ON uur.role_id = ur.id
WHERE u.email = 'YOUR_EMAIL_HERE' -- 👈 REPLACE THIS TOO
ORDER BY uur.created_at DESC;
