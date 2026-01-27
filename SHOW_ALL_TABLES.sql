-- ============================================================================
-- SHOW ALL TABLES - Quick view of database structure
-- ============================================================================

-- Show all tables and their record counts
DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ALL TABLES IN DATABASE WITH RECORD COUNTS';
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

    IF row_count > 0 THEN
      RAISE NOTICE '% : % records', RPAD(table_record.table_name, 40), row_count;
    END IF;
  END LOOP;

  RAISE NOTICE '============================================================================';
END $$;

-- List all tables (simple view)
SELECT
  table_name,
  (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
