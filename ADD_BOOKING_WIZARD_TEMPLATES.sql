-- ============================================================================
-- Add New Booking Wizard Email Templates
-- ============================================================================
-- Purpose: Add the 2 new booking wizard templates to existing email system
-- Date: 2026-01-24

DO $$
DECLARE
  category_bookings_id UUID;
BEGIN
  -- Get the bookings category ID
  SELECT id INTO category_bookings_id
  FROM email_template_categories
  WHERE name = 'bookings';

  -- If category doesn't exist, create it
  IF category_bookings_id IS NULL THEN
    INSERT INTO email_template_categories (name, display_name, description, icon, sort_order, is_system_category)
    VALUES ('bookings', 'Booking Emails', 'Booking confirmations and notifications', 'calendar', 2, true)
    RETURNING id INTO category_bookings_id;
  END IF;

  -- Template 1: Guest Password Setup (NEW - for booking wizard)
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
  ) ON CONFLICT (template_key) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    subject_template = EXCLUDED.subject_template,
    html_template = EXCLUDED.html_template,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  -- Template 2: Existing User Booking Confirmation (NEW - for booking wizard)
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
  ) ON CONFLICT (template_key) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    subject_template = EXCLUDED.subject_template,
    html_template = EXCLUDED.html_template,
    variables = EXCLUDED.variables,
    updated_at = NOW();

END $$;

-- Verify the templates were added
SELECT
  template_key,
  display_name,
  is_active,
  created_at
FROM email_templates
WHERE template_key IN ('booking_guest_password_setup', 'booking_existing_user_confirmation')
ORDER BY template_key;

-- Show total template count
SELECT
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_active = true) as active_templates,
  COUNT(*) FILTER (WHERE feature_tag = 'bookings') as booking_templates
FROM email_templates;
