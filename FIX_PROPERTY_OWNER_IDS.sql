-- Fix: Set owner_id for properties based on company ownership
-- This ensures bookings show up in the property owner's dashboard

UPDATE properties p
SET owner_id = c.user_id
FROM companies c
WHERE p.company_id = c.id
AND p.owner_id IS NULL;
