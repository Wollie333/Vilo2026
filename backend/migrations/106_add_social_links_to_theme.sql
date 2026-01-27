-- Migration: 106_add_social_links_to_theme.sql
-- Description: Document social media links structure in theme_config JSONB field
-- Date: 2026-01-17
-- Note: No schema changes needed - JSONB is flexible. This migration documents the structure.

-- ============================================================================
-- THEME_CONFIG JSONB STRUCTURE DOCUMENTATION
-- ============================================================================

/*
  The property_websites.theme_config JSONB field stores theme customization data.

  **Extended Structure (with social media links):**

  {
    "primaryColor": "#047857",      -- Brand primary color (buttons, links, accents)
    "secondaryColor": "#000000",    -- Brand secondary color (text, borders)
    "logoUrl": "https://...",       -- Property logo image URL
    "faviconUrl": "https://...",    -- Favicon URL (16x16 or 32x32 px)
    "socialLinks": {                -- Social media profile URLs (optional)
      "facebook": "https://facebook.com/property-name",
      "instagram": "https://instagram.com/property-name",
      "twitter": "https://twitter.com/property-name",
      "linkedin": "https://linkedin.com/company/property-name",  -- Optional
      "youtube": "https://youtube.com/@property-name",           -- Optional
      "tiktok": "https://tiktok.com/@property-name"              -- Optional
    }
  }

  **Usage:**
  - Social links are displayed in WebsiteFooter component
  - Empty or missing social links are not displayed
  - URLs should be full URLs (including https://)
  - Frontend validates URL format before saving

  **Example Query to Update:**

  UPDATE property_websites
  SET theme_config = jsonb_set(
    theme_config,
    '{socialLinks}',
    '{
      "facebook": "https://facebook.com/my-hotel",
      "instagram": "https://instagram.com/my-hotel"
    }'::jsonb
  )
  WHERE id = 'your-website-id';
*/

-- ============================================================================
-- VERIFICATION - Check Existing theme_config Structure
-- ============================================================================

-- View current theme_config for all websites
-- SELECT
--   id,
--   subdomain,
--   theme_config
-- FROM property_websites
-- WHERE is_active = true;

-- ============================================================================
-- NO ACTUAL SCHEMA CHANGES NEEDED
-- ============================================================================

-- This is a documentation-only migration.
-- The JSONB field property_websites.theme_config can already store this data.
-- Frontend updates in WebsiteSettings.tsx will allow users to edit social links.

SELECT 'Social links documentation added to theme_config structure' as migration_status;
