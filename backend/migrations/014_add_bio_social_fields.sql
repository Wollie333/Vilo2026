-- Migration: Add Bio and Social Media Fields
-- Adds bio and social media URL fields to users table
-- Adds social media URL fields and default_currency to companies table

-- ============================================================================
-- Users Table: Add bio and social media fields
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);

-- ============================================================================
-- Companies Table: Add social media fields and default currency
-- ============================================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN users.bio IS 'User biography or description';
COMMENT ON COLUMN users.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN users.facebook_url IS 'Facebook profile URL';
COMMENT ON COLUMN users.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN users.twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN users.youtube_url IS 'YouTube channel URL';

COMMENT ON COLUMN companies.default_currency IS 'Default currency for the company (ISO 4217 code)';
COMMENT ON COLUMN companies.linkedin_url IS 'Company LinkedIn page URL';
COMMENT ON COLUMN companies.facebook_url IS 'Company Facebook page URL';
COMMENT ON COLUMN companies.instagram_url IS 'Company Instagram profile URL';
COMMENT ON COLUMN companies.twitter_url IS 'Company Twitter/X profile URL';
COMMENT ON COLUMN companies.youtube_url IS 'Company YouTube channel URL';
