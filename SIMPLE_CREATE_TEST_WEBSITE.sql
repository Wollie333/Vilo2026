-- Simple script to create test website
-- Run this in your Supabase SQL Editor

-- First check if tables exist (if this errors, run migration 100 first)

-- Get a property ID (replace with your actual property ID if you have one)
DO $$
DECLARE
  v_property_id UUID;
  v_website_id UUID;
  v_user_id UUID;
BEGIN
  -- Get first property
  SELECT id INTO v_property_id FROM properties LIMIT 1;

  -- Get first user (for blog post author)
  SELECT id INTO v_user_id FROM users LIMIT 1;

  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'No properties found. Please create a property first.';
  END IF;

  -- Check if test website already exists
  SELECT id INTO v_website_id
  FROM property_websites
  WHERE subdomain = 'test';

  IF v_website_id IS NOT NULL THEN
    RAISE NOTICE 'Website with subdomain "test" already exists!';
    RAISE NOTICE 'Website ID: %', v_website_id;
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

    RAISE NOTICE 'Created website with ID: %', v_website_id;

    -- Create default pages
    INSERT INTO website_pages (property_website_id, page_type, title, slug, content, is_visible, sort_order)
    VALUES
      (v_website_id, 'home', 'Welcome', 'home', '<h1>Welcome</h1>', true, 1),
      (v_website_id, 'about', 'About', 'about', '<h1>About</h1>', true, 2),
      (v_website_id, 'accommodation', 'Rooms', 'accommodation', '<h1>Rooms</h1>', true, 3),
      (v_website_id, 'contact', 'Contact', 'contact', '<h1>Contact</h1>', true, 4),
      (v_website_id, 'blog', 'Blog', 'blog', '<h1>Blog</h1>', true, 5);

    RAISE NOTICE 'Created 5 default pages';
    RAISE NOTICE 'Website ready at: http://test.localhost:5173/';
  END IF;
END $$;
