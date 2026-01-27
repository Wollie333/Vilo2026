-- ============================================================================
-- Check and Fix Cancellation Policy Assignment
-- For property: Pandokkie House
-- FIXED VERSION - Checks schema first
-- ============================================================================

-- ============================================================================
-- STEP 0: Check the actual schema of cancellation_policies table
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'cancellation_policies'
ORDER BY ordinal_position;

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
-- (Using only columns that definitely exist)
-- ============================================================================

SELECT
  id,
  name,
  description,
  tiers,
  created_at
FROM cancellation_policies
ORDER BY created_at DESC;

-- ============================================================================
-- STEP 3: If property has NO policy, assign a default one
-- (Only run this if STEP 1 shows NULL or TEXT)
-- ============================================================================

-- Option A: Assign the first available cancellation policy
-- Uncomment to run:
/*
UPDATE properties
SET cancellation_policy = (
  SELECT id::text FROM cancellation_policies ORDER BY created_at ASC LIMIT 1
)
WHERE name ILIKE '%Pandokkie%'
  AND (cancellation_policy IS NULL OR cancellation_policy !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
*/

-- Option B: Assign a specific policy by name (e.g., "Flexible", "Moderate", "Strict")
-- Uncomment to run:
/*
UPDATE properties
SET cancellation_policy = (
  SELECT id::text FROM cancellation_policies WHERE name = 'Flexible' LIMIT 1
)
WHERE name ILIKE '%Pandokkie%'
  AND (cancellation_policy IS NULL OR cancellation_policy !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
*/

-- ============================================================================
-- STEP 4: Verify the assignment worked
-- ============================================================================

-- Uncomment after running STEP 3:
/*
SELECT
  p.id,
  p.name as property_name,
  p.cancellation_policy as policy_id,
  cp.name as policy_name,
  cp.description,
  cp.tiers
FROM properties p
LEFT JOIN cancellation_policies cp ON p.cancellation_policy = cp.id::text
WHERE p.name ILIKE '%Pandokkie%'
ORDER BY p.created_at DESC;
*/

-- ============================================================================
-- STEP 5: If NO cancellation policies exist, create a default one
-- ============================================================================

-- Check if any policies exist first:
SELECT COUNT(*) as policy_count FROM cancellation_policies;

-- If count is 0, create a default flexible policy:
-- Uncomment to run:
/*
INSERT INTO cancellation_policies (id, name, description, tiers)
VALUES (
  gen_random_uuid(),
  'Flexible',
  'Cancel up to 7 days before check-in for a full refund. Moderate fees apply for later cancellations.',
  '[
    {"days": 7, "refund": 100},
    {"days": 3, "refund": 50},
    {"days": 0, "refund": 0}
  ]'::jsonb
)
RETURNING id, name, description, tiers;
*/

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
    RAISE NOTICE 'Please create a cancellation policy first using STEP 5.';
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
-- ALTERNATIVE: Create policy AND assign in one step
-- ============================================================================

-- If you need to create a policy and assign it immediately:
-- Uncomment to run:
/*
DO $$
DECLARE
  v_policy_id UUID;
  v_property_id UUID;
BEGIN
  -- Check if Flexible policy already exists
  SELECT id INTO v_policy_id
  FROM cancellation_policies
  WHERE name = 'Flexible'
  LIMIT 1;

  -- If not, create it
  IF v_policy_id IS NULL THEN
    INSERT INTO cancellation_policies (id, name, description, tiers)
    VALUES (
      gen_random_uuid(),
      'Flexible',
      'Cancel up to 7 days before check-in for a full refund. Moderate fees apply for later cancellations.',
      '[
        {"days": 7, "refund": 100},
        {"days": 3, "refund": 50},
        {"days": 0, "refund": 0}
      ]'::jsonb
    )
    RETURNING id INTO v_policy_id;

    RAISE NOTICE 'Created new Flexible cancellation policy with ID: %', v_policy_id;
  ELSE
    RAISE NOTICE 'Using existing Flexible policy with ID: %', v_policy_id;
  END IF;

  -- Get Pandokkie House property ID
  SELECT id INTO v_property_id
  FROM properties
  WHERE name ILIKE '%Pandokkie%'
  LIMIT 1;

  IF v_property_id IS NULL THEN
    RAISE NOTICE 'Property "Pandokkie House" not found!';
  ELSE
    -- Assign the policy
    UPDATE properties
    SET cancellation_policy = v_policy_id::text
    WHERE id = v_property_id;

    RAISE NOTICE 'Successfully assigned cancellation policy to Pandokkie House';
    RAISE NOTICE 'Property ID: %', v_property_id;
  END IF;
END $$;

-- Verify the final result
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
-- 1. Run STEP 0 first to see what columns exist in cancellation_policies
-- 2. Run STEP 1 to check if Pandokkie House has a policy assigned
-- 3. Run STEP 2 to see what policies are available
-- 4. If no policies exist, uncomment and run STEP 5 to create one
-- 5. Uncomment and run the QUICK FIX or ALTERNATIVE section to assign policy
-- 6. Restart backend server after making changes
-- 7. Test the booking wizard to verify modal opens
--
