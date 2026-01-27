-- ============================================================================
-- IMMEDIATE FIX: Update Pandokkie House to use UUID-based policy
-- ============================================================================

-- Current state: cancellation_policy = "moderate" (TEXT - doesn't work)
-- Need to change to: cancellation_policy = "8fd5718f-3387-4b0f-93aa-b20880081b6e" (UUID - works)

-- ============================================================================
-- FIX: Assign the Standard policy to Pandokkie House
-- ============================================================================

UPDATE properties
SET cancellation_policy = '8fd5718f-3387-4b0f-93aa-b20880081b6e'
WHERE slug = 'pandokkie-house';

-- ============================================================================
-- VERIFY: Check that it worked
-- ============================================================================

SELECT
  p.id,
  p.name as property_name,
  p.slug,
  p.cancellation_policy as policy_id,
  cp.name as policy_name,
  cp.description,
  jsonb_array_length(cp.tiers) as tier_count,
  cp.tiers
FROM properties p
LEFT JOIN cancellation_policies cp ON p.cancellation_policy = cp.id::text
WHERE p.slug = 'pandokkie-house';

-- ============================================================================
-- EXPECTED RESULT:
-- ============================================================================
-- property_name: Pandokkie House
-- policy_id: 8fd5718f-3387-4b0f-93aa-b20880081b6e
-- policy_name: Standard
-- tier_count: 2
-- tiers: [{"days": 7, "refund": 100}, {"days": 0, "refund": 0}]
