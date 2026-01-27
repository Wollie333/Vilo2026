-- ============================================================================
-- Room Creation Diagnostic Query (CORRECTED)
-- This query checks why a user cannot create new rooms
-- Uses the correct table names: user_subscriptions and subscription_types
-- ============================================================================

-- 1. Check current user's subscription and limits
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  ut.name as user_type,
  us.id as subscription_id,
  us.is_active as subscription_active,
  us.subscription_type_id,
  st.name as subscription_type_name,
  st.display_name as subscription_display_name,
  st.limits as subscription_limits,
  st.limits->>'max_rooms' as max_rooms
FROM users u
LEFT JOIN user_types ut ON u.user_type_id = ut.id
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.is_active = true
LEFT JOIN subscription_types st ON us.subscription_type_id = st.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 2. Count rooms per user
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  COUNT(DISTINCT p.id) as total_properties,
  COUNT(r.id) as total_rooms
FROM users u
LEFT JOIN properties p ON p.owner_id = u.id
LEFT JOIN rooms r ON r.property_id = p.id
GROUP BY u.id, u.email, u.full_name
ORDER BY u.created_at DESC
LIMIT 10;

-- 3. Check room limits for most recent user
WITH user_context AS (
  SELECT u.id as user_id
  FROM users u
  ORDER BY u.created_at DESC
  LIMIT 1
),
subscription_info AS (
  SELECT
    uc.user_id,
    us.id as subscription_id,
    us.is_active,
    st.name as subscription_type,
    COALESCE((st.limits->>'max_rooms')::int, 5) as max_rooms_limit
  FROM user_context uc
  LEFT JOIN user_subscriptions us ON uc.user_id = us.user_id AND us.is_active = true
  LEFT JOIN subscription_types st ON us.subscription_type_id = st.id
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
  si.is_active as subscription_active,
  si.subscription_type,
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
  END as remaining_slots;

-- 4. List all properties and their room counts
SELECT
  u.email as owner_email,
  p.id as property_id,
  p.name as property_name,
  p.owner_id,
  COUNT(r.id) as room_count
FROM properties p
LEFT JOIN users u ON p.owner_id = u.id
LEFT JOIN rooms r ON r.property_id = p.id
GROUP BY u.email, p.id, p.name, p.owner_id
ORDER BY p.created_at DESC
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

-- 6. Check all subscription types and their limits
SELECT
  id,
  name,
  display_name,
  limits,
  limits->>'max_rooms' as max_rooms,
  limits->>'max_properties' as max_properties,
  is_active
FROM subscription_types
WHERE is_active = true
ORDER BY sort_order;

-- ============================================================================
-- SOLUTION STEPS
-- ============================================================================

-- If the user has reached their room limit:
-- 1. Check their subscription limits above
-- 2. Either upgrade their subscription OR increase the limit

-- To manually increase a user's room limit (REPLACE user@example.com):
UPDATE subscription_types
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{max_rooms}',
  '20'::jsonb
)
WHERE id IN (
  SELECT subscription_type_id
  FROM user_subscriptions
  WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
    AND is_active = true
);

-- To give unlimited rooms to a specific user:
UPDATE subscription_types
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{max_rooms}',
  '-1'::jsonb
)
WHERE id IN (
  SELECT subscription_type_id
  FROM user_subscriptions
  WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
    AND is_active = true
);

-- To fix properties with NULL owner_id:
UPDATE properties
SET owner_id = (
  SELECT user_id
  FROM companies
  WHERE companies.id = properties.company_id
)
WHERE owner_id IS NULL AND company_id IS NOT NULL;
