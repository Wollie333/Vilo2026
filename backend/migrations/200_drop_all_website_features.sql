-- Migration: 200_drop_all_website_features.sql
-- Description: Remove all deprecated website CMS features
-- Date: 2026-01-19

BEGIN;

-- ============================================================================
-- DROP TABLES (in reverse dependency order)
-- ============================================================================

-- Drop analytics first (no dependencies)
DROP TABLE IF EXISTS website_analytics_events CASCADE;

-- Drop lead activities (depends on leads)
DROP TABLE IF EXISTS lead_activities CASCADE;

-- Drop leads (depends on pipeline_stages)
DROP TABLE IF EXISTS leads CASCADE;

-- Drop pipeline stages
DROP TABLE IF EXISTS pipeline_stages CASCADE;

-- Drop blog posts (depends on blog_categories)
DROP TABLE IF EXISTS blog_posts CASCADE;

-- Drop blog categories (depends on property_websites)
DROP TABLE IF EXISTS blog_categories CASCADE;

-- Drop website pages (depends on property_websites)
DROP TABLE IF EXISTS website_pages CASCADE;

-- Drop template page sections (depends on property_websites and template pages)
DROP TABLE IF EXISTS template_page_sections CASCADE;

-- Drop website template page sections (depends on website_template_pages)
DROP TABLE IF EXISTS website_template_page_sections CASCADE;

-- Drop website template pages (depends on website_templates)
DROP TABLE IF EXISTS website_template_pages CASCADE;

-- Drop template sections (depends on website_templates)
DROP TABLE IF EXISTS template_sections CASCADE;

-- Drop template data bindings (depends on website_templates)
DROP TABLE IF EXISTS template_data_bindings CASCADE;

-- Drop property websites (depends on website_templates)
DROP TABLE IF EXISTS property_websites CASCADE;

-- Drop website templates (depends on template_categories)
DROP TABLE IF EXISTS website_templates CASCADE;

-- Drop template categories
DROP TABLE IF EXISTS template_categories CASCADE;

-- ============================================================================
-- DROP ENUMS
-- ============================================================================

DROP TYPE IF EXISTS website_page_type CASCADE;
DROP TYPE IF EXISTS blog_post_status CASCADE;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS create_default_homepage_sections(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_lead_stage_change_activity() CASCADE;

COMMIT;
