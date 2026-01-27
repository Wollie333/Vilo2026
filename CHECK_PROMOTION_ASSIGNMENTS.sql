-- ============================================================================
-- Check Promotion Assignments
-- This query verifies that promotions are properly assigned to rooms
-- ============================================================================

-- 1. Check all promotions
SELECT
  id,
  code,
  name,
  property_id,
  is_active,
  created_at
FROM room_promotions
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check promotion assignments in junction table
SELECT
  rpa.id as assignment_id,
  rpa.room_id,
  rpa.promotion_id,
  r.name as room_name,
  rp.code as promo_code,
  rp.name as promo_name,
  rpa.assigned_at,
  rpa.assigned_by
FROM room_promotion_assignments rpa
INNER JOIN rooms r ON rpa.room_id = r.id
INNER JOIN room_promotions rp ON rpa.promotion_id = rp.id
ORDER BY rpa.assigned_at DESC
LIMIT 20;

-- 3. Check promotions with room counts
SELECT
  rp.id,
  rp.code,
  rp.name,
  rp.property_id,
  COUNT(rpa.room_id) as room_count,
  STRING_AGG(r.name, ', ') as assigned_rooms
FROM room_promotions rp
LEFT JOIN room_promotion_assignments rpa ON rp.id = rpa.promotion_id
LEFT JOIN rooms r ON rpa.room_id = r.id
GROUP BY rp.id, rp.code, rp.name, rp.property_id
ORDER BY rp.created_at DESC
LIMIT 10;

-- 4. Check specific room's promotions (REPLACE 'your-room-id' with actual room ID)
-- SELECT
--   r.id as room_id,
--   r.name as room_name,
--   rp.id as promotion_id,
--   rp.code,
--   rp.name as promotion_name,
--   rp.discount_type,
--   rp.discount_value
-- FROM rooms r
-- LEFT JOIN room_promotion_assignments rpa ON r.id = rpa.room_id
-- LEFT JOIN room_promotions rp ON rpa.promotion_id = rp.id
-- WHERE r.id = 'your-room-id';

-- 5. Check for orphaned promotions (created but not assigned)
SELECT
  rp.id,
  rp.code,
  rp.name,
  rp.created_at,
  COUNT(rpa.id) as assignment_count
FROM room_promotions rp
LEFT JOIN room_promotion_assignments rpa ON rp.id = rpa.promotion_id
GROUP BY rp.id, rp.code, rp.name, rp.created_at
HAVING COUNT(rpa.id) = 0
ORDER BY rp.created_at DESC;
