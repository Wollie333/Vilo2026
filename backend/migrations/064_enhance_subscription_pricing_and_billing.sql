-- Migration: 064_enhance_subscription_pricing_and_billing.sql
-- Description: Enhance subscription types table to support multiple billing types (monthly, annual, one-off)
-- Date: 2026-01-12

-- ============================================================================
-- ALTER SUBSCRIPTION TYPES TABLE
-- ============================================================================

-- Add new columns for multi-billing type support
ALTER TABLE public.subscription_types
ADD COLUMN IF NOT EXISTS billing_types JSONB DEFAULT '{"monthly": false, "annual": false, "one_off": false}'::jsonb,
ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.subscription_types.billing_types
  IS 'Flags for which billing types are enabled for this plan (monthly, annual, one_off)';

COMMENT ON COLUMN public.subscription_types.pricing_tiers
  IS 'Detailed pricing configuration for each enabled billing type. Structure: {
    "monthly": { "enabled": true, "price_cents": 2900, "billing_cycle_days": 30, "trial_period_days": 14 },
    "annual": { "enabled": true, "price_cents": 29900, "billing_cycle_days": 365, "trial_period_days": 14 },
    "one_off": { "enabled": false, "price_cents": 49900 }
  }';

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Transform existing plans to new format
-- This updates existing plans to use the new billing_types and pricing_tiers structure
DO $$
DECLARE
  plan RECORD;
  new_billing_types JSONB;
  new_pricing_tiers JSONB;
BEGIN
  FOR plan IN SELECT * FROM public.subscription_types LOOP
    -- Initialize new structures
    new_billing_types := '{"monthly": false, "annual": false, "one_off": false}'::jsonb;
    new_pricing_tiers := '{}'::jsonb;

    -- Determine which billing type this plan uses
    IF plan.is_recurring THEN
      -- Recurring plan - check billing cycle
      IF plan.billing_cycle_days = 30 THEN
        -- Monthly plan
        new_billing_types := jsonb_set(new_billing_types, '{monthly}', 'true'::jsonb);
        new_pricing_tiers := jsonb_set(
          new_pricing_tiers,
          '{monthly}',
          jsonb_build_object(
            'enabled', true,
            'price_cents', plan.price_cents,
            'billing_cycle_days', 30,
            'trial_period_days', plan.trial_period_days
          )
        );
      ELSIF plan.billing_cycle_days >= 365 THEN
        -- Annual plan (365+ days)
        new_billing_types := jsonb_set(new_billing_types, '{annual}', 'true'::jsonb);
        new_pricing_tiers := jsonb_set(
          new_pricing_tiers,
          '{annual}',
          jsonb_build_object(
            'enabled', true,
            'price_cents', plan.price_cents,
            'billing_cycle_days', plan.billing_cycle_days,
            'trial_period_days', plan.trial_period_days
          )
        );
      ELSE
        -- Other recurring cycle - treat as monthly
        new_billing_types := jsonb_set(new_billing_types, '{monthly}', 'true'::jsonb);
        new_pricing_tiers := jsonb_set(
          new_pricing_tiers,
          '{monthly}',
          jsonb_build_object(
            'enabled', true,
            'price_cents', plan.price_cents,
            'billing_cycle_days', plan.billing_cycle_days,
            'trial_period_days', plan.trial_period_days
          )
        );
      END IF;

      -- Also check if there's separate pricing for monthly/annual in old pricing JSONB
      IF plan.pricing IS NOT NULL THEN
        IF plan.pricing ? 'monthly' THEN
          new_billing_types := jsonb_set(new_billing_types, '{monthly}', 'true'::jsonb);
          new_pricing_tiers := jsonb_set(
            new_pricing_tiers,
            '{monthly}',
            jsonb_build_object(
              'enabled', true,
              'price_cents', (plan.pricing->>'monthly')::int,
              'billing_cycle_days', 30,
              'trial_period_days', plan.trial_period_days
            )
          );
        END IF;

        IF plan.pricing ? 'annual' THEN
          new_billing_types := jsonb_set(new_billing_types, '{annual}', 'true'::jsonb);
          new_pricing_tiers := jsonb_set(
            new_pricing_tiers,
            '{annual}',
            jsonb_build_object(
              'enabled', true,
              'price_cents', (plan.pricing->>'annual')::int,
              'billing_cycle_days', 365,
              'trial_period_days', plan.trial_period_days
            )
          );
        END IF;
      END IF;
    ELSE
      -- Non-recurring plan = one-off payment
      new_billing_types := jsonb_set(new_billing_types, '{one_off}', 'true'::jsonb);
      new_pricing_tiers := jsonb_set(
        new_pricing_tiers,
        '{one_off}',
        jsonb_build_object(
          'enabled', true,
          'price_cents', plan.price_cents
        )
      );
    END IF;

    -- Update the plan with new structures
    UPDATE public.subscription_types
    SET
      billing_types = new_billing_types,
      pricing_tiers = new_pricing_tiers
    WHERE id = plan.id;
  END LOOP;
END $$;

-- ============================================================================
-- ADD VALIDATION CONSTRAINT
-- ============================================================================

-- Ensure at least one billing type is enabled
ALTER TABLE public.subscription_types
ADD CONSTRAINT chk_at_least_one_billing_type
CHECK (
  (billing_types->>'monthly')::boolean = true OR
  (billing_types->>'annual')::boolean = true OR
  (billing_types->>'one_off')::boolean = true
);

COMMENT ON CONSTRAINT chk_at_least_one_billing_type ON public.subscription_types
  IS 'Ensures that at least one billing type (monthly, annual, or one_off) is enabled for each plan';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Note: The old 'pricing', 'billing_cycle_days', and 'is_recurring' columns are kept
-- for backward compatibility. They will be deprecated in a future migration (6 months).
