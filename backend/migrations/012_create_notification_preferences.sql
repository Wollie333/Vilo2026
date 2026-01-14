-- Migration: 012_create_notification_preferences.sql
-- Description: Create notification preferences table for per-template user settings
-- Feature: FEATURE-03 Notification System (User Preferences)
-- Date: 2026-01-04

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- Stores per-user, per-template notification channel preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES notification_templates(id) ON DELETE CASCADE,

  -- Channel preferences (all default to enabled)
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have one preference per template
  UNIQUE(user_id, template_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_template
  ON notification_preferences(template_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_template
  ON notification_preferences(user_id, template_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notification_preferences IS 'Per-user notification preferences for each template';
COMMENT ON COLUMN notification_preferences.email_enabled IS 'Whether to send email notifications for this template';
COMMENT ON COLUMN notification_preferences.in_app_enabled IS 'Whether to show in-app notifications for this template';
COMMENT ON COLUMN notification_preferences.push_enabled IS 'Whether to send push notifications for this template';

-- ============================================================================
-- TRIGGER FOR updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
DROP POLICY IF EXISTS notification_preferences_select_own ON notification_preferences;
CREATE POLICY notification_preferences_select_own ON notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own preferences
DROP POLICY IF EXISTS notification_preferences_insert_own ON notification_preferences;
CREATE POLICY notification_preferences_insert_own ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
DROP POLICY IF EXISTS notification_preferences_update_own ON notification_preferences;
CREATE POLICY notification_preferences_update_own ON notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own preferences
DROP POLICY IF EXISTS notification_preferences_delete_own ON notification_preferences;
CREATE POLICY notification_preferences_delete_own ON notification_preferences
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all preferences
DROP POLICY IF EXISTS notification_preferences_admin ON notification_preferences;
CREATE POLICY notification_preferences_admin ON notification_preferences
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTION: Check if notification should be sent
-- Returns true if the notification should be sent for the given channel
-- If no preference exists, defaults to true (send the notification)
-- ============================================================================

CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_template_name VARCHAR(100),
  p_channel VARCHAR(20)  -- 'email', 'in_app', or 'push'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_template_id UUID;
  v_preference notification_preferences%ROWTYPE;
BEGIN
  -- Get template ID
  SELECT id INTO v_template_id
  FROM notification_templates
  WHERE name = p_template_name AND is_active = true;

  IF NOT FOUND THEN
    -- Template doesn't exist, don't send
    RETURN false;
  END IF;

  -- Get user preference for this template
  SELECT * INTO v_preference
  FROM notification_preferences
  WHERE user_id = p_user_id AND template_id = v_template_id;

  IF NOT FOUND THEN
    -- No preference set, default to enabled
    RETURN true;
  END IF;

  -- Return the appropriate channel preference
  CASE p_channel
    WHEN 'email' THEN RETURN v_preference.email_enabled;
    WHEN 'in_app' THEN RETURN v_preference.in_app_enabled;
    WHEN 'push' THEN RETURN v_preference.push_enabled;
    ELSE RETURN true;  -- Unknown channel, default to enabled
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Get all preferences for a user with template details
-- Returns all templates with their preference settings (or defaults if not set)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  template_id UUID,
  template_name VARCHAR(100),
  template_title VARCHAR(255),
  type_id UUID,
  type_name VARCHAR(50),
  type_display_name VARCHAR(100),
  type_icon VARCHAR(50),
  type_sort_order INTEGER,
  email_enabled BOOLEAN,
  in_app_enabled BOOLEAN,
  push_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nt.id AS template_id,
    nt.name AS template_name,
    nt.title_template AS template_title,
    nty.id AS type_id,
    nty.name AS type_name,
    nty.display_name AS type_display_name,
    nty.icon AS type_icon,
    nty.sort_order AS type_sort_order,
    COALESCE(np.email_enabled, true) AS email_enabled,
    COALESCE(np.in_app_enabled, true) AS in_app_enabled,
    COALESCE(np.push_enabled, true) AS push_enabled
  FROM notification_templates nt
  JOIN notification_types nty ON nt.notification_type_id = nty.id
  LEFT JOIN notification_preferences np ON np.template_id = nt.id AND np.user_id = p_user_id
  WHERE nt.is_active = true
  ORDER BY nty.sort_order, nt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Upsert a single preference
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_notification_preference(
  p_user_id UUID,
  p_template_id UUID,
  p_email_enabled BOOLEAN DEFAULT NULL,
  p_in_app_enabled BOOLEAN DEFAULT NULL,
  p_push_enabled BOOLEAN DEFAULT NULL
)
RETURNS notification_preferences AS $$
DECLARE
  v_result notification_preferences;
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    template_id,
    email_enabled,
    in_app_enabled,
    push_enabled
  )
  VALUES (
    p_user_id,
    p_template_id,
    COALESCE(p_email_enabled, true),
    COALESCE(p_in_app_enabled, true),
    COALESCE(p_push_enabled, true)
  )
  ON CONFLICT (user_id, template_id)
  DO UPDATE SET
    email_enabled = COALESCE(p_email_enabled, notification_preferences.email_enabled),
    in_app_enabled = COALESCE(p_in_app_enabled, notification_preferences.in_app_enabled),
    push_enabled = COALESCE(p_push_enabled, notification_preferences.push_enabled),
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON notification_preferences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;

GRANT EXECUTE ON FUNCTION should_send_notification(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION should_send_notification(UUID, VARCHAR, VARCHAR) TO service_role;

GRANT EXECUTE ON FUNCTION get_user_notification_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notification_preferences(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION upsert_notification_preference(UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_notification_preference(UUID, UUID, BOOLEAN, BOOLEAN, BOOLEAN) TO service_role;
