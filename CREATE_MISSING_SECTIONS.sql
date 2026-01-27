-- Script to create homepage sections for existing websites that don't have any
-- Run this in your Supabase SQL editor

DO $$
DECLARE
  website_record RECORD;
BEGIN
  -- Loop through all active websites
  FOR website_record IN
    SELECT pw.id, pw.property_id, p.name as property_name
    FROM property_websites pw
    JOIN properties p ON p.id = pw.property_id
    WHERE pw.is_active = true
  LOOP
    -- Check if this website has any homepage sections
    IF NOT EXISTS (
      SELECT 1
      FROM template_page_sections
      WHERE property_website_id = website_record.id
      AND page_type = 'home'
    ) THEN
      -- Create default sections for this website
      RAISE NOTICE 'Creating sections for website % (property: %)',
        website_record.id, website_record.property_name;

      PERFORM create_default_homepage_sections(website_record.id);

      RAISE NOTICE 'Sections created successfully for %', website_record.property_name;
    ELSE
      RAISE NOTICE 'Website % already has sections, skipping', website_record.property_name;
    END IF;
  END LOOP;

  RAISE NOTICE 'Done! All websites processed.';
END $$;

-- Verify the sections were created
SELECT
  p.name as property_name,
  pw.subdomain,
  COUNT(tps.id) as section_count
FROM property_websites pw
JOIN properties p ON p.id = pw.property_id
LEFT JOIN template_page_sections tps ON tps.property_website_id = pw.id AND tps.page_type = 'home'
WHERE pw.is_active = true
GROUP BY p.name, pw.subdomain
ORDER BY p.name;
