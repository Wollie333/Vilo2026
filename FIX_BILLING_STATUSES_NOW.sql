-- ============================================================================
-- URGENT FIX: Add Missing Billing Statuses
-- ============================================================================
-- Run this in Supabase SQL Editor NOW to fix the payment error
-- ============================================================================

-- First, check what exists
SELECT 'Current billing statuses:' as info;
SELECT * FROM billing_statuses;

-- Insert the required billing statuses (will skip if they already exist)
INSERT INTO public.billing_statuses (name, display_name, description, is_system_status, color, feature_access_level, sort_order)
VALUES
  ('trial', 'Trial', 'Trial period with limited duration. Full feature access during trial.', true, 'warning', 50, 1),
  ('free', 'Free', 'Free tier with basic features and limited resources.', true, 'default', 25, 2),
  ('paid', 'Paid', 'Active paid subscription with full feature access based on plan.', true, 'success', 100, 3)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_system_status = EXCLUDED.is_system_status,
  color = EXCLUDED.color,
  feature_access_level = EXCLUDED.feature_access_level,
  sort_order = EXCLUDED.sort_order;

-- Verify all three statuses now exist
SELECT 'After insert:' as info;
SELECT name, display_name, feature_access_level, sort_order
FROM billing_statuses
ORDER BY sort_order;

-- Expected output:
-- name   | display_name | feature_access_level | sort_order
-- trial  | Trial        | 50                   | 1
-- free   | Free         | 25                   | 2
-- paid   | Paid         | 100                  | 3
