-- Script to delete checkout records for a specific subscription plan
-- This allows you to then delete the subscription plan itself
--
-- IMPORTANT: This deletes billing history. Only use for test/unused plans.
--
-- Replace 'd1f9edb7-c36f-400f-a3fc-f8f7c5ca32e8' with your plan ID

BEGIN;

-- Step 1: Show current checkout count for this plan
SELECT
  st.name,
  st.display_name,
  COUNT(c.id) as checkout_count
FROM subscription_types st
LEFT JOIN checkouts c ON c.subscription_type_id = st.id
WHERE st.id = 'd1f9edb7-c36f-400f-a3fc-f8f7c5ca32e8'
GROUP BY st.id, st.name, st.display_name;

-- Step 2: Delete checkout records for this plan
DELETE FROM checkouts
WHERE subscription_type_id = 'd1f9edb7-c36f-400f-a3fc-f8f7c5ca32e8';

-- Step 3: Verify deletion
SELECT
  st.name,
  st.display_name,
  COUNT(c.id) as remaining_checkouts
FROM subscription_types st
LEFT JOIN checkouts c ON c.subscription_type_id = st.id
WHERE st.id = 'd1f9edb7-c36f-400f-a3fc-f8f7c5ca32e8'
GROUP BY st.id, st.name, st.display_name;

-- Commit the transaction
COMMIT;

-- After running this script, you can delete the plan from the UI
