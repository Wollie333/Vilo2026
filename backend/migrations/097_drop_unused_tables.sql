-- Migration: 097_drop_unused_tables.sql
-- Description: Remove unused tables from abandoned features (Website Builder, CRM, Legacy Billing)
-- Date: 2026-01-16
-- Author: Database Cleanup Phase 2
-- Risk: LOW - These tables have zero code references

-- ============================================================================
-- PRE-FLIGHT CHECKS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 097: Drop Unused Tables';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This migration will archive 11 unused tables:';
  RAISE NOTICE '  - 9 Website/CRM feature tables (from migration 052)';
  RAISE NOTICE '  - 2 Legacy billing tables (deprecated in migration 020)';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables will be moved to archived_features schema (not dropped).';
  RAISE NOTICE 'They can be permanently deleted after 90 days if no issues.';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: CREATE ARCHIVE SCHEMA
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 1: Creating archive schema...';
END $$;

CREATE SCHEMA IF NOT EXISTS archived_features;

COMMENT ON SCHEMA archived_features IS 'Archive for unused tables before permanent deletion. Tables can be restored if needed within 90 days.';

DO $$
BEGIN
  RAISE NOTICE '✓ Schema created: archived_features';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: ARCHIVE WEBSITE/CRM FEATURE TABLES (9 tables)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 2: Archiving Website/CRM feature tables...';
  RAISE NOTICE '';
END $$;

-- Archive template_categories
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'template_categories'
  ) THEN
    ALTER TABLE public.template_categories SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: template_categories';
  ELSE
    RAISE NOTICE '→ Already archived: template_categories';
  END IF;
END $$;

-- Archive website_templates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'website_templates'
  ) THEN
    ALTER TABLE public.website_templates SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: website_templates';
  ELSE
    RAISE NOTICE '→ Already archived: website_templates';
  END IF;
END $$;

-- Archive property_websites
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'property_websites'
  ) THEN
    ALTER TABLE public.property_websites SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: property_websites';
  ELSE
    RAISE NOTICE '→ Already archived: property_websites';
  END IF;
END $$;

-- Archive template_sections
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'template_sections'
  ) THEN
    ALTER TABLE public.template_sections SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: template_sections';
  ELSE
    RAISE NOTICE '→ Already archived: template_sections';
  END IF;
END $$;

-- Archive template_data_bindings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'template_data_bindings'
  ) THEN
    ALTER TABLE public.template_data_bindings SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: template_data_bindings';
  ELSE
    RAISE NOTICE '→ Already archived: template_data_bindings';
  END IF;
END $$;

-- Archive pipeline_stages
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pipeline_stages'
  ) THEN
    ALTER TABLE public.pipeline_stages SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: pipeline_stages';
  ELSE
    RAISE NOTICE '→ Already archived: pipeline_stages';
  END IF;
END $$;

-- Archive leads
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) THEN
    ALTER TABLE public.leads SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: leads';
  ELSE
    RAISE NOTICE '→ Already archived: leads';
  END IF;
END $$;

-- Archive lead_activities
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lead_activities'
  ) THEN
    ALTER TABLE public.lead_activities SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: lead_activities';
  ELSE
    RAISE NOTICE '→ Already archived: lead_activities';
  END IF;
END $$;

-- Archive website_analytics_events
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'website_analytics_events'
  ) THEN
    ALTER TABLE public.website_analytics_events SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: website_analytics_events';
  ELSE
    RAISE NOTICE '→ Already archived: website_analytics_events';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: ARCHIVE LEGACY BILLING TABLES (2 tables)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 3: Archiving legacy billing tables...';
  RAISE NOTICE '';
END $$;

-- Archive billing_statuses (deprecated in migration 020)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'billing_statuses'
  ) THEN
    ALTER TABLE public.billing_statuses SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: billing_statuses';
  ELSE
    RAISE NOTICE '→ Table does not exist or already archived: billing_statuses';
  END IF;
END $$;

-- Archive subscription_limits (deprecated in migration 020)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscription_limits'
  ) THEN
    ALTER TABLE public.subscription_limits SET SCHEMA archived_features;
    RAISE NOTICE '✓ Archived: subscription_limits';
  ELSE
    RAISE NOTICE '→ Table does not exist or already archived: subscription_limits';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 4: CLEAN UP RELATED NOTIFICATION TEMPLATES
-- ============================================================================

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE 'Step 4: Cleaning up related notification templates...';
  RAISE NOTICE '';

  -- Remove notification templates for website/CRM features
  DELETE FROM notification_templates
  WHERE name IN (
    'website_published',
    'website_unpublished',
    'custom_domain_verified',
    'custom_domain_verification_failed',
    'ssl_certificate_error',
    'domain_fallback_to_subdomain',
    'website_new_lead',
    'website_lead_converted',
    'website_checkout_abandoned',
    'website_first_visitor',
    'website_milestone_views',
    'website_first_booking',
    'website_performance_degraded',
    'website_down',
    'template_update_available',
    'template_auto_updated',
    'website_review_received',
    'website_review_response_added'
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE '✓ Removed % notification template(s) for archived features', deleted_count;
  ELSE
    RAISE NOTICE '→ No notification templates to remove';
  END IF;

  RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  archived_count INTEGER;
  remaining_in_public TEXT[];
BEGIN
  RAISE NOTICE 'Step 5: Verification...';
  RAISE NOTICE '';

  -- Count archived tables
  SELECT COUNT(*) INTO archived_count
  FROM information_schema.tables
  WHERE table_schema = 'archived_features';

  RAISE NOTICE '✓ Tables in archived_features schema: %', archived_count;

  -- Check if any target tables remain in public schema
  SELECT ARRAY_AGG(table_name) INTO remaining_in_public
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'template_categories', 'website_templates', 'property_websites',
      'template_sections', 'template_data_bindings', 'pipeline_stages',
      'leads', 'lead_activities', 'website_analytics_events',
      'billing_statuses', 'subscription_limits'
    );

  IF remaining_in_public IS NOT NULL THEN
    RAISE WARNING '⚠ Some tables still in public schema: %', remaining_in_public;
    RAISE WARNING '  This may be expected if they were already removed in previous migrations';
  ELSE
    RAISE NOTICE '✓ All target tables successfully archived or already removed';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Migration 097: Drop Unused Tables - COMPLETED';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  ✓ Created archived_features schema';
  RAISE NOTICE '  ✓ Moved unused tables to archive';
  RAISE NOTICE '  ✓ Cleaned up related notification templates';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Monitor application for 90 days';
  RAISE NOTICE '  2. Verify no errors related to archived tables';
  RAISE NOTICE '  3. After 90 days of stable operation, permanently delete:';
  RAISE NOTICE '';
  RAISE NOTICE '     DROP SCHEMA archived_features CASCADE;';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE 'Rollback Instructions (if needed within 90 days):';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Restore specific table:';
  RAISE NOTICE '  ALTER TABLE archived_features.table_name SET SCHEMA public;';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Restore all archived tables: see rollback script';
  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
END $$;
