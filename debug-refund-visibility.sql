-- Debug Refund Visibility Issue
-- Run these queries to diagnose the problem

-- 1. Check your current user ID
SELECT auth.uid() as current_user_id;

-- 2. Check all refunds (using admin client bypassing RLS)
SELECT
  id,
  booking_id,
  requested_by,
  requested_amount,
  status,
  created_at
FROM refund_requests
ORDER BY created_at DESC
LIMIT 5;

-- 3. Test if RLS is blocking you
-- This uses the RLS policy (should show refunds you can access)
SELECT
  id,
  booking_id,
  requested_by,
  requested_amount,
  status
FROM refund_requests
WHERE requested_by = auth.uid();

-- 4. Check if the refund's requested_by matches your user ID
SELECT
  rr.id as refund_id,
  rr.requested_by as refund_requested_by,
  auth.uid() as your_user_id,
  (rr.requested_by = auth.uid()) as "do_they_match?"
FROM refund_requests rr
ORDER BY rr.created_at DESC
LIMIT 5;

-- 5. Check your roles (to see if admin access should work)
SELECT
  ur.user_id,
  r.name as role_name,
  r.id as role_id
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();
