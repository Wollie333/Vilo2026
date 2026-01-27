-- Migration: 138_create_email_management_system.sql
-- Description: Create comprehensive email management system for SaaS admin
-- Date: 2026-01-23 (Updated: 2026-01-24)
--
-- This migration creates:
-- - email_template_categories: Hierarchical categorization of email templates
-- - email_templates: All email templates with variables and content
-- - email_sends: Audit trail of all emails sent
-- - email_template_changelog: Track all changes to templates
-- - RLS policies for super admin only access
-- - Triggers for automatic logging
-- - Seed data for 18 initial email templates (includes 2 booking wizard templates)

-- ============================================================================
-- TABLE 1: email_template_categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,

  -- Hierarchy
  parent_id UUID REFERENCES email_template_categories(id) ON DELETE SET NULL,

  -- UI
  icon VARCHAR(50), -- Icon name for frontend
  sort_order INTEGER DEFAULT 0,

  -- Protection
  is_system_category BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_template_categories_parent
  ON email_template_categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_email_template_categories_sort
  ON email_template_categories(sort_order);

-- RLS Policies
ALTER TABLE email_template_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access to email categories"
  ON email_template_categories
  FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- Allow application to read categories for UI
CREATE POLICY "Authenticated users can read email categories"
  ON email_template_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE 2: email_templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Categorization
  category_id UUID NOT NULL REFERENCES email_template_categories(id) ON DELETE RESTRICT,

  -- Identification
  template_key VARCHAR(150) UNIQUE NOT NULL, -- e.g., 'review_request_initial'
  display_name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Type
  template_type VARCHAR(50) NOT NULL DEFAULT 'application', -- 'application' | 'supabase_auth'
  supabase_template_name VARCHAR(100), -- For syncing to Supabase (e.g., 'confirm_signup')

  -- Content
  subject_template VARCHAR(500) NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,

  -- Variables Documentation (JSONB array)
  -- Format: [{"name": "guest_name", "type": "string", "description": "...", "required": true, "example": "John"}]
  variables JSONB DEFAULT '[]'::jsonb,

  -- Organization Tags
  feature_tag VARCHAR(100), -- e.g., 'reviews', 'bookings', 'refunds'
  stage_tag VARCHAR(50), -- e.g., 'initial', 'reminder', 'final'

  -- Control
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false, -- Prevent deletion

  -- Analytics
  send_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category
  ON email_templates(category_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_key
  ON email_templates(template_key);

CREATE INDEX IF NOT EXISTS idx_email_templates_type
  ON email_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_email_templates_active
  ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_templates_feature_stage
  ON email_templates(feature_tag, stage_tag);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access to email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- Application can read active templates for sending emails
CREATE POLICY "Application can read active templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- TABLE 3: email_sends
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template Reference
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

  -- Recipient
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),

  -- Content Snapshot (full rendered content)
  subject VARCHAR(500) NOT NULL,
  html_body TEXT,
  text_body TEXT,

  -- Variables Used (full variable data for debugging)
  variables_used JSONB DEFAULT '{}'::jsonb,

  -- Status Tracking
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'failed', 'bounced'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Provider Info
  provider VARCHAR(50), -- 'resend', 'sendgrid', 'supabase'
  provider_message_id VARCHAR(255),
  error_message TEXT,

  -- Context (what triggered this email)
  context_type VARCHAR(50), -- 'booking', 'review', 'refund', 'auth', 'test'
  context_id UUID, -- ID of related entity (booking_id, review_id, etc.)

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_sends_template
  ON email_sends(template_id);

CREATE INDEX IF NOT EXISTS idx_email_sends_recipient
  ON email_sends(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_sends_status
  ON email_sends(status);

CREATE INDEX IF NOT EXISTS idx_email_sends_context
  ON email_sends(context_type, context_id);

CREATE INDEX IF NOT EXISTS idx_email_sends_created_at
  ON email_sends(created_at DESC);

-- RLS Policies
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access to email sends"
  ON email_sends
  FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- Application can insert email send records
CREATE POLICY "Application can insert email sends"
  ON email_sends
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- TABLE 4: email_template_changelog
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_template_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template Reference
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,

  -- Change Info
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'enabled', 'disabled', 'synced_to_supabase'

  -- Change Details
  changes JSONB NOT NULL, -- { "field": { "old": "...", "new": "..." } }
  previous_state JSONB, -- Full snapshot of template before change

  -- Context
  notes TEXT, -- Optional notes from admin

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_template_changelog_template
  ON email_template_changelog(template_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_template_changelog_changed_by
  ON email_template_changelog(changed_by);

CREATE INDEX IF NOT EXISTS idx_email_template_changelog_type
  ON email_template_changelog(change_type);

-- RLS Policies
ALTER TABLE email_template_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access to email changelog"
  ON email_template_changelog
  FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger 1: Updated At for Categories
CREATE TRIGGER update_email_template_categories_updated_at
  BEFORE UPDATE ON email_template_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Updated At for Templates
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 3: Increment Send Count
CREATE OR REPLACE FUNCTION increment_email_template_send_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if email was successfully sent
  IF NEW.status = 'sent' THEN
    UPDATE email_templates
    SET
      send_count = send_count + 1,
      last_sent_at = NOW()
    WHERE id = NEW.template_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_send_count_on_email_send
  AFTER INSERT ON email_sends
  FOR EACH ROW
  WHEN (NEW.status = 'sent')
  EXECUTE FUNCTION increment_email_template_send_count();

-- Trigger 4: Automatic Changelog on Template Changes
CREATE OR REPLACE FUNCTION log_email_template_change()
RETURNS TRIGGER AS $$
DECLARE
  change_type_val TEXT;
  changes_json JSONB;
  field_name TEXT;
BEGIN
  -- Determine change type
  IF TG_OP = 'INSERT' THEN
    change_type_val := 'created';
    changes_json := to_jsonb(NEW);

  ELSIF TG_OP = 'UPDATE' THEN
    -- Detect specific change types
    IF OLD.is_active = false AND NEW.is_active = true THEN
      change_type_val := 'enabled';
    ELSIF OLD.is_active = true AND NEW.is_active = false THEN
      change_type_val := 'disabled';
    ELSE
      change_type_val := 'updated';
    END IF;

    -- Build changes object by comparing old and new
    changes_json := '{}'::jsonb;

    -- Check each important field
    IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
      changes_json := changes_json || jsonb_build_object('display_name', jsonb_build_object('old', OLD.display_name, 'new', NEW.display_name));
    END IF;

    IF OLD.description IS DISTINCT FROM NEW.description THEN
      changes_json := changes_json || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description));
    END IF;

    IF OLD.subject_template IS DISTINCT FROM NEW.subject_template THEN
      changes_json := changes_json || jsonb_build_object('subject_template', jsonb_build_object('old', OLD.subject_template, 'new', NEW.subject_template));
    END IF;

    IF OLD.html_template IS DISTINCT FROM NEW.html_template THEN
      changes_json := changes_json || jsonb_build_object('html_template', jsonb_build_object('old', LEFT(OLD.html_template, 200) || '...', 'new', LEFT(NEW.html_template, 200) || '...'));
    END IF;

    IF OLD.text_template IS DISTINCT FROM NEW.text_template THEN
      changes_json := changes_json || jsonb_build_object('text_template', jsonb_build_object('old', OLD.text_template, 'new', NEW.text_template));
    END IF;

    IF OLD.variables::text IS DISTINCT FROM NEW.variables::text THEN
      changes_json := changes_json || jsonb_build_object('variables', jsonb_build_object('old', OLD.variables, 'new', NEW.variables));
    END IF;

    IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
      changes_json := changes_json || jsonb_build_object('is_active', jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active));
    END IF;

    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      changes_json := changes_json || jsonb_build_object('category_id', jsonb_build_object('old', OLD.category_id, 'new', NEW.category_id));
    END IF;
  END IF;

  -- Insert changelog entry
  INSERT INTO email_template_changelog (
    template_id,
    changed_by,
    change_type,
    changes,
    previous_state
  ) VALUES (
    NEW.id,
    NEW.updated_by,
    change_type_val,
    changes_json,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_email_template_changes
  AFTER INSERT OR UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION log_email_template_change();

-- ============================================================================
-- SEED DATA: Categories
-- ============================================================================

INSERT INTO email_template_categories (name, display_name, description, icon, sort_order, is_system_category) VALUES
  ('reviews', 'Review Emails', 'Customer review requests and reminders', 'star', 1, true),
  ('bookings', 'Booking Emails', 'Booking confirmations and notifications', 'calendar', 2, true),
  ('refunds', 'Refund Emails', 'Refund request and status updates', 'credit-card', 3, true),
  ('authentication', 'Authentication Emails', 'Supabase auth emails (signup, password reset, etc.)', 'lock', 4, true),
  ('notifications', 'System Notifications', 'General system notifications', 'bell', 5, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED DATA: Review Email Templates (4 templates)
-- ============================================================================

-- Get category ID for reviews
DO $$
DECLARE
  category_reviews_id UUID;
BEGIN
  SELECT id INTO category_reviews_id FROM email_template_categories WHERE name = 'reviews';

  -- Template 1: Initial Review Request (24h after checkout)
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_reviews_id,
    'review_request_initial',
    'Initial Review Request',
    'Sent 24 hours after checkout to request a review',
    'application',
    'How was your stay at {{property_name}}?',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi {{guest_name}},</h2>
      <p>Thank you for staying with us at <strong>{{property_name}}</strong>!</p>
      <p>We hope you had a wonderful experience. Your feedback is incredibly valuable to us and helps other guests make informed decisions.</p>
      <p>Would you mind taking a moment to share your thoughts about your stay?</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{review_link}}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Write a Review</a>
      </div>
      <p>Thank you for your time!</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "review_link", "type": "string", "description": "Link to review page", "required": true, "example": "https://vilo.com/reviews/new/123"}
    ]'::jsonb,
    'reviews',
    'initial',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 2: 30-Day Review Reminder
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_reviews_id,
    'review_request_30d_reminder',
    '30-Day Review Reminder',
    'Sent 30 days after checkout if no review submitted',
    'application',
    'We would love your feedback on {{property_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi {{guest_name}},</h2>
      <p>We noticed you stayed with us at <strong>{{property_name}}</strong> recently.</p>
      <p>If you have a moment, we would really appreciate your feedback. Your review helps us improve and assists other travelers in making their decisions.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{review_link}}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Leave a Review</a>
      </div>
      <p>Thank you!</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "review_link", "type": "string", "description": "Link to review page", "required": true, "example": "https://vilo.com/reviews/new/123"}
    ]'::jsonb,
    'reviews',
    'reminder',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 3: 80-Day Final Review Request
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_reviews_id,
    'review_request_80d_final',
    '80-Day Final Review Request',
    'Final review request sent 80 days after checkout',
    'application',
    'Last chance to review your stay at {{property_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi {{guest_name}},</h2>
      <p>This is our final request for a review of your stay at <strong>{{property_name}}</strong>.</p>
      <p>Your feedback is incredibly important to us. Even a short review would be greatly appreciated!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{review_link}}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Share Your Experience</a>
      </div>
      <p>Thank you for considering!</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "review_link", "type": "string", "description": "Link to review page", "required": true, "example": "https://vilo.com/reviews/new/123"}
    ]'::jsonb,
    'reviews',
    'final',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 4: Manual Review Request
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_reviews_id,
    'review_request_manual',
    'Manual Review Request',
    'Manually triggered review request from admin',
    'application',
    'We would appreciate your review of {{property_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi {{guest_name}},</h2>
      <p>Thank you for staying at <strong>{{property_name}}</strong>!</p>
      <p>We would love to hear about your experience. Your feedback helps us continue to provide excellent service.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{review_link}}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Write Your Review</a>
      </div>
      <p>Thank you!</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "review_link", "type": "string", "description": "Link to review page", "required": true, "example": "https://vilo.com/reviews/new/123"}
    ]'::jsonb,
    'reviews',
    'manual',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;
END $$;

-- ============================================================================
-- SEED DATA: Booking Email Templates (6 templates)
-- ============================================================================

DO $$
DECLARE
  category_bookings_id UUID;
BEGIN
  SELECT id INTO category_bookings_id FROM email_template_categories WHERE name = 'bookings';

  -- Template 5: Booking Confirmation
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_bookings_id,
    'booking_confirmation',
    'Booking Confirmation',
    'Sent when a booking is confirmed',
    'application',
    'Your booking at {{property_name}} is confirmed!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmed!</h2>
      <p>Hi {{guest_name}},</p>
      <p>Your booking at <strong>{{property_name}}</strong> has been confirmed.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Booking Reference:</strong> {{booking_reference}}</p>
        <p><strong>Check-in:</strong> {{check_in_date}}</p>
        <p><strong>Check-out:</strong> {{check_out_date}}</p>
        <p><strong>Guests:</strong> {{guest_count}}</p>
        <p><strong>Total:</strong> {{total_amount}}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{booking_link}}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Booking Details</a>
      </div>
      <p>We look forward to welcoming you!</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "check_in_date", "type": "date", "description": "Check-in date", "required": true, "example": "2026-02-01"},
      {"name": "check_out_date", "type": "date", "description": "Check-out date", "required": true, "example": "2026-02-05"},
      {"name": "guest_count", "type": "number", "description": "Number of guests", "required": true, "example": "2"},
      {"name": "total_amount", "type": "string", "description": "Total booking amount", "required": true, "example": "$500"},
      {"name": "booking_link", "type": "string", "description": "Link to booking details", "required": true, "example": "https://vilo.com/bookings/123"}
    ]'::jsonb,
    'bookings',
    'confirmation',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 6: Booking Confirmation with Temporary Password
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_bookings_id,
    'booking_confirmation_temp_password',
    'Booking Confirmation (with temp password)',
    'Sent when a booking is confirmed with account creation',
    'application',
    'Your booking at {{property_name}} is confirmed!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmed!</h2>
      <p>Hi {{guest_name}},</p>
      <p>Your booking at <strong>{{property_name}}</strong> has been confirmed.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Booking Reference:</strong> {{booking_reference}}</p>
        <p><strong>Check-in:</strong> {{check_in_date}}</p>
        <p><strong>Check-out:</strong> {{check_out_date}}</p>
        <p><strong>Guests:</strong> {{guest_count}}</p>
        <p><strong>Total:</strong> {{total_amount}}</p>
      </div>
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p><strong>Account Created</strong></p>
        <p>We have created an account for you to manage your bookings.</p>
        <p><strong>Temporary Password:</strong> <code>{{temporary_password}}</code></p>
        <p><small>Please change your password after your first login.</small></p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{booking_link}}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Booking & Login</a>
      </div>
      <p>We look forward to welcoming you!</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "check_in_date", "type": "date", "description": "Check-in date", "required": true, "example": "2026-02-01"},
      {"name": "check_out_date", "type": "date", "description": "Check-out date", "required": true, "example": "2026-02-05"},
      {"name": "guest_count", "type": "number", "description": "Number of guests", "required": true, "example": "2"},
      {"name": "total_amount", "type": "string", "description": "Total booking amount", "required": true, "example": "$500"},
      {"name": "temporary_password", "type": "string", "description": "Temporary password for new account", "required": true, "example": "TempPass123"},
      {"name": "booking_link", "type": "string", "description": "Link to booking details", "required": true, "example": "https://vilo.com/bookings/123"}
    ]'::jsonb,
    'bookings',
    'confirmation',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 7: Booking Cancelled
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_bookings_id,
    'booking_cancelled',
    'Booking Cancelled',
    'Sent when a booking is cancelled',
    'application',
    'Your booking at {{property_name}} has been cancelled',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Cancelled</h2>
      <p>Hi {{guest_name}},</p>
      <p>Your booking at <strong>{{property_name}}</strong> has been cancelled.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Booking Reference:</strong> {{booking_reference}}</p>
        <p><strong>Cancelled on:</strong> {{cancellation_date}}</p>
        <p><strong>Refund Amount:</strong> {{refund_amount}}</p>
      </div>
      <p>If you have any questions about this cancellation or your refund, please contact us.</p>
      <p>We hope to serve you again in the future!</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "cancellation_date", "type": "date", "description": "Date of cancellation", "required": true, "example": "2026-01-20"},
      {"name": "refund_amount", "type": "string", "description": "Refund amount", "required": true, "example": "$400"}
    ]'::jsonb,
    'bookings',
    'cancellation',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 8: Check-in Reminder
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_bookings_id,
    'booking_checkin_reminder',
    'Check-in Reminder',
    'Sent 24 hours before check-in',
    'application',
    'Your check-in at {{property_name}} is tomorrow!',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Check-in Tomorrow!</h2>
      <p>Hi {{guest_name}},</p>
      <p>This is a friendly reminder that your check-in at <strong>{{property_name}}</strong> is tomorrow!</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Check-in Date:</strong> {{check_in_date}}</p>
        <p><strong>Check-in Time:</strong> {{check_in_time}}</p>
        <p><strong>Address:</strong> {{property_address}}</p>
      </div>
      <p>If you have any questions or need assistance, please don''t hesitate to contact us.</p>
      <p>We look forward to welcoming you!</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "check_in_date", "type": "date", "description": "Check-in date", "required": true, "example": "2026-02-01"},
      {"name": "check_in_time", "type": "string", "description": "Check-in time", "required": true, "example": "3:00 PM"},
      {"name": "property_address", "type": "string", "description": "Property address", "required": true, "example": "123 Beach Road, Cape Town"}
    ]'::jsonb,
    'bookings',
    'reminder',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 9: Guest Password Setup (NEW - for booking wizard)
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_bookings_id,
    'booking_guest_password_setup',
    'Guest Password Setup',
    'Sent to new guests after booking to set up their account password',
    'application',
    'Set Up Your Vilo Account - Booking {{booking_reference}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome to Vilo!</h1>
      <p>Hi {{full_name}},</p>
      <p>Thank you for your booking (Reference: <strong>{{booking_reference}}</strong>)!</p>
      <p>To access your booking details and manage your account, please set up your password:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{setup_link}}"
           style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Set Up Password
        </a>
      </p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn''t make this booking, please ignore this email.</p>
      <p>Best regards,<br>The Vilo Team</p>
    </div>',
    '[
      {"name": "full_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "setup_link", "type": "string", "description": "Password setup URL", "required": true, "example": "https://vilo.com/auth/set-password?token=..."}
    ]'::jsonb,
    'bookings',
    'guest_welcome',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 10: Existing User Booking Confirmation (NEW - for booking wizard)
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_bookings_id,
    'booking_existing_user_confirmation',
    'Existing User Booking Confirmation',
    'Sent to existing users after booking with login link',
    'application',
    'Booking Confirmed - {{booking_reference}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Booking Confirmed!</h1>
      <p>Hi {{full_name}},</p>
      <p>Thank you for your booking! Your booking reference is: <strong>{{booking_reference}}</strong></p>
      <p>To view your booking details and manage your reservation, please log in to your account:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{login_url}}"
           style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View Booking Details
        </a>
      </p>
      <p>You can also access your booking from the dashboard after logging in.</p>
      <p>If you have any questions about your booking, please don''t hesitate to contact us.</p>
      <p>Best regards,<br>The Vilo Team</p>
    </div>',
    '[
      {"name": "full_name", "type": "string", "description": "User full name", "required": true, "example": "John Doe"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "login_url", "type": "string", "description": "Login URL with email pre-filled", "required": true, "example": "https://vilo.com/login?email=user@example.com"}
    ]'::jsonb,
    'bookings',
    'confirmation',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;
END $$;

-- ============================================================================
-- SEED DATA: Refund Email Templates (4 templates)
-- ============================================================================

DO $$
DECLARE
  category_refunds_id UUID;
BEGIN
  SELECT id INTO category_refunds_id FROM email_template_categories WHERE name = 'refunds';

  -- Template 9: Refund Requested
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_refunds_id,
    'refund_requested',
    'Refund Requested',
    'Sent when a refund is requested',
    'application',
    'Refund request received for {{property_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Refund Request Received</h2>
      <p>Hi {{guest_name}},</p>
      <p>We have received your refund request for your booking at <strong>{{property_name}}</strong>.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Booking Reference:</strong> {{booking_reference}}</p>
        <p><strong>Requested Amount:</strong> {{refund_amount}}</p>
        <p><strong>Reason:</strong> {{refund_reason}}</p>
      </div>
      <p>Your request is being reviewed and you will receive an update within {{review_timeframe}}.</p>
      <p>Thank you for your patience.</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "refund_amount", "type": "string", "description": "Refund amount", "required": true, "example": "$400"},
      {"name": "refund_reason", "type": "string", "description": "Reason for refund", "required": false, "example": "Change in travel plans"},
      {"name": "review_timeframe", "type": "string", "description": "Expected review timeframe", "required": true, "example": "2-3 business days"}
    ]'::jsonb,
    'refunds',
    'requested',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 10: Refund Approved
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_refunds_id,
    'refund_approved',
    'Refund Approved',
    'Sent when a refund is approved',
    'application',
    'Your refund for {{property_name}} has been approved',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Refund Approved</h2>
      <p>Hi {{guest_name}},</p>
      <p>Good news! Your refund request for <strong>{{property_name}}</strong> has been approved.</p>
      <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p><strong>Booking Reference:</strong> {{booking_reference}}</p>
        <p><strong>Approved Amount:</strong> {{refund_amount}}</p>
        <p><strong>Expected Processing Time:</strong> {{processing_timeframe}}</p>
      </div>
      <p>The refund will be processed to your original payment method.</p>
      <p>Thank you for your understanding.</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "refund_amount", "type": "string", "description": "Approved refund amount", "required": true, "example": "$400"},
      {"name": "processing_timeframe", "type": "string", "description": "Expected processing time", "required": true, "example": "5-7 business days"}
    ]'::jsonb,
    'refunds',
    'approved',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 11: Refund Rejected
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_refunds_id,
    'refund_rejected',
    'Refund Rejected',
    'Sent when a refund is rejected',
    'application',
    'Update on your refund request for {{property_name}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Refund Request Update</h2>
      <p>Hi {{guest_name}},</p>
      <p>After reviewing your refund request for <strong>{{property_name}}</strong>, we are unable to approve it at this time.</p>
      <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p><strong>Booking Reference:</strong> {{booking_reference}}</p>
        <p><strong>Reason for Rejection:</strong> {{rejection_reason}}</p>
      </div>
      <p>If you have any questions or would like to discuss this further, please contact us.</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "rejection_reason", "type": "string", "description": "Reason for rejection", "required": true, "example": "Booking is outside cancellation policy window"}
    ]'::jsonb,
    'refunds',
    'rejected',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 12: Refund Completed
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_refunds_id,
    'refund_completed',
    'Refund Completed',
    'Sent when a refund is completed',
    'application',
    'Your refund for {{property_name}} has been processed',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Refund Processed</h2>
      <p>Hi {{guest_name}},</p>
      <p>Your refund for <strong>{{property_name}}</strong> has been successfully processed.</p>
      <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p><strong>Booking Reference:</strong> {{booking_reference}}</p>
        <p><strong>Refund Amount:</strong> {{refund_amount}}</p>
        <p><strong>Transaction Date:</strong> {{transaction_date}}</p>
      </div>
      <p>The refund should appear in your account within {{arrival_timeframe}}.</p>
      <p>Thank you for your patience.</p>
      <p>Best regards,<br>The {{property_name}} Team</p>
    </div>',
    '[
      {"name": "guest_name", "type": "string", "description": "Guest full name", "required": true, "example": "John Doe"},
      {"name": "property_name", "type": "string", "description": "Property name", "required": true, "example": "Sunset Villa"},
      {"name": "booking_reference", "type": "string", "description": "Booking reference number", "required": true, "example": "BK-12345"},
      {"name": "refund_amount", "type": "string", "description": "Refund amount", "required": true, "example": "$400"},
      {"name": "transaction_date", "type": "date", "description": "Date refund was processed", "required": true, "example": "2026-01-23"},
      {"name": "arrival_timeframe", "type": "string", "description": "Expected time to appear in account", "required": true, "example": "3-5 business days"}
    ]'::jsonb,
    'refunds',
    'completed',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;
END $$;

-- ============================================================================
-- SEED DATA: Supabase Auth Email Templates (4 templates)
-- ============================================================================

DO $$
DECLARE
  category_auth_id UUID;
BEGIN
  SELECT id INTO category_auth_id FROM email_template_categories WHERE name = 'authentication';

  -- Template 13: Email Confirmation (Signup)
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    supabase_template_name,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_auth_id,
    'auth_confirm_signup',
    'Email Confirmation (Signup)',
    'Supabase email confirmation for new signups',
    'supabase_auth',
    'confirm_signup',
    'Confirm your email for Vilo',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Vilo!</h2>
      <p>Thank you for signing up. Please confirm your email address to get started.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Email</a>
      </div>
      <p>If you didn''t create an account, you can safely ignore this email.</p>
      <p>Best regards,<br>The Vilo Team</p>
    </div>',
    '[
      {"name": "ConfirmationURL", "type": "string", "description": "Supabase confirmation URL", "required": true, "example": "https://yourproject.supabase.co/auth/v1/verify?..."}
    ]'::jsonb,
    'authentication',
    'signup',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 14: Password Reset
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    supabase_template_name,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_auth_id,
    'auth_reset_password',
    'Password Reset',
    'Supabase password reset email',
    'supabase_auth',
    'recovery',
    'Reset your Vilo password',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to create a new password.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      <p>If you didn''t request a password reset, you can safely ignore this email.</p>
      <p>Best regards,<br>The Vilo Team</p>
    </div>',
    '[
      {"name": "ConfirmationURL", "type": "string", "description": "Supabase password reset URL", "required": true, "example": "https://yourproject.supabase.co/auth/v1/verify?..."}
    ]'::jsonb,
    'authentication',
    'recovery',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 15: Magic Link
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    supabase_template_name,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_auth_id,
    'auth_magic_link',
    'Magic Link Login',
    'Supabase magic link for passwordless login',
    'supabase_auth',
    'magic_link',
    'Your Vilo magic link',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Magic Link</h2>
      <p>Click the button below to sign in to Vilo without a password.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In</a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn''t request this link, you can safely ignore this email.</p>
      <p>Best regards,<br>The Vilo Team</p>
    </div>',
    '[
      {"name": "ConfirmationURL", "type": "string", "description": "Supabase magic link URL", "required": true, "example": "https://yourproject.supabase.co/auth/v1/verify?..."}
    ]'::jsonb,
    'authentication',
    'login',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;

  -- Template 16: User Invitation
  INSERT INTO email_templates (
    category_id,
    template_key,
    display_name,
    description,
    template_type,
    supabase_template_name,
    subject_template,
    html_template,
    variables,
    feature_tag,
    stage_tag,
    is_active,
    is_system_template
  ) VALUES (
    category_auth_id,
    'auth_invite_user',
    'User Invitation',
    'Supabase invitation email for new users',
    'supabase_auth',
    'invite',
    'You''ve been invited to join Vilo',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You''re Invited!</h2>
      <p>You''ve been invited to join Vilo. Click the button below to accept your invitation and create your account.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="background-color: #047857; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
      </div>
      <p>If you weren''t expecting this invitation, you can safely ignore this email.</p>
      <p>Best regards,<br>The Vilo Team</p>
    </div>',
    '[
      {"name": "ConfirmationURL", "type": "string", "description": "Supabase invitation URL", "required": true, "example": "https://yourproject.supabase.co/auth/v1/verify?..."}
    ]'::jsonb,
    'authentication',
    'invite',
    true,
    true
  ) ON CONFLICT (template_key) DO NOTHING;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - comment out for production)
-- ============================================================================

-- Verify tables created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name LIKE 'email_%'
-- ORDER BY table_name;

-- Verify RLS policies
-- SELECT tablename, policyname FROM pg_policies
-- WHERE tablename LIKE 'email_%'
-- ORDER BY tablename, policyname;

-- Verify seed data
-- SELECT COUNT(*) as category_count FROM email_template_categories;
-- SELECT COUNT(*) as template_count FROM email_templates;
-- SELECT category_id, COUNT(*) as templates_per_category
-- FROM email_templates
-- GROUP BY category_id;
