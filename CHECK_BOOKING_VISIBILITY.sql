-- Check if booking exists and property has correct owner_id
-- Booking ID: e1463bd9-8532-4a03-bd51-99f790a9f360
-- Property ID: c6a46e22-1185-41eb-8907-4f1c80616d1d
-- Expected Owner: 3172a9a8-474d-4dc1-a533-1c26e10c0440

-- 1. Check if booking exists
SELECT
    'BOOKING' as check_type,
    id,
    booking_reference,
    booking_status,
    payment_status,
    property_id,
    guest_id
FROM bookings
WHERE id = 'e1463bd9-8532-4a03-bd51-99f790a9f360';

-- 2. Check property details and owner_id
SELECT
    'PROPERTY' as check_type,
    id,
    name,
    slug,
    owner_id,
    company_id
FROM properties
WHERE id = 'c6a46e22-1185-41eb-8907-4f1c80616d1d';

-- 3. Check if owner_id matches expected
SELECT
    CASE
        WHEN owner_id = '3172a9a8-474d-4dc1-a533-1c26e10c0440' THEN '✅ Owner ID matches'
        WHEN owner_id IS NULL THEN '❌ Owner ID is NULL - THIS IS THE PROBLEM!'
        ELSE '❌ Owner ID does not match: ' || owner_id
    END as owner_check
FROM properties
WHERE id = 'c6a46e22-1185-41eb-8907-4f1c80616d1d';

-- 4. Get all properties owned by this user
SELECT
    'USER_PROPERTIES' as check_type,
    id,
    name,
    slug,
    owner_id
FROM properties
WHERE owner_id = '3172a9a8-474d-4dc1-a533-1c26e10c0440';

-- 5. Check company ownership
SELECT
    'COMPANY_OWNERSHIP' as check_type,
    c.id as company_id,
    c.name as company_name,
    c.user_id as company_owner_id,
    p.id as property_id,
    p.name as property_name,
    p.owner_id as property_owner_id
FROM companies c
LEFT JOIN properties p ON p.company_id = c.id
WHERE c.id = '65803338-275a-42dc-8eab-4f2d08b7376f';
