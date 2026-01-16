-- Migration: 088_create_support_schema.sql
-- Description: Create Support Ticket system schema for Property Owner → Vilo Support
-- Date: 2026-01-15
--
-- This migration creates the support system tables:
-- - support_tickets: Support conversation management with SLA tracking
-- - support_canned_responses: Quick reply templates for agents
-- - support_internal_notes: Internal notes not visible to property owners

-- ============================================================================
-- CREATE SUPPORT TICKETS TABLE
-- ============================================================================

-- Table for managing support tickets (Property Owner → Vilo Support Team)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID UNIQUE REFERENCES chat_conversations(id) ON DELETE CASCADE,

  -- Ticket Identification
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- "SUP-2026-0001"
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal',
  category VARCHAR(100), -- billing, technical, general, feature_request

  -- Parties
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Property owner
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Support agent
  assigned_at TIMESTAMPTZ,

  -- Customer Context
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Resolution Tracking
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  -- SLA Tracking
  sla_due_at TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_ticket_status CHECK (status IN (
    'open', 'assigned', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'
  )),
  CONSTRAINT valid_ticket_priority CHECK (priority IN (
    'low', 'normal', 'high', 'urgent'
  ))
);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_status
  ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned
  ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_requester
  ON support_tickets(requester_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_property
  ON support_tickets(property_id) WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_company
  ON support_tickets(company_id) WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_sla
  ON support_tickets(sla_due_at, sla_breached);

CREATE INDEX IF NOT EXISTS idx_support_tickets_priority
  ON support_tickets(priority, status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created
  ON support_tickets(created_at DESC);

-- ============================================================================
-- CREATE SUPPORT CANNED RESPONSES TABLE
-- ============================================================================

-- Table for storing quick reply templates for support agents
CREATE TABLE IF NOT EXISTS support_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Response Details
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  shortcut VARCHAR(50), -- Keyboard shortcut (e.g., "/billing")

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for support_canned_responses
CREATE INDEX IF NOT EXISTS idx_canned_responses_category
  ON support_canned_responses(category);

CREATE INDEX IF NOT EXISTS idx_canned_responses_shortcut
  ON support_canned_responses(shortcut) WHERE shortcut IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_canned_responses_active
  ON support_canned_responses(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_canned_responses_usage
  ON support_canned_responses(usage_count DESC);

-- ============================================================================
-- CREATE SUPPORT INTERNAL NOTES TABLE
-- ============================================================================

-- Table for internal notes not visible to property owners
CREATE TABLE IF NOT EXISTS support_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,

  -- Note Details
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for support_internal_notes
CREATE INDEX IF NOT EXISTS idx_support_notes_ticket
  ON support_internal_notes(ticket_id);

CREATE INDEX IF NOT EXISTS idx_support_notes_author
  ON support_internal_notes(author_id) WHERE author_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_notes_created
  ON support_internal_notes(created_at DESC);

-- ============================================================================
-- CREATE TICKET NUMBER SEQUENCE
-- ============================================================================

-- Sequence for generating sequential ticket numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR AS $$
DECLARE
  current_year VARCHAR(4);
  sequence_num INTEGER;
  ticket_num VARCHAR(20);
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::VARCHAR;
  sequence_num := nextval('support_ticket_number_seq');
  ticket_num := 'SUP-' || current_year || '-' || LPAD(sequence_num::VARCHAR, 4, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- ============================================================================
-- CREATE SLA MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to calculate SLA due time based on priority
CREATE OR REPLACE FUNCTION calculate_sla_due_time(ticket_priority VARCHAR)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  hours_to_add INTEGER;
BEGIN
  CASE ticket_priority
    WHEN 'urgent' THEN hours_to_add := 4;   -- 4 hours
    WHEN 'high' THEN hours_to_add := 8;     -- 8 hours
    WHEN 'normal' THEN hours_to_add := 24;  -- 24 hours
    WHEN 'low' THEN hours_to_add := 48;     -- 48 hours
    ELSE hours_to_add := 24;                 -- default 24 hours
  END CASE;

  RETURN NOW() + (hours_to_add || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set SLA due time on ticket creation
CREATE OR REPLACE FUNCTION set_sla_due_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_due_at IS NULL THEN
    NEW.sla_due_at := calculate_sla_due_time(NEW.priority);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_sla_due_time ON support_tickets;
CREATE TRIGGER trigger_set_sla_due_time
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_sla_due_time();

-- Function to check and mark SLA breaches
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if ticket is being resolved or closed
  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
    -- Mark SLA breach if resolved after due time
    IF NEW.resolved_at IS NULL THEN
      NEW.resolved_at := NOW();
    END IF;

    IF NEW.resolved_at > NEW.sla_due_at THEN
      NEW.sla_breached := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_sla_breach ON support_tickets;
CREATE TRIGGER trigger_check_sla_breach
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION check_sla_breach();

-- ============================================================================
-- CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger for support_tickets
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER trigger_update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Trigger for support_canned_responses
CREATE OR REPLACE FUNCTION update_canned_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_canned_responses_updated_at ON support_canned_responses;
CREATE TRIGGER trigger_update_canned_responses_updated_at
  BEFORE UPDATE ON support_canned_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_canned_responses_updated_at();

-- Trigger for support_internal_notes
CREATE OR REPLACE FUNCTION update_support_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_support_notes_updated_at ON support_internal_notes;
CREATE TRIGGER trigger_update_support_notes_updated_at
  BEFORE UPDATE ON support_internal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_support_notes_updated_at();

-- ============================================================================
-- SEED DEFAULT CANNED RESPONSES
-- ============================================================================

-- Insert default canned responses for support agents
INSERT INTO support_canned_responses (title, content, category, shortcut) VALUES
(
  'Welcome Message',
  'Hi! Thank you for contacting Vilo support. I''m here to help you. Could you please provide more details about your issue?',
  'general',
  '/welcome'
),
(
  'Billing Issue',
  'I understand you''re experiencing a billing issue. Let me look into your account details and get back to you shortly.',
  'billing',
  '/billing'
),
(
  'Technical Issue',
  'I see you''re having a technical issue. To help you better, could you please provide: 1) What were you trying to do? 2) What happened instead? 3) Any error messages you saw?',
  'technical',
  '/tech'
),
(
  'Feature Request',
  'Thank you for your feature suggestion! I''ll pass this along to our product team for consideration. We appreciate your feedback.',
  'feature_request',
  '/feature'
),
(
  'Issue Resolved',
  'Great! I''m glad we could resolve your issue. Is there anything else I can help you with today?',
  'general',
  '/resolved'
),
(
  'Escalating',
  'I''m escalating this issue to our senior support team. They will reach out to you within the next few hours with a solution.',
  'general',
  '/escalate'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION AND REPORTING
-- ============================================================================

DO $support_schema_report$
DECLARE
  tickets_table_exists BOOLEAN;
  canned_responses_table_exists BOOLEAN;
  notes_table_exists BOOLEAN;
  canned_responses_count INTEGER;
BEGIN
  -- Check if tables were created
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'support_tickets'
  ) INTO tickets_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'support_canned_responses'
  ) INTO canned_responses_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'support_internal_notes'
  ) INTO notes_table_exists;

  -- Count seeded canned responses
  SELECT COUNT(*) INTO canned_responses_count
  FROM support_canned_responses;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Support Schema Creation Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'support_tickets: %',
    CASE WHEN tickets_table_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE 'support_canned_responses: %',
    CASE WHEN canned_responses_table_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE 'support_internal_notes: %',
    CASE WHEN notes_table_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE 'Default canned responses seeded: %', canned_responses_count;
  RAISE NOTICE '========================================';

  -- Sanity check
  IF NOT (tickets_table_exists AND canned_responses_table_exists AND notes_table_exists) THEN
    RAISE WARNING 'Some support tables failed to create. Check migration log.';
  END IF;
END $support_schema_report$;
