-- Test EFT Payment Method Save and Verify
-- Run these queries to verify EFT saves correctly and appears in checkout

-- Step 1: Check existing payment integrations for your company
SELECT
  id,
  company_id,
  provider,
  is_enabled,
  is_primary,
  config,
  created_at
FROM company_payment_integrations
WHERE company_id = '65803338-275a-42dc-8eab-4f2d08b7376f'
ORDER BY created_at DESC;

-- Step 2: After saving EFT, verify it was created
SELECT
  id,
  provider,
  is_enabled,
  config->>'bank_name' as bank_name,
  config->>'account_number' as account_number,
  config->>'branch_code' as branch_code,
  config->>'account_holder' as account_holder,
  created_at
FROM company_payment_integrations
WHERE company_id = '65803338-275a-42dc-8eab-4f2d08b7376f'
  AND provider = 'eft';

-- Step 3: Verify Book via Chat is enabled for this company
SELECT
  id,
  name,
  enable_book_via_chat
FROM companies
WHERE id = '65803338-275a-42dc-8eab-4f2d08b7376f';

-- Expected results for checkout to show payment methods:
-- 1. EFT integration exists with is_enabled = true
-- 2. Book via Chat: enable_book_via_chat = true
-- 3. Property's company_id matches this company
