-- Migration: Add pricing tiers (monthly/annual) to subscription types
-- This follows the same JSONB pattern used for limits

-- Add pricing JSONB column for storing multiple price tiers
ALTER TABLE subscription_types
ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}';

-- Migrate existing price_cents data to the new pricing structure
-- Monthly plans: use price_cents as monthly, calculate annual (12x)
-- Annual plans: use price_cents as annual, calculate monthly (divide by 12)
-- Other cycles: estimate based on billing_cycle_days
UPDATE subscription_types
SET pricing = jsonb_build_object(
  'monthly', CASE
    WHEN billing_cycle_days = 30 THEN price_cents
    WHEN billing_cycle_days = 365 THEN ROUND(price_cents::numeric / 12)
    WHEN billing_cycle_days IS NULL THEN price_cents -- One-time, use as-is
    ELSE ROUND(price_cents::numeric / (billing_cycle_days::numeric / 30))
  END,
  'annual', CASE
    WHEN billing_cycle_days = 365 THEN price_cents
    WHEN billing_cycle_days = 30 THEN price_cents * 12
    WHEN billing_cycle_days IS NULL THEN price_cents -- One-time, use as-is
    ELSE ROUND(price_cents::numeric * (365::numeric / COALESCE(billing_cycle_days, 30)))
  END
)
WHERE pricing = '{}' OR pricing IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN subscription_types.pricing IS 'JSONB object storing price tiers in cents: { monthly: number, annual: number }';

-- Note: Keep price_cents column for backwards compatibility
-- It can be deprecated in a future migration once all code uses pricing
