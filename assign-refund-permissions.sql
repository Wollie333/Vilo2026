-- Assign Refund Permissions to User Types
-- Run this in Supabase SQL Editor after migrations 080 and 081

DO $$
DECLARE
  v_super_admin_id UUID;
  v_admin_id UUID;
  v_read_permission_id UUID;
  v_manage_permission_id UUID;
BEGIN
  -- Get user type IDs
  SELECT id INTO v_super_admin_id FROM user_types WHERE name = 'super_admin';
  SELECT id INTO v_admin_id FROM user_types WHERE name = 'admin';

  -- Get permission IDs
  SELECT id INTO v_read_permission_id FROM permissions WHERE resource = 'refunds' AND action = 'read';
  SELECT id INTO v_manage_permission_id FROM permissions WHERE resource = 'refunds' AND action = 'manage';

  -- Assign refunds:read to super_admin and admin
  INSERT INTO user_type_permissions (user_type_id, permission_id)
  VALUES
    (v_super_admin_id, v_read_permission_id),
    (v_admin_id, v_read_permission_id)
  ON CONFLICT (user_type_id, permission_id) DO NOTHING;

  -- Assign refunds:manage to super_admin and admin
  INSERT INTO user_type_permissions (user_type_id, permission_id)
  VALUES
    (v_super_admin_id, v_manage_permission_id),
    (v_admin_id, v_manage_permission_id)
  ON CONFLICT (user_type_id, permission_id) DO NOTHING;

  RAISE NOTICE 'Refund permissions assigned successfully';
END $$;

-- Verify assignments
SELECT
  ut.name AS user_type,
  p.resource || ':' || p.action AS permission
FROM user_type_permissions utp
JOIN user_types ut ON utp.user_type_id = ut.id
JOIN permissions p ON utp.permission_id = p.id
WHERE p.resource = 'refunds'
ORDER BY ut.name, p.action;
