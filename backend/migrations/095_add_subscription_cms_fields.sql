-- Migration: 095_add_subscription_cms_fields.sql
-- Description: Add slug and CMS fields to subscription_types for individual checkout pages
-- Date: 2026-01-15

-- ============================================================================
-- ADD CMS FIELDS TO SUBSCRIPTION_TYPES
-- ============================================================================

-- Add slug and customization fields for checkout pages
ALTER TABLE subscription_types
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_headline TEXT,
  ADD COLUMN IF NOT EXISTS custom_description TEXT,
  ADD COLUMN IF NOT EXISTS custom_features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_cta_text VARCHAR(100) DEFAULT 'Get Started',
  ADD COLUMN IF NOT EXISTS checkout_badge VARCHAR(50),
  ADD COLUMN IF NOT EXISTS checkout_accent_color VARCHAR(20);

-- ============================================================================
-- BACKFILL SLUGS FROM EXISTING PLAN NAMES
-- ============================================================================

-- Generate slugs from existing plan names (lowercase, replace non-alphanumeric with hyphens)
UPDATE subscription_types
SET slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi'))
WHERE slug = '' OR slug IS NULL;

-- Remove trailing/leading hyphens
UPDATE subscription_types
SET slug = trim(both '-' from slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- ============================================================================
-- ADD CONSTRAINTS AND INDEXES
-- ============================================================================

-- Make slug unique and required
ALTER TABLE subscription_types
  ALTER COLUMN slug DROP DEFAULT;

-- Add unique constraint
ALTER TABLE subscription_types
  DROP CONSTRAINT IF EXISTS subscription_types_slug_key;

ALTER TABLE subscription_types
  ADD CONSTRAINT subscription_types_slug_key UNIQUE (slug);

-- Add check constraint for slug format (lowercase alphanumeric and hyphens only)
ALTER TABLE subscription_types
  DROP CONSTRAINT IF EXISTS subscription_types_slug_check;

ALTER TABLE subscription_types
  ADD CONSTRAINT subscription_types_slug_check
    CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) > 0);

-- Add NOT NULL constraint after backfill
ALTER TABLE subscription_types
  ALTER COLUMN slug SET NOT NULL;

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Index for slug lookups (used by /plans/:slug route)
CREATE INDEX IF NOT EXISTS idx_subscription_types_slug
  ON subscription_types(slug);

-- Composite index for active plans by slug (most common query)
CREATE INDEX IF NOT EXISTS idx_subscription_types_active_slug
  ON subscription_types(is_active, slug)
  WHERE is_active = true;

-- ============================================================================
-- VERIFY DATA INTEGRITY
-- ============================================================================

-- Check for any duplicate slugs (should return 0 rows)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT slug, COUNT(*) as cnt
    FROM subscription_types
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate slug(s). Please fix manually.', duplicate_count;
  ELSE
    RAISE NOTICE 'All slugs are unique. ✓';
  END IF;
END $$;

-- Check for any empty or invalid slugs (should return 0 rows)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_count
  FROM subscription_types
  WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$';

  IF invalid_count > 0 THEN
    RAISE WARNING 'Found % subscription(s) with invalid slugs. Please fix manually.', invalid_count;
  ELSE
    RAISE NOTICE 'All slugs are valid. ✓';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 095: Add subscription CMS fields - COMPLETED';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Added fields: slug, custom_headline, custom_description,';
  RAISE NOTICE '              custom_features, custom_cta_text,';
  RAISE NOTICE '              checkout_badge, checkout_accent_color';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify all plans have unique slugs';
  RAISE NOTICE '2. Customize checkout pages via admin interface';
  RAISE NOTICE '3. Test /plans/:slug routes';
  RAISE NOTICE '==========================================================';
END $$;
