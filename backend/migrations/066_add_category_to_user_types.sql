-- Migration: 066_add_category_to_user_types.sql
-- Description: Add category field to user_types table to distinguish SaaS vs Customer members
-- Date: 2026-01-13
-- Author: Claude Code
-- Status: Ready for execution

-- ============================================================================
-- ADD CATEGORY ENUM TYPE
-- ============================================================================

-- Create enum type for user type categories
CREATE TYPE user_type_category AS ENUM ('saas', 'customer');

COMMENT ON TYPE user_type_category IS
  'User type category determines permission source: saas = user_type_permissions, customer = subscription_plan_permissions';

-- ============================================================================
-- ADD CATEGORY COLUMN TO USER_TYPES
-- ============================================================================

-- Add category column with default value
ALTER TABLE public.user_types
ADD COLUMN IF NOT EXISTS category user_type_category NOT NULL DEFAULT 'customer';

COMMENT ON COLUMN public.user_types.category IS
  'saas = internal team (permissions from user_type), customer = property owners (permissions from subscription)';

-- ============================================================================
-- UPDATE EXISTING SYSTEM TYPES
-- ============================================================================

-- Assign SaaS category to internal team member types
UPDATE public.user_types
SET category = 'saas'
WHERE name IN ('super_admin', 'admin');

-- Assign Customer category to property owner member types
UPDATE public.user_types
SET category = 'customer'
WHERE name IN ('free', 'paid');

-- ============================================================================
-- CREATE INDEX
-- ============================================================================

-- Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_user_types_category
ON public.user_types(category);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this query to verify the migration:
-- SELECT name, display_name, category, can_have_subscription, is_system_type
-- FROM public.user_types
-- ORDER BY sort_order;
--
-- Expected results:
-- super_admin | Super Admin | saas | false | true
-- admin | Admin | saas | false | true
-- free | Free | customer | true | true
-- paid | Paid | customer | true | true
