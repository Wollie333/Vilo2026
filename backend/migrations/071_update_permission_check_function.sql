-- Migration: 071_update_permission_check_function.sql
-- Description: Update permission check function to support subscription-based permissions
-- Date: 2026-01-13
-- Author: Claude Code
-- Status: Ready for execution

-- ============================================================================
-- UPDATE PERMISSION CHECK FUNCTION
-- ============================================================================

-- Drop existing function with all possible signatures
DROP FUNCTION IF EXISTS public.has_user_type_permission(UUID, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.has_user_type_permission(UUID, character varying, character varying);
DROP FUNCTION IF EXISTS public.has_user_type_permission;

-- Create updated function with subscription-based permission resolution
CREATE OR REPLACE FUNCTION public.has_user_type_permission(
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_type_id UUID;
    v_user_category user_type_category;
    v_subscription_type_id UUID;
    v_has_permission BOOLEAN := FALSE;
    v_has_deny BOOLEAN := FALSE;
    v_has_grant BOOLEAN := FALSE;
BEGIN
    -- ========================================================================
    -- STEP 1: GET USER'S USER_TYPE_ID AND CATEGORY
    -- ========================================================================

    SELECT u.user_type_id, ut.category
    INTO v_user_type_id, v_user_category
    FROM public.users u
    JOIN public.user_types ut ON u.user_type_id = ut.id
    WHERE u.id = p_user_id;

    -- If no user type assigned, deny access
    IF v_user_type_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- ========================================================================
    -- PRIORITY 1: CHECK FOR EXPLICIT DENY (HIGHEST PRIORITY)
    -- ========================================================================

    SELECT EXISTS(
        SELECT 1 FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
        AND p.resource = p_resource
        AND p.action::VARCHAR = p_action
        AND up.override_type = 'deny'
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO v_has_deny;

    -- DENY always wins - return immediately
    IF v_has_deny THEN
        RETURN FALSE;
    END IF;

    -- ========================================================================
    -- PRIORITY 2: CHECK FOR EXPLICIT GRANT OVERRIDE
    -- ========================================================================

    SELECT EXISTS(
        SELECT 1 FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
        AND p.resource = p_resource
        AND p.action::VARCHAR = p_action
        AND up.override_type = 'grant'
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ) INTO v_has_grant;

    -- If explicitly granted, return immediately
    IF v_has_grant THEN
        RETURN TRUE;
    END IF;

    -- ========================================================================
    -- PRIORITY 3: CHECK BASE PERMISSIONS BASED ON CATEGORY
    -- ========================================================================

    -- BRANCH A: SaaS users → check user_type_permissions
    IF v_user_category = 'saas' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.user_type_permissions utp
            JOIN public.permissions p ON utp.permission_id = p.id
            WHERE utp.user_type_id = v_user_type_id
            AND p.resource = p_resource
            AND p.action::VARCHAR = p_action
        ) INTO v_has_permission;

    -- BRANCH B: Customer users → check subscription plan permissions
    ELSIF v_user_category = 'customer' THEN
        -- Get active subscription type ID
        SELECT us.subscription_type_id
        INTO v_subscription_type_id
        FROM public.user_subscriptions us
        WHERE us.user_id = p_user_id
        AND us.is_active = TRUE
        AND us.status IN ('active', 'trial')
        ORDER BY us.started_at DESC
        LIMIT 1;

        -- If user has active subscription, check subscription permissions
        IF v_subscription_type_id IS NOT NULL THEN
            SELECT EXISTS(
                SELECT 1 FROM public.subscription_type_permissions stp
                JOIN public.permissions p ON stp.permission_id = p.id
                WHERE stp.subscription_type_id = v_subscription_type_id
                AND p.resource = p_resource
                AND p.action::VARCHAR = p_action
            ) INTO v_has_permission;
        ELSE
            -- Customer without active subscription = NO base permissions
            v_has_permission := FALSE;
        END IF;
    END IF;

    -- ========================================================================
    -- PRIORITY 4: CHECK COMPANY TEAM MEMBER PERMISSIONS
    -- ========================================================================

    -- Check if user is a team member with property-specific permissions
    IF NOT v_has_permission THEN
        SELECT EXISTS(
            SELECT 1 FROM public.company_team_members ctm
            WHERE ctm.user_id = p_user_id
            AND ctm.is_active = TRUE
            AND (p_resource || ':' || p_action) = ANY(ctm.permissions)
        ) INTO v_has_permission;
    END IF;

    RETURN v_has_permission;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- ADD FUNCTION METADATA
-- ============================================================================

COMMENT ON FUNCTION public.has_user_type_permission IS
  'Checks user permission with category-aware resolution.

   Permission Resolution Logic:
   1. DENY overrides (highest priority) - always blocks
   2. GRANT overrides - explicitly grants permission
   3a. SaaS users → permissions from user_type_permissions
   3b. Customer users → permissions from subscription_plan_permissions
   4. Company team members → property-specific permissions array

   Categories:
   - saas: Internal platform team (super_admin, admin) - permissions from member type
   - customer: Property owners (free, paid) - permissions from active subscription plan

   Returns FALSE if:
   - User has no user_type_id
   - User has explicit DENY override
   - Customer user has no active subscription
   - Permission not found in any source';

-- ============================================================================
-- GRANT EXECUTE PERMISSION
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.has_user_type_permission(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_type_permission(UUID, VARCHAR, VARCHAR) TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the migration:
--
-- 1. Test SaaS user (super_admin) permissions:
-- SELECT public.has_user_type_permission(
--   (SELECT id FROM public.users u
--    JOIN public.user_types ut ON u.user_type_id = ut.id
--    WHERE ut.name = 'super_admin' LIMIT 1),
--   'properties',
--   'manage'
-- ) as super_admin_has_permission;
-- Expected: TRUE
--
-- 2. Test customer user with free tier subscription:
-- SELECT public.has_user_type_permission(
--   (SELECT id FROM public.users u
--    JOIN public.user_types ut ON u.user_type_id = ut.id
--    WHERE ut.category = 'customer' LIMIT 1),
--   'properties',
--   'read'
-- ) as customer_has_permission;
-- Expected: TRUE (if they have free tier subscription)
--
-- 3. Test customer user with permission NOT in their subscription:
-- SELECT public.has_user_type_permission(
--   (SELECT id FROM public.users u
--    JOIN public.user_types ut ON u.user_type_id = ut.id
--    WHERE ut.category = 'customer' LIMIT 1),
--   'settings',
--   'manage'
-- ) as customer_has_settings_permission;
-- Expected: FALSE (settings:manage not in free tier)
--
-- 4. Check function signature:
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE proname = 'has_user_type_permission';
-- Expected: Updated function with subscription logic
