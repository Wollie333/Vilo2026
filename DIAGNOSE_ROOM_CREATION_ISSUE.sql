-- ============================================================================
-- Room Creation Diagnostic Query
-- This query checks why a user cannot create new rooms
-- ============================================================================

-- 1. Check current user's subscription and limits
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  u.user_type,
  s.id as subscription_id,
  s.status as subscription_status,
  s.plan_id,
  sp.name as plan_name,
  sp.limits as plan_limits,
  s.limits as subscription_limits
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
ORDER BY u.created_at DESC
LIMIT 5;

-- 2. Count rooms per user
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  COUNT(r.id) as total_rooms
FROM users u
LEFT JOIN properties p ON p.owner_id = u.id
LEFT JOIN rooms r ON r.property_id = p.id
GROUP BY u.id, u.email, u.full_name
ORDER BY u.created_at DESC
LIMIT 5;

-- 3. Check room limits for most recent user
-- (Replace 'YOUR_USER_ID' with actual user ID after running query 1)
WITH user_context AS (
  SELECT u.id as user_id
  FROM users u
  ORDER BY u.created_at DESC
  LIMIT 1
),
subscription_info AS (
  SELECT
    uc.user_id,
    s.id as subscription_id,
    s.status,
    COALESCE(s.limits->>'max_rooms', sp.limits->>'max_rooms', '5')::int as max_rooms_limit
  FROM user_context uc
  LEFT JOIN subscriptions s ON uc.user_id = s.user_id AND s.status = 'active'
  LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
),
room_count AS (
  SELECT
    uc.user_id,
    COUNT(r.id) as current_room_count
  FROM user_context uc
  LEFT JOIN properties p ON p.owner_id = uc.user_id
  LEFT JOIN rooms r ON r.property_id = p.id
  GROUP BY uc.user_id
)
SELECT
  si.user_id,
  si.subscription_id,
  si.status as subscription_status,
  si.max_rooms_limit,
  COALESCE(rc.current_room_count, 0) as current_room_count,
  CASE
    WHEN si.max_rooms_limit = -1 THEN true
    WHEN COALESCE(rc.current_room_count, 0) < si.max_rooms_limit THEN true
    ELSE false
  END as can_create_room,
  CASE
    WHEN si.max_rooms_limit = -1 THEN -1
    ELSE (si.max_rooms_limit - COALESCE(rc.current_room_count, 0))
  END as remaining_slots
FROM subscription_info si
LEFT JOIN room_count rc ON si.user_id = rc.user_id;

-- 4. List all properties and their room counts
SELECT
  u.email as owner_email,
  p.id as property_id,
  p.name as property_name,
  COUNT(r.id) as room_count
FROM properties p
JOIN users u ON p.owner_id = u.id
LEFT JOIN rooms r ON r.property_id = p.id
GROUP BY u.email, p.id, p.name
ORDER BY u.created_at DESC, p.name
LIMIT 20;

-- 5. Check if there are any NULL owner_id properties (from onboarding issue)
SELECT
  id,
  name,
  owner_id,
  company_id,
  created_at
FROM properties
WHERE owner_id IS NULL
LIMIT 10;

-- ============================================================================
-- SOLUTION STEPS
-- ============================================================================

-- If the user has reached their room limit:
-- 1. Check their subscription: SELECT * FROM subscriptions WHERE user_id = 'USER_ID' AND status = 'active';
-- 2. Check the plan limits: SELECT * FROM subscription_plans WHERE id = 'PLAN_ID';
-- 3. Either upgrade their subscription OR increase the limit in their subscription

-- To manually increase a user's room limit:
-- UPDATE subscriptions
-- SET limits = jsonb_set(limits, '{max_rooms}', '10')
-- WHERE user_id = 'USER_ID' AND status = 'active';

-- To give unlimited rooms:
-- UPDATE subscriptions
-- SET limits = jsonb_set(limits, '{max_rooms}', '-1')
-- WHERE user_id = 'USER_ID' AND status = 'active';
