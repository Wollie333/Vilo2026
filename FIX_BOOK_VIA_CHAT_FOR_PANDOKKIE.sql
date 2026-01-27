-- Fix Book via Chat for Pandokkie House property
-- Based on logs, the property belongs to company: 65803338-275a-42dc-8eab-4f2d08b7376f

-- Step 1: Verify the property and company relationship
SELECT
  p.id as property_id,
  p.name as property_name,
  p.slug,
  p.company_id,
  c.name as company_name,
  c.enable_book_via_chat,
  c.user_id as company_owner_user_id
FROM properties p
LEFT JOIN companies c ON c.id = p.company_id
WHERE p.id = 'c6a46e22-1185-41eb-8907-4f1c80616d1d';

-- Step 2: Enable Book via Chat for the correct company
UPDATE companies
SET enable_book_via_chat = true
WHERE id = '65803338-275a-42dc-8eab-4f2d08b7376f';

-- Step 3: Verify the update worked
SELECT
  id as company_id,
  name as company_name,
  enable_book_via_chat,
  user_id
FROM companies
WHERE id = '65803338-275a-42dc-8eab-4f2d08b7376f';

-- Step 4: Check ALL your companies to see which one has it enabled
SELECT
  id as company_id,
  name as company_name,
  enable_book_via_chat,
  user_id,
  created_at
FROM companies
ORDER BY created_at DESC;
