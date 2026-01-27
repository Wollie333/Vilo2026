-- ============================================================================
-- CREATE NEW SUPER ADMIN USER
-- ============================================================================
-- Run this to create a fresh super admin after cleanup deleted everyone
-- ============================================================================

-- Step 1: Create user in auth.users (Supabase Auth)
-- Replace with your desired email and password
DO $$
DECLARE
  new_user_id UUID;
  super_admin_role_id UUID;
  user_type_id UUID;
BEGIN
  -- Generate new user ID
  new_user_id := gen_random_uuid();

  -- Get super_admin role ID
  SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';

  -- Get a user_type_id (use first available)
  SELECT id INTO user_type_id FROM public.user_types LIMIT 1;

  -- Insert into public.users table
  INSERT INTO public.users (
    id,
    email,
    full_name,
    user_type_id,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'admin@vilo.com',  -- Change this to your email
    'Super Admin',      -- Change this to your name
    user_type_id,
    NOW(),
    NOW()
  );

  -- Assign super_admin role
  INSERT INTO public.user_roles (user_id, role_id, created_at, updated_at)
  VALUES (new_user_id, super_admin_role_id, NOW(), NOW());

  RAISE NOTICE 'Created super admin user: % (ID: %)', 'admin@vilo.com', new_user_id;
  RAISE NOTICE 'Please update auth.users table manually or use Supabase Auth to set password';
END $$;

-- Step 2: Verify user was created
SELECT
  u.id,
  u.email,
  u.full_name,
  r.name as role_name
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'super_admin';

-- ============================================================================
-- IMPORTANT: You need to create the auth.users entry separately!
-- ============================================================================
-- Go to Supabase Dashboard → Authentication → Users → Add User
-- Use the same email: admin@vilo.com
-- Set a password
-- The user_id should match the one created above
-- ============================================================================
