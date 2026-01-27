-- Verify billing statuses exist
SELECT * FROM billing_statuses ORDER BY sort_order;

-- Expected output:
-- name   | display_name | description
-- trial  | Trial        | Trial period with limited duration...
-- free   | Free         | Free tier with basic features...
-- paid   | Paid         | Active paid subscription with full feature access...

-- If any are missing, run this to create them:
INSERT INTO public.billing_statuses (name, display_name, description, is_system_status, color, feature_access_level, sort_order)
VALUES
  ('trial', 'Trial', 'Trial period with limited duration. Full feature access during trial.', true, 'warning', 50, 1),
  ('free', 'Free', 'Free tier with basic features and limited resources.', true, 'default', 25, 2),
  ('paid', 'Paid', 'Active paid subscription with full feature access based on plan.', true, 'success', 100, 3)
ON CONFLICT (name) DO NOTHING;
