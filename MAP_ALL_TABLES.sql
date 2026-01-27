-- ============================================================================
-- MAP ALL TABLES - Get complete database schema
-- ============================================================================
-- Purpose: List all tables and their columns to ensure cleanup script accuracy
-- ============================================================================

-- ============================================================================
-- PART 1: List All Tables in public schema
-- ============================================================================

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- PART 2: Get All Columns for Each Table
-- ============================================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- PART 3: Get All Foreign Key Relationships
-- ============================================================================

SELECT
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- PART 4: Count Records in Each Table
-- ============================================================================

-- This will show how many records are in each table
DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RECORD COUNTS BY TABLE';
  RAISE NOTICE '============================================================================';

  FOR table_record IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', table_record.table_name)
    INTO row_count;

    RAISE NOTICE '% : % records', RPAD(table_record.table_name, 40), row_count;
  END LOOP;

  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- PART 5: Identify Tables That Reference 'users' Table
-- ============================================================================

SELECT DISTINCT
  tc.table_name as table_referencing_users,
  kcu.column_name as user_id_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;
