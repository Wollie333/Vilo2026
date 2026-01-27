-- Diagnostic query to check Book via Chat configuration
-- Run this to understand why the payment method isn't showing

-- Step 1: Check the property and its company
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
WHERE p.slug = 'pandokkie-house' OR p.name ILIKE '%Pandokkie%';

-- Step 2: Check ALL companies for the user and their Book via Chat settings
SELECT
  id as company_id,
  name as company_name,
  enable_book_via_chat,
  user_id,
  created_at
FROM companies
ORDER BY created_at DESC;

-- Step 3: Check if there are any payment integrations for the property's company
-- (Replace COMPANY_ID_FROM_STEP_1 with the actual company_id from step 1)
-- SELECT
--   provider,
--   is_enabled,
--   is_primary,
--   company_id
-- FROM company_payment_integrations
-- WHERE company_id = 'COMPANY_ID_FROM_STEP_1';
