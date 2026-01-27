-- Migration: Add homepage sections to existing websites that don't have any
-- Description: Creates default sections for websites activated before section system was implemented
-- Date: 2026-01-17

DO $$
DECLARE
  website_record RECORD;
  sections_created INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating missing homepage sections';
  RAISE NOTICE '========================================';

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
      RAISE NOTICE 'Creating sections for: % (ID: %)',
        website_record.property_name,
        website_record.id;

      PERFORM create_default_homepage_sections(website_record.id);

      sections_created := sections_created + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration complete!';
  RAISE NOTICE 'Created sections for % website(s)', sections_created;
  RAISE NOTICE '========================================';
END $$;
