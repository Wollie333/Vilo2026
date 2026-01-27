-- ============================================================================
-- Migration: 139_ensure_free_tier_subscription.sql
-- Description: Ensure free_tier subscription type exists (prerequisite for migration 140)
-- Date: 2026-01-25
-- ============================================================================
-- This migration creates the free_tier subscription type if it doesn't exist.
-- This is a prerequisite for migration 140 which assigns free tier to customer users.
-- ============================================================================

DO $$
DECLARE
  v_free_tier_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Ensure Free Tier Subscription Type Exists';
  RAISE NOTICE 'Migration 139';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Check if free_tier subscription type already exists
  SELECT id INTO v_free_tier_id
  FROM public.subscription_types
  WHERE name = 'free_tier';

  IF v_free_tier_id IS NOT NULL THEN
    RAISE NOTICE '✓ Free tier subscription type already exists: %', v_free_tier_id;

    -- Ensure it's active
    UPDATE public.subscription_types
    SET is_active = true
    WHERE id = v_free_tier_id;

    RAISE NOTICE '✓ Free tier subscription type is active';
  ELSE
    RAISE NOTICE 'Creating free_tier subscription type...';

    -- Create free_tier subscription type
    INSERT INTO public.subscription_types (
      name,
      display_name,
      description,
      price_cents,
      billing_period,
      is_active,
      features,
      limits,
      created_at,
      updated_at
    ) VALUES (
      'free_tier',
      'Free Tier',
      'Free tier with basic features - automatically assigned to all new users',
      0, -- Free
      'monthly', -- Billing period (not charged since price is 0)
      true,
      jsonb_build_object(
        'properties', true,
        'rooms', true,
        'bookings', true,
        'basic_support', true
      ),
      jsonb_build_object(
        'max_properties', 1,
        'max_rooms_per_property', 5,
        'max_bookings_per_month', 10,
        'max_photos_per_room', 5,
        'can_export_data', false,
        'priority_support', false
      ),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_free_tier_id;

    RAISE NOTICE '✅ Created free_tier subscription type: %', v_free_tier_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 139 Completed Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Free tier subscription type ID: %', v_free_tier_id;
  RAISE NOTICE '';
  RAISE NOTICE 'You can now run migration 140 to backfill';
  RAISE NOTICE 'subscriptions for existing users.';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
