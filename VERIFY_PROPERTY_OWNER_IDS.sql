-- Verify: Check if all properties now have owner_id set
-- Should return 0 rows if the fix worked

SELECT
  id,
  name,
  owner_id,
  company_id,
  '❌ Missing owner_id' as status
FROM properties
WHERE owner_id IS NULL;
