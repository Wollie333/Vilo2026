-- ============================================================================
-- URGENT FIX: Fix companies.user_id foreign key constraint
-- ============================================================================
-- Run this in Supabase SQL Editor NOW to fix the company creation error
-- ============================================================================

-- Drop incorrect foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'companies'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'companies_user_id_fkey'
  ) THEN
    ALTER TABLE public.companies DROP CONSTRAINT companies_user_id_fkey;
    RAISE NOTICE '✓ Dropped incorrect foreign key companies_user_id_fkey';
  ELSE
    RAISE NOTICE 'ℹ Foreign key companies_user_id_fkey does not exist';
  END IF;
END $$;

-- Create correct foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'companies'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'companies_user_id_fkey'
  ) THEN
    ALTER TABLE public.companies
    ADD CONSTRAINT companies_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

    RAISE NOTICE '✓ Created correct foreign key companies_user_id_fkey → users(id)';
  ELSE
    RAISE NOTICE 'ℹ Foreign key companies_user_id_fkey already exists';
  END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
  v_referenced_table TEXT;
BEGIN
  SELECT ccu.table_name INTO v_referenced_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'companies'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'companies_user_id_fkey';

  IF v_referenced_table = 'users' THEN
    RAISE NOTICE '✅ SUCCESS: companies.user_id now correctly references users table';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not verify foreign key constraint';
  END IF;
END $$;

SELECT '✅ Company foreign key fix complete!' as message;
