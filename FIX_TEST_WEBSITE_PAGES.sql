-- Fix test website - ensure it has pages and is active

DO $$
DECLARE
  v_website_id UUID;
  v_page_count INT;
BEGIN
  -- Get the test website ID
  SELECT id INTO v_website_id
  FROM property_websites
  WHERE subdomain = 'test';

  IF v_website_id IS NULL THEN
    RAISE EXCEPTION 'Test website not found!';
  END IF;

  RAISE NOTICE 'Found test website with ID: %', v_website_id;

  -- Ensure website is active
  UPDATE property_websites
  SET is_active = true
  WHERE id = v_website_id;

  RAISE NOTICE 'Website is now active';

  -- Check if pages exist
  SELECT COUNT(*) INTO v_page_count
  FROM website_pages
  WHERE property_website_id = v_website_id;

  RAISE NOTICE 'Current page count: %', v_page_count;

  IF v_page_count = 0 THEN
    -- Create default pages
    INSERT INTO website_pages (property_website_id, page_type, title, slug, content, is_visible, sort_order)
    VALUES
      (v_website_id, 'home', 'Welcome', 'home', '<h1>Welcome to Our Property</h1><p>Your perfect getaway awaits.</p>', true, 1),
      (v_website_id, 'about', 'About Us', 'about', '<h1>About Us</h1><p>Learn more about our property.</p>', true, 2),
      (v_website_id, 'accommodation', 'Our Rooms', 'accommodation', '<h1>Accommodations</h1><p>Browse our available rooms.</p>', true, 3),
      (v_website_id, 'contact', 'Contact Us', 'contact', '<h1>Contact Us</h1><p>Get in touch for reservations.</p>', true, 4),
      (v_website_id, 'blog', 'Blog', 'blog', '<h1>Our Blog</h1><p>Read our latest updates.</p>', true, 5);

    RAISE NOTICE 'Created 5 default pages';
  ELSE
    RAISE NOTICE 'Pages already exist - no action needed';
  END IF;

  RAISE NOTICE '✓ Website is ready at: http://test.localhost:5173/';
END $$;
