# Fix Website 500 Error

## Problem
The endpoint `/api/public/website/test` returns a 500 error because:
1. The database tables might not exist yet (migration not run)
2. No website with subdomain "test" exists in the database

## Solution

### Step 1: Run the Database Migration

Run this migration in your Supabase SQL Editor:

**File**: `backend/migrations/103_create_property_websites_schema.sql`

This creates the required tables:
- `property_websites` - Main website configuration
- `website_pages` - Static pages (Home, About, Contact, etc.)
- `blog_categories` - Blog categories
- `blog_posts` - Blog posts

### Step 2: Create Test Website Data

Run this SQL script in your Supabase SQL Editor:

**File**: `SIMPLE_CREATE_TEST_WEBSITE.sql`

Or copy-paste this directly:

```sql
-- Simple script to create test website
DO $$
DECLARE
  v_property_id UUID;
  v_website_id UUID;
BEGIN
  -- Get first property
  SELECT id INTO v_property_id FROM properties LIMIT 1;

  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'No properties found. Please create a property first.';
  END IF;

  -- Check if test website already exists
  SELECT id INTO v_website_id
  FROM property_websites
  WHERE subdomain = 'test';

  IF v_website_id IS NOT NULL THEN
    RAISE NOTICE 'Website with subdomain "test" already exists!';
  ELSE
    -- Create property website
    INSERT INTO property_websites (
      property_id,
      is_active,
      subdomain,
      theme_config
    )
    VALUES (
      v_property_id,
      true,
      'test',
      '{"primaryColor":"#047857","secondaryColor":"#000000","logoUrl":null,"faviconUrl":null}'
    )
    RETURNING id INTO v_website_id;

    -- Create default pages
    INSERT INTO website_pages (property_website_id, page_type, title, slug, content, is_visible, sort_order)
    VALUES
      (v_website_id, 'home', 'Welcome', 'home', '<h1>Welcome</h1>', true, 1),
      (v_website_id, 'about', 'About', 'about', '<h1>About</h1>', true, 2),
      (v_website_id, 'accommodation', 'Rooms', 'accommodation', '<h1>Rooms</h1>', true, 3),
      (v_website_id, 'contact', 'Contact', 'contact', '<h1>Contact</h1>', true, 4),
      (v_website_id, 'blog', 'Blog', 'blog', '<h1>Blog</h1>', true, 5);

    RAISE NOTICE 'Website ready at: http://test.localhost:5173/';
  END IF;
END $$;
```

### Step 3: Test the Fix

Refresh the page at: `http://test.localhost:5173/`

The website should now load successfully!

## What Was Fixed

1. **Migration Conflict**: Renamed `100_create_property_websites_schema.sql` to `103_create_property_websites_schema.sql` (there were two migrations numbered 100)

2. **Missing Data**: Created SQL scripts to populate the test website data

## Next Steps

After the website loads, you can:
- Manage the website through the admin UI at `/properties/{propertyId}/website`
- Customize pages, add blog posts, and configure theme settings
- Create websites for other properties using different subdomains
