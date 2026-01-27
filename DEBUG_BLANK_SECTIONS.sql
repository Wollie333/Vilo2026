-- ============================================================================
-- DEBUG BLANK SECTIONS ISSUE
-- ============================================================================

-- Step 1: Find your website
SELECT
  pw.id as website_id,
  pw.subdomain,
  pw.property_id,
  wt.name as template_name
FROM property_websites pw
JOIN website_templates wt ON wt.id = pw.template_id
JOIN properties p ON p.id = pw.property_id
WHERE p.company_id = (
  SELECT company_id FROM users WHERE email = 'admin@vilo.com' LIMIT 1
)
LIMIT 5;

-- Copy the website_id for next queries


-- Step 2: Check if pages were created
SELECT
  type,
  title,
  slug,
  is_visible,
  sort_order
FROM website_pages
WHERE property_website_id = '{WEBSITE_ID}'
ORDER BY sort_order;

-- Expected: 8 pages


-- Step 3: Check if sections were created
SELECT
  section_type,
  section_name,
  page_type,
  sort_order,
  is_visible
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
ORDER BY page_type, sort_order;

-- Expected: 18 sections with section_type like 'serengeti-%'


-- Step 4: Check section content (IMPORTANT)
SELECT
  section_type,
  section_name,
  page_type,
  content
FROM template_page_sections
WHERE property_website_id = '{WEBSITE_ID}'
  AND page_type = 'homepage'
ORDER BY sort_order;

-- Look at the 'content' column - should have JSON data
-- Check if placeholders like {property.name} were replaced


-- Step 5: Get property data to verify auto-population
SELECT
  id,
  name,
  description,
  featured_image_url,
  phone,
  email,
  address_street,
  address_city,
  address_country
FROM properties
WHERE id = '{PROPERTY_ID}';

-- Check if property has data to populate


-- Step 6: Check rooms (for room cards section)
SELECT
  id,
  name,
  room_code,
  description,
  base_price_per_night,
  featured_image,
  is_active
FROM rooms
WHERE property_id = '{PROPERTY_ID}'
  AND is_active = true;

-- Expected: At least 1-2 rooms for testing
