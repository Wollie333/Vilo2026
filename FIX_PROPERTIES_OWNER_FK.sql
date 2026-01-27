-- ============================================================================
-- QUICK FIX: Properties Owner Foreign Key Issue
-- ============================================================================
--
-- PROBLEM: properties.owner_id references user_profiles instead of users
-- SOLUTION: Drop and recreate the foreign key to reference users table
--
-- Run this in your Supabase SQL Editor to fix the issue immediately
-- ============================================================================

-- Step 1: Drop the incorrect foreign key
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- Step 2: Create the correct foreign key
ALTER TABLE public.properties
ADD CONSTRAINT properties_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- Step 3: Verify the fix
SELECT
  tc.table_name,
  tc.constraint_name,
  ccu.table_name AS references_table,
  'SUCCESS' as status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'properties'
AND tc.constraint_type = 'FOREIGN KEY'
AND tc.constraint_name = 'properties_owner_id_fkey';
