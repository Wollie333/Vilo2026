-- Migration: 096_remove_legacy_pricing_columns.sql
-- Description: Remove duplicate pricing columns after migration to pricing_tiers
-- Date: 2026-01-16
-- Author: Database Cleanup Phase 1
-- WARNING: Run code updates FIRST before executing this migration

-- ============================================================================
-- PRE-FLIGHT CHECKS
-- ============================================================================

DO $$
DECLARE
  empty_count INTEGER;
  mismatch_count INTEGER;
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 096: Remove Legacy Pricing Columns';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Running pre-flight checks...';
  RAISE NOTICE '';

  -- Check 1: Ensure all plans have pricing_tiers
  SELECT COUNT(*) INTO empty_count
  FROM subscription_types
  WHERE pricing_tiers = '{}'::jsonb OR pricing_tiers IS NULL;

  IF empty_count > 0 THEN
    RAISE EXCEPTION 'MIGRATION BLOCKED: % subscription type(s) have empty pricing_tiers. Please backfill first.', empty_count;
  END IF;

  RAISE NOTICE '✓ Check 1 passed: All plans have pricing_tiers populated';

  -- Check 2: Verify pricing_tiers match billing_types
  SELECT COUNT(*) INTO mismatch_count
  FROM subscription_types
  WHERE (
    ((billing_types->>'monthly')::boolean = true AND pricing_tiers->'monthly' IS NULL) OR
    ((billing_types->>'annual')::boolean = true AND pricing_tiers->'annual' IS NULL) OR
    ((billing_types->>'one_off')::boolean = true AND pricing_tiers->'one_off' IS NULL)
  );

  IF mismatch_count > 0 THEN
    RAISE WARNING '⚠ Found % subscription type(s) with billing_types/pricing_tiers mismatch', mismatch_count;
    RAISE WARNING '  These plans may need manual review after migration';
  ELSE
    RAISE NOTICE '✓ Check 2 passed: billing_types match pricing_tiers for all plans';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Pre-flight checks completed successfully';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: BACKUP DATA (safety measure)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 1: Creating backup table...';
END $$;

-- Create temporary backup table
DROP TABLE IF EXISTS subscription_types_pricing_backup;
CREATE TABLE subscription_types_pricing_backup AS
SELECT
  id,
  name,
  pricing,
  price_cents,
  billing_cycle_days,
  is_recurring,
  pricing_tiers,
  billing_types,
  created_at,
  updated_at
FROM subscription_types;

DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM subscription_types_pricing_backup;
  RAISE NOTICE '✓ Backup created: subscription_types_pricing_backup (%  rows)', backup_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: REMOVE LEGACY COLUMNS (in separate transactions for safety)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 2: Removing legacy pricing columns...';
  RAISE NOTICE '';
END $$;

-- Drop legacy pricing JSONB column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscription_types'
    AND column_name = 'pricing'
  ) THEN
    ALTER TABLE subscription_types DROP COLUMN pricing;
    RAISE NOTICE '✓ Removed column: pricing';
  ELSE
    RAISE NOTICE '→ Column pricing already removed';
  END IF;
END $$;

-- Drop legacy price_cents column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscription_types'
    AND column_name = 'price_cents'
  ) THEN
    ALTER TABLE subscription_types DROP COLUMN price_cents;
    RAISE NOTICE '✓ Removed column: price_cents';
  ELSE
    RAISE NOTICE '→ Column price_cents already removed';
  END IF;
END $$;

-- Drop legacy billing_cycle_days column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscription_types'
    AND column_name = 'billing_cycle_days'
  ) THEN
    ALTER TABLE subscription_types DROP COLUMN billing_cycle_days;
    RAISE NOTICE '✓ Removed column: billing_cycle_days';
  ELSE
    RAISE NOTICE '→ Column billing_cycle_days already removed';
  END IF;
END $$;

-- Drop legacy is_recurring column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscription_types'
    AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE subscription_types DROP COLUMN is_recurring;
    RAISE NOTICE '✓ Removed column: is_recurring';
  ELSE
    RAISE NOTICE '→ Column is_recurring already removed';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: UPDATE CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 3: Updating constraints...';
  RAISE NOTICE '';
END $$;

-- Ensure pricing_tiers is never null
ALTER TABLE subscription_types
  ALTER COLUMN pricing_tiers SET DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscription_types'
    AND column_name = 'pricing_tiers'
    AND is_nullable = 'YES'
  ) THEN
    -- First, update any NULL values
    UPDATE subscription_types SET pricing_tiers = '{}'::jsonb WHERE pricing_tiers IS NULL;
    -- Then set NOT NULL constraint
    ALTER TABLE subscription_types ALTER COLUMN pricing_tiers SET NOT NULL;
    RAISE NOTICE '✓ Set pricing_tiers as NOT NULL';
  ELSE
    RAISE NOTICE '→ pricing_tiers already NOT NULL';
  END IF;
END $$;

-- Ensure billing_types is never null
ALTER TABLE subscription_types
  ALTER COLUMN billing_types SET DEFAULT '{"monthly": false, "annual": false, "one_off": false}'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscription_types'
    AND column_name = 'billing_types'
    AND is_nullable = 'YES'
  ) THEN
    -- First, update any NULL values
    UPDATE subscription_types SET billing_types = '{"monthly": false, "annual": false, "one_off": false}'::jsonb WHERE billing_types IS NULL;
    -- Then set NOT NULL constraint
    ALTER TABLE subscription_types ALTER COLUMN billing_types SET NOT NULL;
    RAISE NOTICE '✓ Set billing_types as NOT NULL';
  ELSE
    RAISE NOTICE '→ billing_types already NOT NULL';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  remaining_columns TEXT[];
  plan_count INTEGER;
  plans_with_pricing_tiers INTEGER;
BEGIN
  RAISE NOTICE 'Step 4: Verification...';
  RAISE NOTICE '';

  -- Check if any legacy columns still exist
  SELECT ARRAY_AGG(column_name) INTO remaining_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'subscription_types'
    AND column_name IN ('pricing', 'price_cents', 'billing_cycle_days', 'is_recurring');

  IF remaining_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Migration failed: Legacy columns still exist: %', remaining_columns;
  ELSE
    RAISE NOTICE '✓ All legacy columns removed successfully';
  END IF;

  -- Verify all plans have pricing_tiers
  SELECT COUNT(*) INTO plan_count FROM subscription_types;
  SELECT COUNT(*) INTO plans_with_pricing_tiers
  FROM subscription_types
  WHERE pricing_tiers IS NOT NULL AND pricing_tiers != '{}'::jsonb;

  RAISE NOTICE '✓ Total plans: %', plan_count;
  RAISE NOTICE '✓ Plans with pricing_tiers: %', plans_with_pricing_tiers;

  IF plan_count != plans_with_pricing_tiers THEN
    RAISE WARNING '⚠ Some plans have empty pricing_tiers - may need review';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 096: Remove legacy pricing columns - COMPLETED';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  ✓ Removed columns: pricing, price_cents, billing_cycle_days, is_recurring';
  RAISE NOTICE '  ✓ Updated constraints on pricing_tiers and billing_types';
  RAISE NOTICE '  ✓ Backup table: subscription_types_pricing_backup';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Verify pricing displays correctly on all pages';
  RAISE NOTICE '  2. Test checkout flows (monthly and annual)';
  RAISE NOTICE '  3. Monitor for 48 hours';
  RAISE NOTICE '  4. After 30 days of stable operation:';
  RAISE NOTICE '     DROP TABLE subscription_types_pricing_backup;';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Rollback Instructions (if needed within 30 days):';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '  ALTER TABLE subscription_types ADD COLUMN pricing JSONB;';
  RAISE NOTICE '  ALTER TABLE subscription_types ADD COLUMN price_cents INTEGER;';
  RAISE NOTICE '  ALTER TABLE subscription_types ADD COLUMN billing_cycle_days INTEGER;';
  RAISE NOTICE '  ALTER TABLE subscription_types ADD COLUMN is_recurring BOOLEAN;';
  RAISE NOTICE '';
  RAISE NOTICE '  UPDATE subscription_types st';
  RAISE NOTICE '  SET pricing = b.pricing,';
  RAISE NOTICE '      price_cents = b.price_cents,';
  RAISE NOTICE '      billing_cycle_days = b.billing_cycle_days,';
  RAISE NOTICE '      is_recurring = b.is_recurring';
  RAISE NOTICE '  FROM subscription_types_pricing_backup b WHERE st.id = b.id;';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
END $$;
