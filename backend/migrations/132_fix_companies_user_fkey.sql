-- Migration: 132_fix_companies_user_fkey.sql
-- Description: Fix companies.user_id foreign key to reference users table (not user_profiles)
-- Date: 2026-01-21
--
-- ISSUE: The companies table has a foreign key constraint that references user_profiles
-- instead of users, causing company creation to fail with:
-- "Key (user_id)=(...) is not present in table user_profiles"
--
-- FIX: Drop the incorrect constraint and recreate it to reference users table

-- ============================================================================
-- DROP INCORRECT FOREIGN KEY CONSTRAINT
-- ============================================================================

DO $$
BEGIN
  -- Drop the constraint if it exists and references user_profiles
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'companies'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name = 'companies_user_id_fkey'
    AND ccu.table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.companies DROP CONSTRAINT companies_user_id_fkey;
    RAISE NOTICE '✓ Dropped incorrect foreign key companies_user_id_fkey (was referencing user_profiles)';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'companies'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'companies_user_id_fkey'
  ) THEN
    -- Constraint exists but might already be correct - drop it anyway to recreate
    ALTER TABLE public.companies DROP CONSTRAINT companies_user_id_fkey;
    RAISE NOTICE '✓ Dropped existing foreign key companies_user_id_fkey for recreation';
  ELSE
    RAISE NOTICE 'ℹ Foreign key companies_user_id_fkey does not exist';
  END IF;
END $$;

-- ============================================================================
-- CREATE CORRECT FOREIGN KEY CONSTRAINT
-- ============================================================================

DO $$
BEGIN
  -- Add the correct foreign key constraint
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

-- ============================================================================
-- VERIFY THE FIX
-- ============================================================================

DO $$
DECLARE
  v_referenced_table TEXT;
BEGIN
  -- Check what table the foreign key references
  SELECT ccu.table_name INTO v_referenced_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'companies'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name = 'companies_user_id_fkey';

  IF v_referenced_table = 'users' THEN
    RAISE NOTICE '✅ SUCCESS: companies.user_id now correctly references users table';
  ELSIF v_referenced_table = 'user_profiles' THEN
    RAISE EXCEPTION '❌ FAILED: companies.user_id still references user_profiles table';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Could not verify foreign key constraint';
  END IF;
END $$;

-- ============================================================================
-- ADDITIONAL CHECK: Ensure users table exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE EXCEPTION '❌ CRITICAL: users table does not exist!';
  ELSE
    RAISE NOTICE '✓ users table exists';
  END IF;
END $$;
