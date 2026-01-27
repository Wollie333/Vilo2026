-- ============================================================================
-- Step 1: Find Your Email Address
-- ============================================================================
-- Run this first to see all users in the system
-- Find YOUR email from the list below
-- ============================================================================

SELECT
  id,
  email,
  full_name,
  created_at,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM user_user_roles uur
      JOIN user_roles ur ON uur.role_id = ur.id
      WHERE uur.user_id = users.id AND ur.name = 'super_admin'
    )
    THEN '✅ Already Super Admin'
    ELSE '❌ Not Super Admin Yet'
  END as super_admin_status
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- Instructions:
-- ============================================================================
-- 1. Look at the results above
-- 2. Find YOUR email address
-- 3. Copy your email
-- 4. Open GRANT_SUPER_ADMIN.sql
-- 5. Replace 'YOUR_EMAIL_HERE' with your actual email (appears twice)
-- 6. Run GRANT_SUPER_ADMIN.sql again
-- ============================================================================
