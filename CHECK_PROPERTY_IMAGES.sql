-- Check property data for featured image and listing title
SELECT
  id,
  name,
  slug,
  listing_title,
  featured_image_url,
  gallery_images,
  is_listed_publicly,
  is_active
FROM properties
WHERE slug = 'truer-river-lodge'
OR slug LIKE '%truer%'
OR name LIKE '%Truer%';

-- If no results, check all properties
SELECT
  slug,
  name,
  listing_title,
  featured_image_url IS NOT NULL as has_featured_image
FROM properties
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;
