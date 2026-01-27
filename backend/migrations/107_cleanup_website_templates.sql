-- Migration: 107_cleanup_website_templates.sql
-- Description: Disable placeholder templates, keeping only Modern Luxe as the primary active template
-- Date: 2026-01-17

-- ============================================================================
-- DISABLE PLACEHOLDER TEMPLATES
-- ============================================================================

-- We're keeping "Modern Luxe" as the primary template for initial development
-- Other templates are preserved in the database but marked inactive
-- This allows us to focus on building the section system around one solid template
-- and later reactivate/refine additional templates as needed

-- Disable all templates except "Modern Luxe"
UPDATE website_templates
SET is_active = false,
    is_featured = false,
    updated_at = CURRENT_TIMESTAMP
WHERE name IN (
  'Classic Elegance',
  'Minimal Zen',
  'Luxury Resort',
  'Cozy Haven'
);

-- Ensure "Modern Luxe" remains active and featured
UPDATE website_templates
SET is_active = true,
    is_featured = true,
    updated_at = CURRENT_TIMESTAMP
WHERE name = 'Modern Luxe';

-- Add comments to inactive templates explaining they're preserved for future use
COMMENT ON TABLE website_templates IS
'Website templates for property websites.
Only Modern Luxe is currently active.
Other templates are preserved for future activation once the section builder system is refined.';

-- Log the changes
DO $$
DECLARE
  active_count INTEGER;
  inactive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM website_templates WHERE is_active = true;
  SELECT COUNT(*) INTO inactive_count FROM website_templates WHERE is_active = false;

  RAISE NOTICE 'Template cleanup complete:';
  RAISE NOTICE '  Active templates: %', active_count;
  RAISE NOTICE '  Inactive templates: %', inactive_count;
  RAISE NOTICE '  Primary template: Modern Luxe (Hotel category)';
END $$;
