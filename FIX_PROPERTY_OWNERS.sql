-- ============================================================================
-- STEP 1: Fix the Foreign Key Constraint (Run this first)
-- ============================================================================

-- Drop the incorrect foreign key
ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- Create the correct foreign key
ALTER TABLE public.properties
ADD CONSTRAINT properties_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- Verify the fix
SELECT
  tc.table_name,
  tc.constraint_name,
  ccu.table_name AS references_table,
  'FIXED - Now references users table' as status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'properties'
AND tc.constraint_type = 'FOREIGN KEY'
AND tc.constraint_name = 'properties_owner_id_fkey';

-- ============================================================================
-- STEP 2: Update NULL owner_ids to correct user (Run after Step 1)
-- ============================================================================

-- This updates all properties with NULL owner_id to use the company's user_id
UPDATE public.properties p
SET owner_id = c.user_id,
    updated_at = NOW()
FROM public.companies c
WHERE p.company_id = c.id
AND p.owner_id IS NULL;

-- Verify the update
SELECT
  COUNT(*) as total_properties,
  COUNT(owner_id) as properties_with_owner,
  COUNT(*) - COUNT(owner_id) as properties_without_owner
FROM public.properties;
