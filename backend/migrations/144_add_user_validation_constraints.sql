-- ============================================================================
-- Migration: 144_add_user_validation_constraints.sql
-- Description: Add validation to warn when customer users lack subscriptions
-- Date: 2026-01-25
-- ============================================================================
-- This migration adds a trigger that logs warnings when customer users
-- are set to 'active' status without having an active subscription.
--
-- NOTE: This is a WARNING system, not a hard constraint.
-- It helps catch bugs but doesn't block user creation.
-- ============================================================================

-- ============================================================================
-- Function: Validate Customer Has Subscription
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_customer_has_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type_category user_type_category;
  v_user_type_name VARCHAR(50);
  v_can_have_subscription BOOLEAN;
  v_has_subscription BOOLEAN;
BEGIN
  -- Get user type details
  SELECT ut.category, ut.name, ut.can_have_subscription
  INTO v_user_type_category, v_user_type_name, v_can_have_subscription
  FROM public.user_types ut
  WHERE ut.id = NEW.user_type_id;

  -- Only validate for customer users with active status
  IF v_user_type_category = 'customer'
     AND v_can_have_subscription = true
     AND NEW.status = 'active' THEN

    -- Check if user has active subscription
    SELECT EXISTS(
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = NEW.id
      AND us.is_active = true
      AND us.status IN ('active', 'trial')
    ) INTO v_has_subscription;

    IF NOT v_has_subscription THEN
      -- Log warning (visible in Supabase logs and application logs)
      RAISE WARNING '[SUBSCRIPTION_VALIDATION] Customer user % (%) does not have active subscription. This may cause permission issues.',
        NEW.email,
        v_user_type_name;

      -- Also log to audit table if it exists
      BEGIN
        INSERT INTO public.audit_log (
          actor_id,
          action,
          entity_type,
          entity_id,
          metadata
        ) VALUES (
          NEW.id,
          'validation.subscription_missing',
          'user',
          NEW.id,
          jsonb_build_object(
            'email', NEW.email,
            'user_type', v_user_type_name,
            'status', NEW.status,
            'warning', 'Customer user lacks active subscription'
          )
        );
      EXCEPTION WHEN OTHERS THEN
        -- Ignore audit log errors
        NULL;
      END;
    END IF;
  END IF;

  -- Always return NEW to allow operation to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.validate_customer_has_subscription() IS
  'Validates that customer users have active subscriptions. Logs warnings but does not block operations.';

-- ============================================================================
-- Trigger: Validate Customer Subscription on Insert
-- ============================================================================

DROP TRIGGER IF EXISTS validate_customer_subscription_insert ON public.users;

CREATE TRIGGER validate_customer_subscription_insert
  AFTER INSERT ON public.users
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION public.validate_customer_has_subscription();

COMMENT ON TRIGGER validate_customer_subscription_insert ON public.users IS
  'Warns when active customer users are created without subscriptions';

-- ============================================================================
-- Trigger: Validate Customer Subscription on Update
-- ============================================================================

DROP TRIGGER IF EXISTS validate_customer_subscription_update ON public.users;

CREATE TRIGGER validate_customer_subscription_update
  AFTER UPDATE ON public.users
  FOR EACH ROW
  WHEN (
    NEW.status = 'active'
    AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.user_type_id IS DISTINCT FROM NEW.user_type_id)
  )
  EXECUTE FUNCTION public.validate_customer_has_subscription();

COMMENT ON TRIGGER validate_customer_subscription_update ON public.users IS
  'Warns when users are activated or changed to customer type without subscriptions';

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 144 Completed Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Added subscription validation triggers:';
  RAISE NOTICE '  • validate_customer_subscription_insert';
  RAISE NOTICE '  • validate_customer_subscription_update';
  RAISE NOTICE '';
  RAISE NOTICE 'These triggers will LOG WARNINGS when:';
  RAISE NOTICE '  - Customer users are created without subscriptions';
  RAISE NOTICE '  - Users are activated without subscriptions';
  RAISE NOTICE '  - User types are changed without subscriptions';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: Warnings do not block operations.';
  RAISE NOTICE '      Check logs to identify and fix issues.';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;
