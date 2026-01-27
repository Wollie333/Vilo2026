-- ============================================================================
-- CREATE LEGAL PAGES FOR TEST WEBSITE
-- Creates Terms, Privacy, and Cancellation Policy pages
-- ============================================================================

-- Get the website ID for 'test' subdomain
DO $$
DECLARE
  website_id_var UUID;
BEGIN
  -- Find the website ID
  SELECT id INTO website_id_var
  FROM property_websites
  WHERE subdomain = 'test';

  -- Create Terms & Conditions page
  INSERT INTO website_pages (
    property_website_id,
    page_type,
    title,
    slug,
    is_visible,
    sort_order,
    meta_title,
    meta_description
  ) VALUES (
    website_id_var,
    'about',  -- Using 'about' as page_type since we don't have a 'legal' type
    'Terms & Conditions',
    'terms',
    true,
    100,  -- High sort order so it appears last
    'Terms & Conditions',
    'Terms and conditions for our services'
  )
  ON CONFLICT DO NOTHING;

  -- Create Privacy Policy page
  INSERT INTO website_pages (
    property_website_id,
    page_type,
    title,
    slug,
    is_visible,
    sort_order,
    meta_title,
    meta_description
  ) VALUES (
    website_id_var,
    'about',
    'Privacy Policy',
    'privacy',
    true,
    101,
    'Privacy Policy',
    'Our privacy policy and data protection practices'
  )
  ON CONFLICT DO NOTHING;

  -- Create Cancellation Policy page
  INSERT INTO website_pages (
    property_website_id,
    page_type,
    title,
    slug,
    is_visible,
    sort_order,
    meta_title,
    meta_description
  ) VALUES (
    website_id_var,
    'about',
    'Cancellation Policy',
    'cancellation',
    true,
    102,
    'Cancellation Policy',
    'Our booking cancellation policy and refund terms'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Legal pages created successfully!';
END $$;

-- Verify the pages were created
SELECT
  title,
  slug,
  is_visible,
  sort_order
FROM website_pages
WHERE property_website_id = (SELECT id FROM property_websites WHERE subdomain = 'test')
  AND slug IN ('terms', 'privacy', 'cancellation');
