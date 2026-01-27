-- Migration: 126_add_legal_pages_to_existing_websites.sql
-- Description: Add legal pages (Terms, Privacy, Cancellation) to existing websites
-- Date: 2026-01-18

-- ============================================================================
-- ADD LEGAL PAGES TO EXISTING WEBSITES
-- ============================================================================

-- For the test website
DO $$
DECLARE
  website_record RECORD;
  property_record RECORD;
BEGIN
  -- Loop through all active websites that don't have legal pages
  FOR website_record IN
    SELECT pw.id as website_id, pw.property_id
    FROM property_websites pw
    WHERE pw.is_active = true
  LOOP
    -- Get property name
    SELECT name INTO property_record FROM properties WHERE id = website_record.property_id;

    -- Check if legal pages already exist
    IF NOT EXISTS (
      SELECT 1 FROM website_pages
      WHERE property_website_id = website_record.website_id
      AND slug IN ('terms', 'privacy', 'cancellation')
    ) THEN
      -- Create Terms & Conditions page
      INSERT INTO website_pages (
        property_website_id,
        page_type,
        title,
        slug,
        is_visible,
        sort_order,
        meta_title,
        meta_description,
        content
      ) VALUES (
        website_record.website_id,
        'about',
        'Terms & Conditions',
        'terms',
        true,
        100,
        'Terms & Conditions - ' || property_record.name,
        'Terms and conditions for our services',
        '<p>Terms and conditions content will be added here.</p>'
      );

      -- Create Privacy Policy page
      INSERT INTO website_pages (
        property_website_id,
        page_type,
        title,
        slug,
        is_visible,
        sort_order,
        meta_title,
        meta_description,
        content
      ) VALUES (
        website_record.website_id,
        'about',
        'Privacy Policy',
        'privacy',
        true,
        101,
        'Privacy Policy - ' || property_record.name,
        'Our privacy policy and data protection practices',
        '<p>Privacy policy content will be added here.</p>'
      );

      -- Create Cancellation Policy page
      INSERT INTO website_pages (
        property_website_id,
        page_type,
        title,
        slug,
        is_visible,
        sort_order,
        meta_title,
        meta_description,
        content
      ) VALUES (
        website_record.website_id,
        'about',
        'Cancellation Policy',
        'cancellation',
        true,
        102,
        'Cancellation Policy - ' || property_record.name,
        'Our booking cancellation policy and refund terms',
        '<p>Cancellation policy content will be added here.</p>'
      );

      RAISE NOTICE 'Added legal pages to website: % (Property: %)', website_record.website_id, property_record.name;
    ELSE
      RAISE NOTICE 'Legal pages already exist for website: %', website_record.website_id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Migration complete!';
END $$;

-- ============================================================================
-- VERIFY LEGAL PAGES
-- ============================================================================

-- Show all legal pages created
SELECT
  pw.subdomain,
  p.name as property_name,
  wp.title,
  wp.slug,
  wp.is_visible
FROM website_pages wp
JOIN property_websites pw ON pw.id = wp.property_website_id
JOIN properties p ON p.id = pw.property_id
WHERE wp.slug IN ('terms', 'privacy', 'cancellation')
ORDER BY pw.subdomain, wp.sort_order;
