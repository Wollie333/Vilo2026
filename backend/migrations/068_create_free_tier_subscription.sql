-- Migration: 068_create_free_tier_subscription.sql
-- Description: Create free tier subscription plan with R0 pricing and basic permissions
-- Date: 2026-01-13
-- Author: Claude Code
-- Status: Ready for execution

-- ============================================================================
-- CREATE FREE TIER SUBSCRIPTION PLAN
-- ============================================================================

DO $$
DECLARE
  v_free_plan_id UUID;
  v_permissions_added INTEGER := 0;
BEGIN
  RAISE NOTICE 'Creating free tier subscription plan...';

  -- Create or update free subscription plan
  INSERT INTO public.subscription_types (
    name,
    display_name,
    description,
    billing_cycle_days,
    is_recurring,
    price_cents,
    currency,
    trial_period_days,
    is_active,
    sort_order,
    limits,
    pricing,
    billing_types,
    pricing_tiers
  ) VALUES (
    'free_tier',
    'Free Tier',
    'Basic features with limited resources - perfect for getting started',
    NULL, -- No billing cycle (lifetime free)
    false, -- Not recurring
    0, -- FREE! R0
    'ZAR',
    NULL, -- No trial needed (already free)
    true,
    1, -- First in sort order
    -- Limits as JSONB
    jsonb_build_object(
      'max_companies', 0,
      'max_properties', 1,
      'max_rooms', 3,
      'max_team_members', 0,
      'max_bookings_per_month', 10,
      'max_storage_mb', 100
    ),
    -- Legacy pricing (backward compatibility)
    jsonb_build_object('monthly', 0, 'annual', 0),
    -- Billing types (one-off only for free tier)
    jsonb_build_object('monthly', false, 'annual', false, 'one_off', true),
    -- Pricing tiers
    jsonb_build_object(
      'one_off', jsonb_build_object(
        'enabled', true,
        'price_cents', 0,
        'description', 'Free forever'
      )
    )
  )
  ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    limits = EXCLUDED.limits,
    pricing = EXCLUDED.pricing,
    billing_types = EXCLUDED.billing_types,
    pricing_tiers = EXCLUDED.pricing_tiers
  RETURNING id INTO v_free_plan_id;

  RAISE NOTICE 'Free tier subscription plan ID: %', v_free_plan_id;

  -- ============================================================================
  -- ASSIGN BASIC PERMISSIONS TO FREE TIER
  -- ============================================================================

  RAISE NOTICE 'Assigning basic permissions to free tier...';

  -- Delete existing permissions first (in case of re-run)
  DELETE FROM public.subscription_type_permissions
  WHERE subscription_type_id = v_free_plan_id;

  -- Assign basic permissions to free tier
  INSERT INTO public.subscription_type_permissions (subscription_type_id, permission_id)
  SELECT v_free_plan_id, p.id
  FROM public.permissions p
  WHERE
    -- Properties: read only (1 property limit enforced by subscription)
    (p.resource = 'properties' AND p.action = 'read')
    -- Rooms: read, create, update (3 rooms max)
    OR (p.resource = 'rooms' AND p.action IN ('read', 'create', 'update'))
    -- Bookings: basic CRUD (10/month max)
    OR (p.resource = 'bookings' AND p.action IN ('read', 'create', 'update'))
    -- Guests: basic access
    OR (p.resource = 'guests' AND p.action IN ('read', 'create'))
    -- Checkout: can use checkout system
    OR (p.resource = 'checkout' AND p.action IN ('read', 'create'))
    -- Dashboard: view dashboard
    OR (p.resource = 'dashboard' AND p.action = 'read')
    -- Analytics: view basic stats
    OR (p.resource = 'analytics' AND p.action = 'read')
    -- Notifications: read notifications
    OR (p.resource = 'notifications' AND p.action = 'read')
    -- Onboarding: manage own onboarding
    OR (p.resource = 'onboarding' AND p.action IN ('read', 'update'))
    -- Invoices: read own invoices
    OR (p.resource = 'invoices' AND p.action = 'read')
    -- Payments: read own payments
    OR (p.resource = 'payments' AND p.action = 'read')
  ON CONFLICT (subscription_type_id, permission_id) DO NOTHING;

  GET DIAGNOSTICS v_permissions_added = ROW_COUNT;
  RAISE NOTICE 'Assigned % permissions to free tier', v_permissions_added;

  RAISE NOTICE '✅ Free tier subscription plan created successfully!';
  RAISE NOTICE '   - Price: R0 (FREE)';
  RAISE NOTICE '   - Limits: 1 property, 3 rooms, 10 bookings/month';
  RAISE NOTICE '   - Permissions: % basic permissions', v_permissions_added;

END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this query to verify the migration:
-- SELECT
--   st.name,
--   st.display_name,
--   st.price_cents,
--   st.currency,
--   st.limits,
--   COUNT(stp.permission_id) as permission_count
-- FROM public.subscription_types st
-- LEFT JOIN public.subscription_type_permissions stp ON stp.subscription_type_id = st.id
-- WHERE st.name = 'free_tier'
-- GROUP BY st.id;
--
-- Expected: free_tier | Free Tier | 0 | ZAR | {...limits...} | ~20 permissions
