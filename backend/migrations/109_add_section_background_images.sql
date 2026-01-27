-- Migration: 109_add_section_background_images.sql
-- Description: Add background image support to template page sections
-- Date: 2026-01-17

-- ============================================================================
-- ADD BACKGROUND IMAGE FIELDS TO SECTIONS
-- ============================================================================

-- Add background_image column to store section background images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'template_page_sections' AND column_name = 'background_image'
  ) THEN
    ALTER TABLE template_page_sections
    ADD COLUMN background_image TEXT;
  END IF;
END $$;

-- Add background_overlay column to control overlay darkness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'template_page_sections' AND column_name = 'background_overlay'
  ) THEN
    ALTER TABLE template_page_sections
    ADD COLUMN background_overlay VARCHAR(20) DEFAULT 'none';
  END IF;
END $$;

-- Add background_position column to control image positioning
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'template_page_sections' AND column_name = 'background_position'
  ) THEN
    ALTER TABLE template_page_sections
    ADD COLUMN background_position VARCHAR(20) DEFAULT 'center';
  END IF;
END $$;

-- Add parallax_effect column for parallax scrolling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'template_page_sections' AND column_name = 'parallax_effect'
  ) THEN
    ALTER TABLE template_page_sections
    ADD COLUMN parallax_effect BOOLEAN DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN template_page_sections.background_image IS 'URL to section background image';
COMMENT ON COLUMN template_page_sections.background_overlay IS 'Overlay darkness: none, light, medium, dark';
COMMENT ON COLUMN template_page_sections.background_position IS 'Background position: center, top, bottom';
COMMENT ON COLUMN template_page_sections.parallax_effect IS 'Enable parallax scrolling effect';
