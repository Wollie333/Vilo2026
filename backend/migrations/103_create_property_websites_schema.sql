-- Migration: 100_create_property_websites_schema.sql
-- Description: Create schema for property website CMS feature
-- Date: 2026-01-17
--
-- This migration creates the foundation for a simple CMS system that allows
-- property owners to manage their property website with:
-- - Website activation and configuration
-- - Static pages (Home, About, Contact, Accommodation, Blog)
-- - Blog posts with categories
-- - SEO settings per page and post
-- - Theme/branding customization

-- ============================================================================
-- ENABLE EXTENSIONS (if not already enabled)
-- ============================================================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE ENUM TYPES
-- ============================================================================

-- Page types for static website pages
DO $$ BEGIN
  CREATE TYPE website_page_type AS ENUM ('home', 'about', 'contact', 'accommodation', 'blog');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Blog post status
DO $$ BEGIN
  CREATE TYPE blog_post_status AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: property_websites
-- Description: Main website configuration for each property
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255),
  theme_config JSONB DEFAULT '{"primaryColor":"#047857","secondaryColor":"#000000","logoUrl":null,"faviconUrl":null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_property_website UNIQUE(property_id),
  CONSTRAINT valid_subdomain CHECK (subdomain ~ '^[a-z0-9-]+$')
);

-- Indexes for property_websites
CREATE INDEX IF NOT EXISTS idx_property_websites_property_id ON property_websites(property_id);
CREATE INDEX IF NOT EXISTS idx_property_websites_subdomain ON property_websites(subdomain);
CREATE INDEX IF NOT EXISTS idx_property_websites_is_active ON property_websites(is_active);

COMMENT ON TABLE property_websites IS 'Website configuration for each property';
COMMENT ON COLUMN property_websites.subdomain IS 'Subdomain for the website (e.g., "my-hotel" for my-hotel.vilo.com)';
COMMENT ON COLUMN property_websites.theme_config IS 'JSON configuration for theme colors, logo, and favicon';

-- ----------------------------------------------------------------------------
-- Table: website_pages
-- Description: Static pages for the property website
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_website_id UUID NOT NULL REFERENCES property_websites(id) ON DELETE CASCADE,
  page_type website_page_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  content TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,

  -- SEO fields
  meta_title VARCHAR(200),
  meta_description TEXT,
  meta_keywords TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_page_per_website UNIQUE(property_website_id, page_type),
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for website_pages
CREATE INDEX IF NOT EXISTS idx_website_pages_property_website_id ON website_pages(property_website_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_slug ON website_pages(property_website_id, slug);
CREATE INDEX IF NOT EXISTS idx_website_pages_is_visible ON website_pages(is_visible);

COMMENT ON TABLE website_pages IS 'Static pages for property websites (Home, About, Contact, etc.)';
COMMENT ON COLUMN website_pages.page_type IS 'Type of page: home, about, contact, accommodation, blog';
COMMENT ON COLUMN website_pages.is_visible IS 'Whether the page is publicly visible';
COMMENT ON COLUMN website_pages.sort_order IS 'Display order in navigation';

-- ----------------------------------------------------------------------------
-- Table: blog_categories
-- Description: Blog post categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_website_id UUID NOT NULL REFERENCES property_websites(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_category_slug UNIQUE(property_website_id, slug),
  CONSTRAINT valid_category_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for blog_categories
CREATE INDEX IF NOT EXISTS idx_blog_categories_property_website_id ON blog_categories(property_website_id);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(property_website_id, slug);

COMMENT ON TABLE blog_categories IS 'Blog post categories for organizing content';

-- ----------------------------------------------------------------------------
-- Table: blog_posts
-- Description: Blog posts with SEO and publishing features
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_website_id UUID NOT NULL REFERENCES property_websites(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  status blog_post_status DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,

  -- SEO fields
  meta_title VARCHAR(200),
  meta_description TEXT,
  meta_keywords TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_post_slug UNIQUE(property_website_id, slug),
  CONSTRAINT valid_post_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT published_date_check CHECK (
    (status = 'published' AND published_at IS NOT NULL) OR
    (status = 'draft')
  )
);

-- Indexes for blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_property_website_id ON blog_posts(property_website_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(property_website_id, slug);

COMMENT ON TABLE blog_posts IS 'Blog posts for property websites with SEO and publishing workflow';
COMMENT ON COLUMN blog_posts.status IS 'Publication status: draft or published';
COMMENT ON COLUMN blog_posts.published_at IS 'Timestamp when post was published (NULL for drafts)';
COMMENT ON COLUMN blog_posts.excerpt IS 'Short excerpt/summary for blog list pages';

-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_property_websites_updated_at ON property_websites;
CREATE TRIGGER update_property_websites_updated_at
  BEFORE UPDATE ON property_websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_website_pages_updated_at ON website_pages;
CREATE TRIGGER update_website_pages_updated_at
  BEFORE UPDATE ON website_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DEFAULT DATA
-- ============================================================================

-- Note: Default pages will be created when a website is activated via the API
-- This ensures each property gets the standard set of pages (Home, About, Contact, etc.)

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✓ Created 2 ENUM types (website_page_type, blog_post_status)
-- ✓ Created 4 tables (property_websites, website_pages, blog_categories, blog_posts)
-- ✓ Added 14 indexes for query performance
-- ✓ Added 4 triggers for automatic updated_at timestamps
-- ✓ Added constraints for data integrity (unique slugs, valid subdomains, etc.)
