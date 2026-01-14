-- Migration: 010_create_notifications_schema.sql
-- Description: Create notification system tables (types, templates, notifications)
-- Feature: FEATURE-03 Notification System
-- Date: 2026-01-04

-- ============================================================================
-- NOTIFICATION TYPES TABLE
-- Defines categories of notifications (booking, payment, system, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20) DEFAULT 'info',
  is_system_type BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification_types
CREATE INDEX IF NOT EXISTS idx_notification_types_name ON notification_types(name);
CREATE INDEX IF NOT EXISTS idx_notification_types_sort ON notification_types(sort_order);

COMMENT ON TABLE notification_types IS 'Defines categories/types of notifications';
COMMENT ON COLUMN notification_types.name IS 'Unique identifier for the type (e.g., booking, payment)';
COMMENT ON COLUMN notification_types.icon IS 'Icon identifier for frontend display';
COMMENT ON COLUMN notification_types.color IS 'Color theme: info, success, warning, error';

-- ============================================================================
-- NOTIFICATION TEMPLATES TABLE
-- Reusable templates for notifications with placeholder support
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type_id UUID NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
  name VARCHAR(100) UNIQUE NOT NULL,
  title_template VARCHAR(255) NOT NULL,
  message_template TEXT NOT NULL,
  email_subject_template VARCHAR(255),
  email_body_template TEXT,
  default_priority VARCHAR(20) DEFAULT 'normal',
  default_variant VARCHAR(20) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_priority CHECK (default_priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT valid_variant CHECK (default_variant IN ('info', 'success', 'warning', 'error'))
);

-- Indexes for notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE notification_templates IS 'Reusable notification templates with {{placeholder}} syntax';
COMMENT ON COLUMN notification_templates.title_template IS 'Title with {{placeholders}} for variable substitution';
COMMENT ON COLUMN notification_templates.message_template IS 'Message body with {{placeholders}}';

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Main notifications storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type_id UUID REFERENCES notification_types(id) ON DELETE SET NULL,
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,

  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  variant VARCHAR(20) DEFAULT 'info',

  -- Metadata
  data JSONB DEFAULT '{}',
  priority VARCHAR(20) DEFAULT 'normal',

  -- Status tracking
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Delivery tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,

  -- Action link
  action_url VARCHAR(500),
  action_label VARCHAR(100),

  -- Expiry
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_notification_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT valid_notification_variant CHECK (variant IN ('info', 'success', 'warning', 'error'))
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type_id);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority) WHERE priority IN ('high', 'urgent');
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = false;

COMMENT ON TABLE notifications IS 'User notifications with read status and delivery tracking';
COMMENT ON COLUMN notifications.data IS 'Additional context data as JSONB';
COMMENT ON COLUMN notifications.action_url IS 'Deep link URL when notification is clicked';

-- ============================================================================
-- UPDATE TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notification_types_updated_at ON notification_types;
CREATE TRIGGER trg_notification_types_updated_at
  BEFORE UPDATE ON notification_types
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_timestamp();

DROP TRIGGER IF EXISTS trg_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_timestamp();

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notification Types: Everyone can read, only admins can modify
DROP POLICY IF EXISTS notification_types_select_policy ON notification_types;
CREATE POLICY notification_types_select_policy ON notification_types
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS notification_types_admin_policy ON notification_types;
CREATE POLICY notification_types_admin_policy ON notification_types
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'property_admin')
    )
  );

-- Notification Templates: Everyone can read, only admins can modify
DROP POLICY IF EXISTS notification_templates_select_policy ON notification_templates;
CREATE POLICY notification_templates_select_policy ON notification_templates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS notification_templates_admin_policy ON notification_templates;
CREATE POLICY notification_templates_admin_policy ON notification_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'property_admin')
    )
  );

-- Notifications: Users can only access their own notifications
DROP POLICY IF EXISTS notifications_select_own_policy ON notifications;
CREATE POLICY notifications_select_own_policy ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own_policy ON notifications;
CREATE POLICY notifications_update_own_policy ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_delete_own_policy ON notifications;
CREATE POLICY notifications_delete_own_policy ON notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admins can insert notifications for any user
DROP POLICY IF EXISTS notifications_admin_insert_policy ON notifications;
CREATE POLICY notifications_admin_insert_policy ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('super_admin', 'property_admin', 'property_manager')
    )
  );

-- Admins can view all notifications
DROP POLICY IF EXISTS notifications_admin_select_policy ON notifications;
CREATE POLICY notifications_admin_select_policy ON notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- ============================================================================
-- ENABLE REALTIME FOR NOTIFICATIONS
-- ============================================================================

DO $$
BEGIN
  -- Check if the publication exists and add the table
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Remove if already added (to avoid errors)
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
    -- Add the notifications table
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Get unread notification count for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND read = false
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Render template with placeholder data
-- ============================================================================

CREATE OR REPLACE FUNCTION render_notification_template(
  p_template TEXT,
  p_data JSONB
)
RETURNS TEXT AS $$
DECLARE
  result TEXT := p_template;
  key TEXT;
  value TEXT;
BEGIN
  FOR key, value IN SELECT * FROM jsonb_each_text(p_data)
  LOOP
    result := REPLACE(result, '{{' || key || '}}', COALESCE(value, ''));
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- HELPER FUNCTION: Create notification from template
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification_from_template(
  p_user_id UUID,
  p_template_name VARCHAR(100),
  p_data JSONB DEFAULT '{}',
  p_action_url VARCHAR(500) DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_priority VARCHAR(20) DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_template notification_templates%ROWTYPE;
  v_notification_id UUID;
  v_title TEXT;
  v_message TEXT;
  v_priority VARCHAR(20);
  v_variant VARCHAR(20);
BEGIN
  -- Get the template
  SELECT * INTO v_template
  FROM notification_templates
  WHERE name = p_template_name AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', p_template_name;
  END IF;

  -- Render title and message
  v_title := render_notification_template(v_template.title_template, p_data);
  v_message := render_notification_template(v_template.message_template, p_data);
  v_priority := COALESCE(p_priority, v_template.default_priority);
  v_variant := v_template.default_variant;

  -- Insert notification
  INSERT INTO notifications (
    user_id,
    notification_type_id,
    template_id,
    title,
    message,
    variant,
    data,
    priority,
    action_url,
    action_label,
    expires_at
  ) VALUES (
    p_user_id,
    v_template.notification_type_id,
    v_template.id,
    v_title,
    v_message,
    v_variant,
    p_data,
    v_priority,
    p_action_url,
    p_action_label,
    p_expires_at
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Notification Types
-- ============================================================================

INSERT INTO notification_types (name, display_name, description, icon, color, is_system_type, sort_order)
VALUES
  ('booking', 'Booking', 'Booking-related notifications', 'calendar', 'info', true, 1),
  ('payment', 'Payment', 'Payment and billing notifications', 'credit-card', 'success', true, 2),
  ('property', 'Property', 'Property updates and changes', 'home', 'info', true, 3),
  ('user', 'User', 'Account and profile notifications', 'user', 'info', true, 4),
  ('system', 'System', 'System alerts and maintenance', 'bell', 'warning', true, 5),
  ('reminder', 'Reminder', 'Scheduled reminders and follow-ups', 'clock', 'info', true, 6),
  ('approval', 'Approval', 'Approval requests and status updates', 'check-circle', 'success', true, 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED DATA: Notification Templates
-- ============================================================================

DO $$
DECLARE
  v_booking_type_id UUID;
  v_payment_type_id UUID;
  v_user_type_id UUID;
  v_system_type_id UUID;
  v_approval_type_id UUID;
BEGIN
  SELECT id INTO v_booking_type_id FROM notification_types WHERE name = 'booking';
  SELECT id INTO v_payment_type_id FROM notification_types WHERE name = 'payment';
  SELECT id INTO v_user_type_id FROM notification_types WHERE name = 'user';
  SELECT id INTO v_system_type_id FROM notification_types WHERE name = 'system';
  SELECT id INTO v_approval_type_id FROM notification_types WHERE name = 'approval';

  -- Booking templates
  INSERT INTO notification_templates (
    notification_type_id, name, title_template, message_template,
    email_subject_template, email_body_template, default_priority, default_variant
  )
  VALUES
    (v_booking_type_id, 'booking_created',
     'New Booking Received',
     'New booking from {{guest_name}} for {{property_name}} on {{check_in_date}}.',
     'New Booking: {{property_name}}',
     '<h1>New Booking Received</h1><p>You have a new booking from <strong>{{guest_name}}</strong> for <strong>{{property_name}}</strong>.</p><p>Check-in: {{check_in_date}}<br>Check-out: {{check_out_date}}</p>',
     'high', 'info'),

    (v_booking_type_id, 'booking_confirmed',
     'Booking Confirmed',
     'Your booking at {{property_name}} has been confirmed for {{check_in_date}} - {{check_out_date}}.',
     'Booking Confirmed: {{property_name}}',
     '<h1>Booking Confirmed</h1><p>Your stay at <strong>{{property_name}}</strong> is confirmed!</p><p>Check-in: {{check_in_date}}<br>Check-out: {{check_out_date}}</p>',
     'normal', 'success'),

    (v_booking_type_id, 'booking_cancelled',
     'Booking Cancelled',
     'The booking at {{property_name}} for {{check_in_date}} has been cancelled.',
     'Booking Cancelled: {{property_name}}',
     '<h1>Booking Cancelled</h1><p>The booking at <strong>{{property_name}}</strong> scheduled for {{check_in_date}} has been cancelled.</p>',
     'high', 'warning'),

    (v_booking_type_id, 'check_in_reminder',
     'Check-in Tomorrow',
     'Reminder: {{guest_name}} is checking in tomorrow at {{property_name}}.',
     'Check-in Reminder: {{property_name}}',
     '<h1>Check-in Tomorrow</h1><p><strong>{{guest_name}}</strong> is scheduled to check in tomorrow at <strong>{{property_name}}</strong>.</p>',
     'normal', 'info'),

    -- Payment templates
    (v_payment_type_id, 'payment_received',
     'Payment Received',
     'Payment of {{amount}} {{currency}} received for booking #{{booking_id}}.',
     'Payment Received - {{amount}} {{currency}}',
     '<h1>Payment Received</h1><p>We have received your payment of <strong>{{amount}} {{currency}}</strong>.</p><p>Booking Reference: {{booking_id}}</p>',
     'normal', 'success'),

    (v_payment_type_id, 'payment_failed',
     'Payment Failed',
     'Payment of {{amount}} {{currency}} could not be processed. Please update your payment method.',
     'Payment Failed - Action Required',
     '<h1>Payment Failed</h1><p>We were unable to process your payment of <strong>{{amount}} {{currency}}</strong>.</p><p>Please update your payment method.</p>',
     'urgent', 'error'),

    (v_payment_type_id, 'refund_processed',
     'Refund Processed',
     'A refund of {{amount}} {{currency}} has been processed for booking #{{booking_id}}.',
     'Refund Processed - {{amount}} {{currency}}',
     '<h1>Refund Processed</h1><p>A refund of <strong>{{amount}} {{currency}}</strong> has been processed for your booking.</p>',
     'normal', 'success'),

    -- User templates
    (v_user_type_id, 'welcome',
     'Welcome to Vilo!',
     'Welcome to Vilo, {{user_name}}! Get started by exploring your dashboard.',
     'Welcome to Vilo!',
     '<h1>Welcome to Vilo!</h1><p>Hi {{user_name}},</p><p>Thank you for joining Vilo. We are excited to have you!</p>',
     'normal', 'success'),

    (v_user_type_id, 'profile_updated',
     'Profile Updated',
     'Your profile has been updated successfully.',
     NULL, NULL,
     'low', 'success'),

    -- Approval templates
    (v_approval_type_id, 'account_approved',
     'Account Approved',
     'Your Vilo account has been approved. You now have full access.',
     'Your Vilo Account is Approved',
     '<h1>Account Approved</h1><p>Great news! Your Vilo account has been approved and you now have full access to all features.</p>',
     'high', 'success'),

    (v_approval_type_id, 'account_pending',
     'Account Pending Approval',
     'Your account is pending approval. You will be notified once approved.',
     'Account Registration Received',
     '<h1>Registration Received</h1><p>Your account registration has been received and is pending approval.</p>',
     'normal', 'info'),

    (v_approval_type_id, 'new_user_pending',
     'New User Pending Approval',
     '{{user_name}} ({{user_email}}) has registered and is pending approval.',
     'New User Pending Approval',
     '<h1>New User Registration</h1><p><strong>{{user_name}}</strong> ({{user_email}}) has registered and requires approval.</p>',
     'high', 'info'),

    -- System templates
    (v_system_type_id, 'system_maintenance',
     'Scheduled Maintenance',
     'Vilo will undergo maintenance on {{maintenance_date}}. Expected downtime: {{duration}}.',
     'Scheduled Maintenance Notice',
     '<h1>Scheduled Maintenance</h1><p>Vilo will undergo scheduled maintenance on <strong>{{maintenance_date}}</strong>.</p><p>Expected downtime: {{duration}}</p>',
     'normal', 'warning'),

    (v_system_type_id, 'system_update',
     'System Update',
     '{{update_title}}: {{update_message}}',
     'Vilo System Update',
     '<h1>System Update</h1><p>{{update_message}}</p>',
     'low', 'info')
  ON CONFLICT (name) DO NOTHING;
END $$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON notification_types TO service_role;
GRANT ALL ON notification_templates TO service_role;
GRANT ALL ON notifications TO service_role;

GRANT SELECT ON notification_types TO authenticated;
GRANT SELECT ON notification_templates TO authenticated;
GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;

GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION render_notification_template(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification_from_template(UUID, VARCHAR, JSONB, VARCHAR, VARCHAR, VARCHAR, TIMESTAMPTZ) TO service_role;
