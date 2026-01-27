-- Migration: 097_fix_subscription_active_status.sql
-- Description: Ensure all subscription types have is_active set correctly
-- Date: 2026-01-16
-- Author: Claude Code

-- ============================================================================
-- FIX SUBSCRIPTION ACTIVE STATUS
-- ============================================================================

-- Update any NULL is_active values to true (default behavior)
UPDATE subscription_types
SET is_active = true
WHERE is_active IS NULL;

-- Ensure is_active has proper default
ALTER TABLE subscription_types
  ALTER COLUMN is_active SET DEFAULT true;

-- Ensure is_active is never null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscription_types'
    AND column_name = 'is_active'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE subscription_types ALTER COLUMN is_active SET NOT NULL;
    RAISE NOTICE '✓ Set is_active as NOT NULL';
  ELSE
    RAISE NOTICE '→ is_active already NOT NULL';
  END IF;
END $$;

-- Verification
DO $$
DECLARE
  total_plans INTEGER;
  active_plans INTEGER;
  inactive_plans INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_plans FROM subscription_types;
  SELECT COUNT(*) INTO active_plans FROM subscription_types WHERE is_active = true;
  SELECT COUNT(*) INTO inactive_plans FROM subscription_types WHERE is_active = false;

  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Subscription Plans Active Status Summary:';
  RAISE NOTICE '  Total Plans: %', total_plans;
  RAISE NOTICE '  Active Plans: %', active_plans;
  RAISE NOTICE '  Inactive Plans: %', inactive_plans;
  RAISE NOTICE '==========================================================';
END $$;
