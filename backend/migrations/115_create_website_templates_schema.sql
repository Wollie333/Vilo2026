-- Migration: 115_create_website_templates_schema.sql
-- Description: Create tables for website templates system (Serengeti template support)
-- Date: 2026-01-18

-- ============================================================================
-- CREATE WEBSITE TEMPLATES TABLE
-- ============================================================================

-- Store template definitions (Serengeti and future templates)
CREATE TABLE IF NOT EXISTS website_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  preview_url TEXT, -- URL to live demo site
  theme_config JSONB, -- Colors, fonts, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE TEMPLATE PAGES TABLE
-- ============================================================================

-- Store preset pages for each template (homepage, about, accommodation, etc.)
CREATE TABLE IF NOT EXISTS website_template_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES website_templates(id) ON DELETE CASCADE,
  page_type VARCHAR(50) NOT NULL, -- 'homepage', 'about', 'accommodation', etc.
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_default_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE TEMPLATE PAGE SECTIONS TABLE
-- ============================================================================

-- Store preset sections for each template page
CREATE TABLE IF NOT EXISTS website_template_page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_page_id UUID REFERENCES website_template_pages(id) ON DELETE CASCADE,
  section_type VARCHAR(100) NOT NULL, -- New Serengeti section types
  section_name VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  layout_variant VARCHAR(50), -- 'grid', 'list', 'carousel', etc.
  content JSONB NOT NULL, -- Default content structure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_template_pages_template ON website_template_pages(template_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_page ON website_template_page_sections(template_page_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_type ON website_template_page_sections(section_type);

-- ============================================================================
-- MODIFY EXISTING TABLES
-- ============================================================================

-- Add template reference to property_websites (if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_websites' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE property_websites
    ADD COLUMN template_id UUID REFERENCES website_templates(id);
  END IF;
END $$;
