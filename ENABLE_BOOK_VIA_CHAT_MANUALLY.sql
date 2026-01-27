-- Manually enable Book via Chat for a specific company
-- Replace 'company-id-here' with your actual company ID

UPDATE companies
SET enable_book_via_chat = true
WHERE id = 'company-id-here';

-- Or enable for ALL companies (if you want to test)
-- UPDATE companies
-- SET enable_book_via_chat = true;

-- Verify it worked
SELECT id, name, enable_book_via_chat FROM companies;
