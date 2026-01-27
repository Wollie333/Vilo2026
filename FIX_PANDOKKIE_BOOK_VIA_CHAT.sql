-- STEP 1: First, run CHECK_PANDOKKIE_HOUSE.sql to get the company_id

-- STEP 2: Then replace 'COMPANY-ID-HERE' below with the actual company_id
UPDATE companies
SET enable_book_via_chat = true
WHERE id = 'COMPANY-ID-HERE';

-- STEP 3: Verify it worked
SELECT id, name, enable_book_via_chat
FROM companies
WHERE id = 'COMPANY-ID-HERE';

-- Alternative: If you're not sure which company, enable for ALL companies
-- UPDATE companies SET enable_book_via_chat = true;
-- SELECT id, name, enable_book_via_chat FROM companies;
