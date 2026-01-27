-- ============================================================================
-- Check and Fix Cancellation Policy Assignment
-- For property: Pandokkie House
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if property has cancellation policy assigned
-- ============================================================================

SELECT
  id,
  name,
  slug,
  cancellation_policy,
  CASE
    WHEN cancellation_policy IS NULL THEN 'NO POLICY ASSIGNED'
    WHEN cancellation_policy ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID (Good)'
    ELSE 'TEXT (Old Schema)'
  END as policy_type
FROM properties
WHERE name ILIKE '%Pandokkie%' OR name ILIKE '%pandokkie%'
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 2: Check available cancellation policies in database
-- ============================================================================

SELECT
  id,
  name,
  description,
  tiers,
  is_system_default,
  created_at
FROM cancellation_policies
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 3: If property has NO policy, assign a default one
-- (Only run this if STEP 1 shows NULL or TEXT)
-- ============================================================================

-- Option A: Assign the first available cancellation policy
-- UPDATE properties
-- SET cancellation_policy = (
--   SELECT id FROM cancellation_policies ORDER BY created_at ASC LIMIT 1
-- )
-- WHERE name ILIKE '%Pandokkie%'
--   AND (cancellation_policy IS NULL OR cancellation_policy !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Option B: Assign a specific policy by name (e.g., "Flexible", "Moderate", "Strict")
-- UPDATE properties
-- SET cancellation_policy = (
--   SELECT id FROM cancellation_policies WHERE name = 'Flexible' LIMIT 1
-- )
-- WHERE name ILIKE '%Pandokkie%'
--   AND (cancellation_policy IS NULL OR cancellation_policy !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- ============================================================================
-- STEP 4: Verify the assignment worked
-- ============================================================================

-- SELECT
--   p.id,
--   p.name as property_name,
--   p.cancellation_policy as policy_id,
--   cp.name as policy_name,
--   cp.description,
--   cp.tiers
-- FROM properties p
-- LEFT JOIN cancellation_policies cp ON p.cancellation_policy = cp.id::text
-- WHERE p.name ILIKE '%Pandokkie%'
-- ORDER BY p.created_at DESC;

-- ============================================================================
-- STEP 5: If NO cancellation policies exist, create a default one
-- ============================================================================

-- CREATE DEFAULT FLEXIBLE POLICY (if none exist)
-- INSERT INTO cancellation_policies (id, name, description, tiers, is_system_default)
-- VALUES (
--   gen_random_uuid(),
--   'Flexible',
--   'Cancel up to 7 days before check-in for a full refund. Moderate fees apply for later cancellations.',
--   '[
--     {"days": 7, "refund": 100},
--     {"days": 3, "refund": 50},
--     {"days": 0, "refund": 0}
--   ]'::jsonb,
--   true
-- )
-- RETURNING id, name, description, tiers;

-- Then run STEP 3 to assign this new policy to the property

-- ============================================================================
-- QUICK FIX: One-liner to assign first available policy to Pandokkie House
-- ============================================================================

-- Uncomment and run this if you want to quickly fix the issue:
/*
DO $$
DECLARE
  v_policy_id UUID;
  v_property_id UUID;
BEGIN
  -- Get first available cancellation policy
  SELECT id INTO v_policy_id
  FROM cancellation_policies
  ORDER BY created_at ASC
  LIMIT 1;

  -- Get Pandokkie House property ID
  SELECT id INTO v_property_id
  FROM properties
  WHERE name ILIKE '%Pandokkie%'
  LIMIT 1;

  -- Check if we found both
  IF v_policy_id IS NULL THEN
    RAISE NOTICE 'No cancellation policies found in database!';
    RAISE NOTICE 'Please create a cancellation policy first.';
  ELSIF v_property_id IS NULL THEN
    RAISE NOTICE 'Property "Pandokkie House" not found!';
  ELSE
    -- Assign the policy
    UPDATE properties
    SET cancellation_policy = v_policy_id::text
    WHERE id = v_property_id;

    RAISE NOTICE 'Successfully assigned cancellation policy to Pandokkie House';
    RAISE NOTICE 'Policy ID: %', v_policy_id;
    RAISE NOTICE 'Property ID: %', v_property_id;
  END IF;
END $$;

-- Verify the assignment
SELECT
  p.name as property_name,
  cp.name as policy_name,
  cp.description,
  jsonb_array_length(cp.tiers) as tier_count,
  cp.tiers
FROM properties p
LEFT JOIN cancellation_policies cp ON p.cancellation_policy = cp.id::text
WHERE p.name ILIKE '%Pandokkie%';
*/

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- If the property has a cancellation_policy but it's TEXT (not UUID):
--   - This is from the old schema
--   - The backend will not fetch policy details (modal won't work)
--   - You need to either:
--     a) Migrate the text to a proper cancellation policy
--     b) Clear it and assign a UUID-based policy
--
-- To clear old text-based policy and assign new one:
-- UPDATE properties
-- SET cancellation_policy = (SELECT id FROM cancellation_policies WHERE name = 'Flexible' LIMIT 1)
-- WHERE name ILIKE '%Pandokkie%';
--
