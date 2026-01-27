-- Enable Book via Chat for Pandokkie House's company
-- This will make the "Book via Chat" option appear in checkout

-- Step 1: Enable Book via Chat for the company that owns Pandokkie House
UPDATE companies
SET enable_book_via_chat = true
WHERE id = '65803338-275a-42dc-8eab-4f2d08b7376f';

-- Step 2: Verify it worked
SELECT
  c.id as company_id,
  c.name as company_name,
  c.enable_book_via_chat,
  p.id as property_id,
  p.name as property_name
FROM companies c
LEFT JOIN properties p ON p.company_id = c.id
WHERE c.id = '65803338-275a-42dc-8eab-4f2d08b7376f';

-- Expected result: enable_book_via_chat should show 'true'
