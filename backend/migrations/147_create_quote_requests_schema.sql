-- Migration: 147_create_quote_requests_schema.sql
-- Description: Create quote requests system for custom booking inquiries
-- Date: 2026-01-26
--
-- Features:
-- - Property-scoped quote requests
-- - Multiple date flexibility options (exact, flexible, very flexible)
-- - Budget range tracking
-- - Group type categorization (family, business, wedding, etc.)
-- - Status workflow (pending → responded → converted/declined/expired)
-- - Auto-expiration after 30 days
-- - RLS policies for property owner isolation
-- - Integration with customers, chat, and notifications

-- ============================================================================
-- STEP 1: Create Enums
-- ============================================================================

-- Quote request status enum
DO $$ BEGIN
  CREATE TYPE quote_request_status AS ENUM (
    'pending',      -- Just submitted, awaiting owner review
    'responded',    -- Owner has responded (via chat or direct response)
    'converted',    -- Converted to booking
    'declined',     -- Owner declined the quote
    'expired'       -- Auto-expired after X days
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Date flexibility enum
DO $$ BEGIN
  CREATE TYPE quote_date_flexibility AS ENUM (
    'exact',        -- Specific dates required
    'flexible',     -- Flexible within a range
    'very_flexible' -- Very flexible, open to suggestions
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Group type enum
DO $$ BEGIN
  CREATE TYPE quote_group_type AS ENUM (
    'family',
    'friends',
    'business',
    'wedding',
    'corporate_event',
    'retreat',
    'conference',
    'celebration',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STEP 2: Update customer_source enum to include quote_request
-- ============================================================================

DO $$ BEGIN
  ALTER TYPE customer_source ADD VALUE IF NOT EXISTS 'quote_request';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STEP 3: Create quote_requests table
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Associations
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Linked after guest creates account
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL, -- Auto-created chat
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- If converted to booking

  -- Contact Information (denormalized for convenience)
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(50),

  -- Date Requirements
  date_flexibility quote_date_flexibility NOT NULL,
  preferred_check_in DATE,
  preferred_check_out DATE,
  flexible_date_start DATE,    -- For flexible dates
  flexible_date_end DATE,      -- For flexible dates
  nights_count INTEGER,         -- Approximate number of nights

  -- Guest Requirements
  adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count >= 1),
  children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0),
  group_size INTEGER NOT NULL CHECK (group_size >= 1), -- Total: adults + children
  group_type quote_group_type NOT NULL,

  -- Budget & Preferences
  budget_min DECIMAL(12,2) CHECK (budget_min >= 0),
  budget_max DECIMAL(12,2) CHECK (budget_max >= 0),
  currency VARCHAR(3) DEFAULT 'ZAR',

  -- Special Requirements
  special_requirements TEXT,
  event_type VARCHAR(100),      -- If group_type is wedding/event
  event_description TEXT,
  preferred_room_types TEXT[],  -- Array of room IDs or types

  -- Status Management
  status quote_request_status NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),   -- For high-value quotes flagging (0-10)

  -- Response Tracking
  owner_response TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Expiration
  expires_at TIMESTAMPTZ,       -- Auto-expire after X days (default 30)

  -- Metadata
  source VARCHAR(50) DEFAULT 'website', -- 'website', 'widget', 'direct', 'api'
  user_agent TEXT,
  referrer_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (
    -- If date_flexibility is 'exact', both check-in and check-out must be provided
    (date_flexibility != 'exact') OR
    (preferred_check_in IS NOT NULL AND preferred_check_out IS NOT NULL)
  ),
  CHECK (
    -- If date_flexibility is 'flexible', flexible range must be provided
    (date_flexibility != 'flexible') OR
    (flexible_date_start IS NOT NULL AND flexible_date_end IS NOT NULL)
  ),
  CHECK (
    -- Budget max must be greater than or equal to budget min
    (budget_min IS NULL OR budget_max IS NULL) OR
    (budget_max >= budget_min)
  ),
  CHECK (
    -- Group size must equal adults + children
    group_size = adults_count + children_count
  )
);

-- ============================================================================
-- STEP 4: Create Indexes for Performance
-- ============================================================================

-- Property ID - for fast property lookups
CREATE INDEX IF NOT EXISTS idx_quote_requests_property
ON quote_requests(property_id);

-- Company ID - for company-wide queries
CREATE INDEX IF NOT EXISTS idx_quote_requests_company
ON quote_requests(company_id);

-- Customer ID - for customer history
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer
ON quote_requests(customer_id);

-- Status - for filtering
CREATE INDEX IF NOT EXISTS idx_quote_requests_status
ON quote_requests(status);

-- Conversation ID - for chat integration (only index non-null values)
CREATE INDEX IF NOT EXISTS idx_quote_requests_conversation
ON quote_requests(conversation_id)
WHERE conversation_id IS NOT NULL;

-- Created at - for sorting by date (DESC for newest first)
CREATE INDEX IF NOT EXISTS idx_quote_requests_created
ON quote_requests(created_at DESC);

-- Expires at - for expiration cron job (only pending quotes)
CREATE INDEX IF NOT EXISTS idx_quote_requests_expires
ON quote_requests(expires_at)
WHERE status = 'pending';

-- Group type - for filtering by group type
CREATE INDEX IF NOT EXISTS idx_quote_requests_group_type
ON quote_requests(group_type);

-- Booking ID - for converted quotes
CREATE INDEX IF NOT EXISTS idx_quote_requests_booking
ON quote_requests(booking_id)
WHERE booking_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Create Unique Constraint
-- ============================================================================

-- Only one pending quote per customer per property
-- This prevents guests from submitting duplicate quote requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_requests_customer_property_pending
ON quote_requests(customer_id, property_id)
WHERE status = 'pending';

-- ============================================================================
-- STEP 6: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS quote_requests_owner_select ON quote_requests;
DROP POLICY IF EXISTS quote_requests_owner_update ON quote_requests;
DROP POLICY IF EXISTS quote_requests_guest_select ON quote_requests;
DROP POLICY IF EXISTS quote_requests_public_insert ON quote_requests;
DROP POLICY IF EXISTS quote_requests_service_all ON quote_requests;

-- Policy 1: Property owners can SELECT quotes for their properties
CREATE POLICY quote_requests_owner_select ON quote_requests
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Policy 2: Property owners can UPDATE quotes for their properties
CREATE POLICY quote_requests_owner_update ON quote_requests
  FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Policy 3: Guests can SELECT their own quotes
-- Match by user_id (if they have an account) OR by email (if not yet registered)
CREATE POLICY quote_requests_guest_select ON quote_requests
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    guest_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Policy 4: Anyone can INSERT quote requests (public submission endpoint)
CREATE POLICY quote_requests_public_insert ON quote_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy 5: Service role has full access (for backend operations)
CREATE POLICY quote_requests_service_all ON quote_requests
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 7: Create Triggers
-- ============================================================================

-- Trigger: Update updated_at on every update
DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Create Function for Auto-Expiring Old Quotes
-- ============================================================================

-- Function to expire old pending quote requests
-- This will be called by a cron job daily
CREATE OR REPLACE FUNCTION expire_old_quote_requests()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Update all pending quotes that have passed their expiration date
  UPDATE quote_requests
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    status = 'pending'
    AND expires_at < NOW();

  -- Get the count of affected rows
  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Log the operation
  RAISE NOTICE 'Expired % quote requests', affected_rows;

  -- Return the count
  RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for cron job)
GRANT EXECUTE ON FUNCTION expire_old_quote_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_quote_requests() TO service_role;

-- ============================================================================
-- STEP 9: Create Notification Templates
-- ============================================================================

-- Insert notification templates for quote requests
-- First, get the notification_type_id for 'system' notifications
DO $$
DECLARE
  system_type_id UUID;
BEGIN
  -- Get the system notification type ID
  SELECT id INTO system_type_id
  FROM notification_types
  WHERE name = 'system'
  LIMIT 1;

  -- Insert quote_request_received template (to property owner)
  INSERT INTO notification_templates (
    name,
    notification_type_id,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    'quote_request_received',
    system_type_id,
    'New Quote Request from {{guest_name}}',
    'You have a new quote request for {{property_name}}. {{guest_name}} is interested in staying {{dates}} with a group of {{group_size}} guests ({{group_type}}).',
    'New Quote Request for {{property_name}}',
    '<h2>New Quote Request</h2>
     <p>Hi there,</p>
     <p>You have received a new quote request for <strong>{{property_name}}</strong>.</p>
     <h3>Guest Details:</h3>
     <ul>
       <li><strong>Name:</strong> {{guest_name}}</li>
       <li><strong>Email:</strong> {{guest_email}}</li>
       <li><strong>Dates:</strong> {{dates}}</li>
       <li><strong>Group Size:</strong> {{group_size}} guests</li>
       <li><strong>Group Type:</strong> {{group_type}}</li>
     </ul>
     <p>Please respond as soon as possible to increase your chances of securing this booking.</p>
     <p><a href="{{action_url}}" style="display: inline-block; padding: 12px 24px; background-color: #047857; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Quote Request</a></p>
     <p>Best regards,<br>The Vilo Team</p>',
    'high',
    'info',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (name) DO UPDATE SET
    title_template = EXCLUDED.title_template,
    message_template = EXCLUDED.message_template,
    email_subject_template = EXCLUDED.email_subject_template,
    email_body_template = EXCLUDED.email_body_template,
    updated_at = NOW();

  -- Insert quote_request_responded template (to guest)
  INSERT INTO notification_templates (
    name,
    notification_type_id,
    title_template,
    message_template,
    email_subject_template,
    email_body_template,
    default_priority,
    default_variant,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    'quote_request_responded',
    system_type_id,
    '{{property_name}} responded to your quote',
    'The property owner at {{property_name}} has responded to your quote request. Check your messages for details.',
    '{{property_name}} Responded to Your Quote Request',
    '<h2>Quote Response Received</h2>
     <p>Hi {{guest_name}},</p>
     <p>Great news! The property owner at <strong>{{property_name}}</strong> has responded to your quote request.</p>
     <p>Please check your messages to view their response and continue the conversation.</p>
     <p><a href="{{action_url}}" style="display: inline-block; padding: 12px 24px; background-color: #047857; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Response</a></p>
     <p>If you have any questions, feel free to reply directly to the property owner through our chat system.</p>
     <p>Best regards,<br>The Vilo Team</p>',
    'normal',
    'success',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (name) DO UPDATE SET
    title_template = EXCLUDED.title_template,
    message_template = EXCLUDED.message_template,
    email_subject_template = EXCLUDED.email_subject_template,
    email_body_template = EXCLUDED.email_body_template,
    updated_at = NOW();

  RAISE NOTICE 'Notification templates created/updated successfully';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create notification templates: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 10: Create Helper View (Optional - for analytics)
-- ============================================================================

-- View for quote request analytics
-- This makes it easier to query quote stats without complex joins
CREATE OR REPLACE VIEW quote_requests_with_details AS
SELECT
  qr.*,
  p.name AS property_name,
  p.slug AS property_slug,
  c.name AS company_name,
  cust.email AS customer_email,
  cust.full_name AS customer_full_name,
  CASE
    WHEN qr.responded_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (qr.responded_at - qr.created_at)) / 3600
    ELSE NULL
  END AS response_time_hours
FROM quote_requests qr
LEFT JOIN properties p ON qr.property_id = p.id
LEFT JOIN companies c ON qr.company_id = c.id
LEFT JOIN customers cust ON qr.customer_id = cust.id;

-- Grant access to the view
GRANT SELECT ON quote_requests_with_details TO authenticated;
GRANT SELECT ON quote_requests_with_details TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- These comments serve as documentation for how to verify the migration

-- Check table exists and structure
-- SELECT * FROM quote_requests LIMIT 1;

-- Check enums created
-- SELECT enum_range(NULL::quote_request_status);
-- SELECT enum_range(NULL::quote_date_flexibility);
-- SELECT enum_range(NULL::quote_group_type);

-- Check indexes created
-- SELECT indexname FROM pg_indexes WHERE tablename = 'quote_requests';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'quote_requests';

-- Check triggers
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'quote_requests';

-- Check notification templates
-- SELECT name, title_template FROM notification_templates WHERE name LIKE 'quote_request%';

-- Test expiration function (don't run in production without testing!)
-- SELECT * FROM expire_old_quote_requests();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

COMMENT ON TABLE quote_requests IS 'Stores custom quote requests from guests for properties. Property-scoped with auto-expiration and full workflow tracking.';
COMMENT ON COLUMN quote_requests.date_flexibility IS 'Indicates how flexible the guest is with dates: exact (specific dates), flexible (range), very_flexible (open to suggestions)';
COMMENT ON COLUMN quote_requests.group_type IS 'Type of group requesting the quote (family, business, wedding, etc.) - helps owners prioritize and respond appropriately';
COMMENT ON COLUMN quote_requests.priority IS 'Priority score (0-10) calculated based on group size, budget, and event type - helps owners prioritize responses';
COMMENT ON COLUMN quote_requests.expires_at IS 'Timestamp when this quote request expires if not responded to. Auto-expires pending quotes after 30 days.';
COMMENT ON FUNCTION expire_old_quote_requests() IS 'Expires pending quote requests past their expiration date. Should be called daily by cron job.';
