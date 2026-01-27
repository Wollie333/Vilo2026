-- ============================================================================
-- URGENT FIX: Fix properties.owner_id foreign key + back-populate NULL values
-- ============================================================================
-- Run this in Supabase SQL Editor to fix property owner_id constraint and
-- populate NULL owner_id values from companies.user_id
-- ============================================================================

-- Step 1: Drop incorrect foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'properties'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'properties_owner_id_fkey'
  ) THEN
    ALTER TABLE public.properties DROP CONSTRAINT properties_owner_id_fkey;
    RAISE NOTICE '✓ Dropped incorrect foreign key properties_owner_id_fkey';
  ELSE
    RAISE NOTICE 'ℹ Foreign key properties_owner_id_fkey does not exist';
  END IF;
END $$;

-- Step 2: Create correct foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'properties'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'properties_owner_id_fkey'
  ) THEN
    ALTER TABLE public.properties
    ADD CONSTRAINT properties_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;

    RAISE NOTICE '✓ Created correct foreign key properties_owner_id_fkey → users(id)';
  ELSE
    RAISE NOTICE 'ℹ Foreign key properties_owner_id_fkey already exists';
  END IF;
END $$;

-- Step 3: Back-populate NULL owner_id values from companies
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Update properties where owner_id is NULL
  -- Set owner_id to the user_id from the associated company
  UPDATE properties p
  SET owner_id = c.user_id
  FROM companies c
  WHERE p.company_id = c.id
    AND p.owner_id IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count > 0 THEN
    RAISE NOTICE '✓ Back-populated % properties with owner_id from company.user_id', v_updated_count;
  ELSE
    RAISE NOTICE 'ℹ No properties with NULL owner_id found (all already populated)';
  END IF;
END $$;

-- Step 4: Verify the fix
DO $$
DECLARE
  v_referenced_table TEXT;
  v_null_owner_count INTEGER;
BEGIN
  -- Check what table the foreign key references
  SELECT ccu.table_name INTO v_referenced_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'properties'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'properties_owner_id_fkey';

  IF v_referenced_table = 'users' THEN
    RAISE NOTICE '✅ SUCCESS: properties.owner_id now correctly references users table';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not verify foreign key constraint';
  END IF;

  -- Check if any properties still have NULL owner_id
  SELECT COUNT(*) INTO v_null_owner_count
  FROM properties
  WHERE owner_id IS NULL;

  IF v_null_owner_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All properties have valid owner_id values';
  ELSE
    RAISE NOTICE '⚠️ WARNING: % properties still have NULL owner_id (may not have company_id)', v_null_owner_count;
  END IF;
END $$;

-- Step 5: Display summary
SELECT
  COUNT(*) FILTER (WHERE owner_id IS NOT NULL) as properties_with_owner,
  COUNT(*) FILTER (WHERE owner_id IS NULL) as properties_without_owner,
  COUNT(*) as total_properties
FROM properties;

SELECT '✅ Property foreign key fix complete!' as message;
