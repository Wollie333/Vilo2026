-- Check if contact fields exist in properties table
SELECT
  id,
  name,
  phone,
  email,
  website,
  address_city,
  address_country
FROM properties
WHERE id = 'abb4c03b-3d6d-4950-8ec4-fe6e57361e5d';
