-- Fix existing plan that's showing as "Free"
-- This updates the billing_types field based on existing pricing_tiers

-- Check current state
SELECT
  id,
  name,
  display_name,
  billing_types,
  pricing_tiers,
  is_active
FROM subscription_types
WHERE id = 'd123df5d-43a4-4120-83c2-0e63e5a698e3';

-- Update billing_types based on pricing_tiers
UPDATE subscription_types
SET billing_types = jsonb_build_object(
  'monthly', (pricing_tiers->'monthly'->>'enabled')::boolean,
  'annual', (pricing_tiers->'annual'->>'enabled')::boolean,
  'one_off', COALESCE((pricing_tiers->'one_off'->>'enabled')::boolean, false)
)
WHERE id = 'd123df5d-43a4-4120-83c2-0e63e5a698e3';

-- Verify fix
SELECT
  id,
  name,
  display_name,
  billing_types,
  pricing_tiers->>'monthly' as monthly_pricing,
  pricing_tiers->>'annual' as annual_pricing,
  is_active
FROM subscription_types
WHERE id = 'd123df5d-43a4-4120-83c2-0e63e5a698e3';
