-- Migration: 127_create_legal_pages.sql
-- Description: Create legal pages for existing websites
-- Date: 2026-01-18
-- PREREQUISITE: Must run 126_add_legal_page_types.sql first

-- ============================================================================
-- ADD LEGAL PAGES TO EXISTING WEBSITES
-- ============================================================================

DO $$
DECLARE
  website_record RECORD;
  property_record RECORD;
BEGIN
  -- Loop through all active websites
  FOR website_record IN
    SELECT pw.id as website_id, pw.property_id
    FROM property_websites pw
    WHERE pw.is_active = true
  LOOP
    -- Get property name
    SELECT name INTO property_record FROM properties WHERE id = website_record.property_id;

    -- Create Terms & Conditions page (only if doesn't exist)
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
      'terms',
      'Terms & Conditions',
      'terms',
      true,
      100,
      'Terms & Conditions - ' || property_record.name,
      'Terms and conditions for our services',
      '<p>Terms and conditions content will be added here.</p>'
    )
    ON CONFLICT (property_website_id, page_type) DO NOTHING;

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
      'privacy',
      'Privacy Policy',
      'privacy',
      true,
      101,
      'Privacy Policy - ' || property_record.name,
      'Our privacy policy and data protection practices',
      '<p>Privacy policy content will be added here.</p>'
    )
    ON CONFLICT (property_website_id, page_type) DO NOTHING;

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
      'cancellation',
      'Cancellation Policy',
      'cancellation',
      true,
      102,
      'Cancellation Policy - ' || property_record.name,
      'Our booking cancellation policy and refund terms',
      '<p>Cancellation policy content will be added here.</p>'
    )
    ON CONFLICT (property_website_id, page_type) DO NOTHING;

    RAISE NOTICE 'Added legal pages to website: % (Property: %)', website_record.website_id, property_record.name;
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
  wp.page_type,
  wp.title,
  wp.slug,
  wp.is_visible
FROM website_pages wp
JOIN property_websites pw ON pw.id = wp.property_website_id
JOIN properties p ON p.id = pw.property_id
WHERE wp.page_type IN ('terms', 'privacy', 'cancellation')
ORDER BY pw.subdomain, wp.sort_order;
