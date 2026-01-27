-- Migration: 101_add_subscription_notification_templates.sql
-- Description: Add notification templates for subscription management events
-- Date: 2026-01-17

-- ============================================================================
-- ADD SUBSCRIPTION NOTIFICATION TYPE
-- ============================================================================

-- Add 'subscription' notification type if it doesn't exist
INSERT INTO notification_types (name, display_name, description, icon, color, is_system_type, sort_order)
VALUES (
  'subscription',
  'Subscription',
  'Subscription and billing management notifications',
  'credit-card',
  'info',
  true,
  8
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ADD SUBSCRIPTION NOTIFICATION TEMPLATES
-- ============================================================================

DO $$
DECLARE
  v_subscription_type_id UUID;
BEGIN
  -- Get the subscription notification type ID
  SELECT id INTO v_subscription_type_id
  FROM notification_types
  WHERE name = 'subscription';

  -- Template 1: Admin requests upgrade
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant
  ) VALUES (
    v_subscription_type_id,
    'subscription_upgrade_request',
    'Subscription Upgrade Available',
    '{{admin_name}} has recommended upgrading your plan to {{new_plan_name}}. {{admin_notes}}',
    'Subscription Upgrade Recommended - {{new_plan_name}}',
    '<h1>Subscription Upgrade Available</h1>
    <p>Hi {{user_name}},</p>
    <p><strong>{{admin_name}}</strong> has recommended upgrading your subscription plan.</p>
    <h2>Recommended Plan: {{new_plan_name}}</h2>
    <p><strong>Current Plan:</strong> {{current_plan_name}} - {{current_price}}/{{current_interval}}</p>
    <p><strong>New Plan:</strong> {{new_plan_name}} - {{new_price}}/{{new_interval}}</p>
    <p><strong>Price Difference:</strong> {{price_difference}}</p>
    <h3>Admin Notes:</h3>
    <p>{{admin_notes}}</p>
    <p><strong>What happens next?</strong></p>
    <ul>
      <li>Review the upgrade details in your dashboard</li>
      <li>Accept or decline the upgrade within 7 days</li>
      <li>If accepted, the upgrade will take effect on your next billing cycle ({{next_billing_date}})</li>
    </ul>
    <p><a href="{{app_url}}/profile?tab=billing" style="display:inline-block;padding:12px 24px;background:#047857;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">Review Upgrade</a></p>
    <p style="color:#666;font-size:14px;margin-top:24px;">This upgrade request expires on {{expires_at}}</p>',
    'high',
    'info'
  ) ON CONFLICT (name) DO NOTHING;

  -- Template 2: Subscription paused by admin
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant
  ) VALUES (
    v_subscription_type_id,
    'subscription_paused',
    'Subscription Paused',
    'Your subscription has been paused by {{admin_name}}. {{pause_reason}}',
    'Your Subscription Has Been Paused',
    '<h1>Subscription Paused</h1>
    <p>Hi {{user_name}},</p>
    <p>Your <strong>{{plan_name}}</strong> subscription has been paused by <strong>{{admin_name}}</strong>.</p>
    <h3>Reason:</h3>
    <p>{{pause_reason}}</p>
    <h3>What does this mean?</h3>
    <ul>
      <li><strong>Billing Stopped:</strong> No further charges will be made</li>
      <li><strong>Read-Only Access:</strong> You can view your data but cannot create or edit</li>
      <li><strong>Data Preserved:</strong> All your data remains safe and accessible</li>
    </ul>
    <h3>How to reactivate:</h3>
    <p>You can reactivate your account by:</p>
    <ul>
      <li>Selecting a new subscription plan and completing payment</li>
      <li>Contacting support if you believe this was done in error</li>
    </ul>
    <p><a href="{{app_url}}/pricing" style="display:inline-block;padding:12px 24px;background:#047857;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">Reactivate Account</a></p>
    <p><a href="{{app_url}}/support" style="display:inline-block;padding:12px 24px;background:#374151;color:white;text-decoration:none;border-radius:6px;margin-top:8px;margin-left:8px;">Contact Support</a></p>',
    'urgent',
    'warning'
  ) ON CONFLICT (name) DO NOTHING;

  -- Template 3: Subscription cancelled by admin
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant
  ) VALUES (
    v_subscription_type_id,
    'subscription_cancelled',
    'Subscription Cancelled',
    'Your subscription has been cancelled by {{admin_name}}. Access remains until {{access_end_date}}.',
    'Your Subscription Has Been Cancelled',
    '<h1>Subscription Cancelled</h1>
    <p>Hi {{user_name}},</p>
    <p>Your <strong>{{plan_name}}</strong> subscription has been cancelled by <strong>{{admin_name}}</strong>.</p>
    <h3>Reason:</h3>
    <p>{{cancel_reason}}</p>
    <h3>Important Information:</h3>
    <ul>
      <li><strong>Billing Stopped:</strong> No further charges will be made</li>
      <li><strong>Access Until:</strong> {{access_end_date}} (end of your paid period)</li>
      <li><strong>Full Access:</strong> You retain full access until the date above</li>
      <li><strong>After Expiry:</strong> Account will switch to read-only mode</li>
    </ul>
    <h3>What happens next?</h3>
    <p>You can continue using all features until <strong>{{access_end_date}}</strong>. After this date:</p>
    <ul>
      <li>Your account switches to read-only mode</li>
      <li>All data remains safe and accessible</li>
      <li>You can reactivate anytime by selecting a new plan</li>
    </ul>
    <p><a href="{{app_url}}/pricing" style="display:inline-block;padding:12px 24px;background:#047857;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">Reactivate Subscription</a></p>
    <p><a href="{{app_url}}/support" style="display:inline-block;padding:12px 24px;background:#374151;color:white;text-decoration:none;border-radius:6px;margin-top:8px;margin-left:8px;">Contact Support</a></p>',
    'urgent',
    'warning'
  ) ON CONFLICT (name) DO NOTHING;

  -- Template 4: Upgrade confirmed and scheduled
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant
  ) VALUES (
    v_subscription_type_id,
    'subscription_upgrade_confirmed',
    'Subscription Upgrade Confirmed',
    'Your upgrade to {{new_plan_name}} has been confirmed and will take effect on {{effective_date}}.',
    'Subscription Upgrade Confirmed - {{new_plan_name}}',
    '<h1>Upgrade Confirmed!</h1>
    <p>Hi {{user_name}},</p>
    <p>Great news! Your subscription upgrade to <strong>{{new_plan_name}}</strong> has been confirmed.</p>
    <h3>Upgrade Details:</h3>
    <p><strong>From:</strong> {{current_plan_name}} - {{current_price}}/{{current_interval}}</p>
    <p><strong>To:</strong> {{new_plan_name}} - {{new_price}}/{{new_interval}}</p>
    <p><strong>Effective Date:</strong> {{effective_date}}</p>
    <h3>New Features & Limits:</h3>
    <ul>
      {{#each new_features}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
    <h3>What happens next?</h3>
    <ul>
      <li>Your current plan continues until {{current_period_end}}</li>
      <li>On {{effective_date}}, your new plan activates</li>
      <li>Your next invoice will reflect the new pricing</li>
      <li>New limits and features become available immediately on activation</li>
    </ul>
    <p><a href="{{app_url}}/profile?tab=billing" style="display:inline-block;padding:12px 24px;background:#047857;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">View Billing Details</a></p>',
    'normal',
    'success'
  ) ON CONFLICT (name) DO NOTHING;

  -- Template 5: Subscription resumed from paused state
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant
  ) VALUES (
    v_subscription_type_id,
    'subscription_resumed',
    'Subscription Reactivated',
    'Your {{plan_name}} subscription has been reactivated. Welcome back!',
    'Your Subscription Has Been Reactivated',
    '<h1>Welcome Back!</h1>
    <p>Hi {{user_name}},</p>
    <p>Your <strong>{{plan_name}}</strong> subscription has been successfully reactivated.</p>
    <h3>What''s restored:</h3>
    <ul>
      <li><strong>Full Access:</strong> All features are now available</li>
      <li><strong>Billing Resumed:</strong> Normal billing cycle continues</li>
      <li><strong>All Features:</strong> Create, edit, and manage without restrictions</li>
    </ul>
    <p><strong>Next Billing Date:</strong> {{next_billing_date}}</p>
    <p><strong>Plan Details:</strong> {{plan_name}} - {{price}}/{{interval}}</p>
    <p><a href="{{app_url}}/dashboard" style="display:inline-block;padding:12px 24px;background:#047857;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">Go to Dashboard</a></p>',
    'high',
    'success'
  ) ON CONFLICT (name) DO NOTHING;

  -- Template 6: Payment required for paused account
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant
  ) VALUES (
    v_subscription_type_id,
    'subscription_payment_required',
    'Payment Required - Account Paused',
    'Your account is currently paused. Select a plan to restore full access.',
    'Payment Required to Reactivate Your Account',
    '<h1>Payment Required</h1>
    <p>Hi {{user_name}},</p>
    <p>Your account is currently in a paused state with read-only access.</p>
    <h3>Current Status:</h3>
    <ul>
      <li><strong>Access Level:</strong> Read-Only</li>
      <li><strong>Data:</strong> All your data is safe and viewable</li>
      <li><strong>Restrictions:</strong> Cannot create or edit content</li>
    </ul>
    <h3>Restore Full Access:</h3>
    <p>To restore full access to your account, please select a subscription plan and complete payment.</p>
    <p><a href="{{app_url}}/pricing" style="display:inline-block;padding:12px 24px;background:#047857;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">View Plans & Pricing</a></p>
    <p style="margin-top:24px;">Need help? <a href="{{app_url}}/support">Contact our support team</a></p>',
    'high',
    'warning'
  ) ON CONFLICT (name) DO NOTHING;

  -- Template 7: Upgrade request declined by user
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant
  ) VALUES (
    v_subscription_type_id,
    'subscription_upgrade_declined',
    'Upgrade Request Declined - {{user_name}}',
    '{{user_name}} has declined the upgrade to {{new_plan_name}}. {{user_notes}}',
    NULL, -- Admin notification, no email sent to user
    NULL,
    'normal',
    'info'
  ) ON CONFLICT (name) DO NOTHING;

  -- Template 8: Upgrade request accepted by user (admin notification)
  INSERT INTO notification_templates (
    notification_type_id,
    name,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant
  ) VALUES (
    v_subscription_type_id,
    'subscription_upgrade_accepted_admin',
    'Upgrade Accepted - {{user_name}}',
    '{{user_name}} has accepted the upgrade to {{new_plan_name}}. Upgrade scheduled for {{effective_date}}.',
    NULL, -- Admin notification, no email
    NULL,
    'normal',
    'success'
  ) ON CONFLICT (name) DO NOTHING;

END $$;

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE notification_types IS 'Notification categories including subscription management events';
