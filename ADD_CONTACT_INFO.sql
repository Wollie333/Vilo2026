-- Add contact information to existing property
UPDATE properties
SET
  phone = '+27 21 123 4567',
  email = 'bookings@masehuisie.com',
  website = 'https://www.masehuisie.com',
  updated_at = NOW()
WHERE id = 'abb4c03b-3d6d-4950-8ec4-fe6e57361e5d';

-- Verify the update
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
