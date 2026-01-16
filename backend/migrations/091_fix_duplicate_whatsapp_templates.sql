-- Migration: 091_fix_duplicate_whatsapp_templates.sql
-- Description: Remove duplicate templates and add unique constraint
-- Date: 2026-01-15

-- ============================================================================
-- REMOVE DUPLICATE TEMPLATES
-- ============================================================================

-- Keep only the most recent template for each (property_id, template_type, language_code) combination
-- Delete older duplicates
DELETE FROM whatsapp_message_templates
WHERE id NOT IN (
  SELECT DISTINCT ON (property_id, template_type, language_code) id
  FROM whatsapp_message_templates
  ORDER BY property_id, template_type, language_code, created_at DESC
);

-- ============================================================================
-- ADD UNIQUE CONSTRAINT
-- ============================================================================

-- Add unique constraint to prevent future duplicates
-- This ensures only one template per (property_id, template_type, language_code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_template_per_property_type_language'
  ) THEN
    ALTER TABLE whatsapp_message_templates
    ADD CONSTRAINT unique_template_per_property_type_language
    UNIQUE (property_id, template_type, language_code);
  END IF;
END $$;

-- ============================================================================
-- VERIFY CLEANUP
-- ============================================================================

-- Show remaining templates grouped by type and language
SELECT
  template_type,
  language_code,
  COUNT(*) as count,
  STRING_AGG(DISTINCT COALESCE(property_id::text, 'GLOBAL'), ', ') as properties
FROM whatsapp_message_templates
GROUP BY template_type, language_code
ORDER BY template_type, language_code;
