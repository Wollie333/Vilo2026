-- Migration: 104_add_template_id_to_property_websites.sql
-- Description: Add template_id column to property_websites table to track active template
-- Date: 2026-01-17

-- ============================================================================
-- ADD TEMPLATE_ID COLUMN
-- ============================================================================

-- Add template_id column to property_websites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_websites' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE property_websites
    ADD COLUMN template_id UUID REFERENCES website_templates(id) ON DELETE SET NULL;

    -- Add index for template_id
    CREATE INDEX IF NOT EXISTS idx_property_websites_template_id ON property_websites(template_id);

    -- Add comment
    COMMENT ON COLUMN property_websites.template_id IS 'ID of the active template for this website';
  END IF;
END $$;
