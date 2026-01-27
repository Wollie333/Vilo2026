-- Migration: 126_add_legal_page_types.sql
-- Description: Add legal page types to enum
-- Date: 2026-01-18
-- NOTE: Run this first, THEN run 127_create_legal_pages.sql

-- ============================================================================
-- ADD LEGAL PAGE TYPES TO ENUM
-- ============================================================================

-- Add 'terms' enum value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'terms'
    AND enumtypid = 'website_page_type'::regtype
  ) THEN
    ALTER TYPE website_page_type ADD VALUE 'terms';
    RAISE NOTICE 'Added "terms" to website_page_type enum';
  ELSE
    RAISE NOTICE '"terms" already exists in website_page_type enum';
  END IF;
END $$;

-- Add 'privacy' enum value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'privacy'
    AND enumtypid = 'website_page_type'::regtype
  ) THEN
    ALTER TYPE website_page_type ADD VALUE 'privacy';
    RAISE NOTICE 'Added "privacy" to website_page_type enum';
  ELSE
    RAISE NOTICE '"privacy" already exists in website_page_type enum';
  END IF;
END $$;

-- Add 'cancellation' enum value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'cancellation'
    AND enumtypid = 'website_page_type'::regtype
  ) THEN
    ALTER TYPE website_page_type ADD VALUE 'cancellation';
    RAISE NOTICE 'Added "cancellation" to website_page_type enum';
  ELSE
    RAISE NOTICE '"cancellation" already exists in website_page_type enum';
  END IF;
END $$;

-- Final confirmation
DO $$
BEGIN
  RAISE NOTICE 'Legal page types migration complete!';
  RAISE NOTICE 'Next: Run migration 127_create_legal_pages.sql to create the pages';
END $$;
