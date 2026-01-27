-- Create test website for subdomain "test"
-- This script creates a test property website that can be accessed at test.localhost:5173

-- First, ensure we have a property to link to (or create a dummy one)
-- Check if any property exists, if not create one
DO $$
DECLARE
  test_property_id UUID;
  test_website_id UUID;
BEGIN
  -- Try to get an existing property
  SELECT id INTO test_property_id FROM properties LIMIT 1;

  -- If no property exists, create a test property
  IF test_property_id IS NULL THEN
    INSERT INTO properties (
      id,
      name,
      description,
      address,
      city,
      country,
      company_id,
      created_by
    )
    VALUES (
      uuid_generate_v4(),
      'Test Property',
      'A test property for website testing',
      '123 Test Street',
      'Test City',
      'Test Country',
      (SELECT id FROM companies LIMIT 1),  -- Use first company
      (SELECT id FROM users LIMIT 1)       -- Use first user
    )
    RETURNING id INTO test_property_id;

    RAISE NOTICE 'Created test property with ID: %', test_property_id;
  ELSE
    RAISE NOTICE 'Using existing property with ID: %', test_property_id;
  END IF;

  -- Check if website with subdomain "test" already exists
  SELECT id INTO test_website_id FROM property_websites WHERE subdomain = 'test';

  IF test_website_id IS NOT NULL THEN
    RAISE NOTICE 'Website with subdomain "test" already exists with ID: %', test_website_id;
  ELSE
    -- Create the property website
    INSERT INTO property_websites (
      id,
      property_id,
      is_active,
      subdomain,
      theme_config
    )
    VALUES (
      uuid_generate_v4(),
      test_property_id,
      true,
      'test',
      '{"primaryColor":"#047857","secondaryColor":"#000000","logoUrl":null,"faviconUrl":null}'::jsonb
    )
    RETURNING id INTO test_website_id;

    RAISE NOTICE 'Created test website with ID: %', test_website_id;

    -- Create default pages for the website
    INSERT INTO website_pages (property_website_id, page_type, title, slug, content, is_visible, sort_order)
    VALUES
      (test_website_id, 'home', 'Welcome to Test Property', 'home', '<h1>Welcome to Test Property</h1><p>This is a test website.</p>', true, 1),
      (test_website_id, 'about', 'About Us', 'about', '<h1>About Us</h1><p>Information about our property.</p>', true, 2),
      (test_website_id, 'contact', 'Contact Us', 'contact', '<h1>Contact Us</h1><p>Get in touch with us.</p>', true, 3),
      (test_website_id, 'accommodation', 'Accommodation', 'accommodation', '<h1>Our Rooms</h1><p>Browse our available rooms.</p>', true, 4),
      (test_website_id, 'blog', 'Blog', 'blog', '<h1>Our Blog</h1><p>Read our latest news and updates.</p>', true, 5);

    RAISE NOTICE 'Created default pages for test website';
  END IF;
END $$;

-- Verify the data
SELECT
  pw.id as website_id,
  pw.subdomain,
  pw.is_active,
  p.name as property_name
FROM property_websites pw
JOIN properties p ON pw.property_id = p.id
WHERE pw.subdomain = 'test';
