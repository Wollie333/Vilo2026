-- Migration: 087_create_whatsapp_schema.sql
-- Description: Create WhatsApp Business API integration schema
-- Date: 2026-01-15
--
-- This migration creates the core tables for WhatsApp integration:
-- - whatsapp_message_templates: Customizable message templates
-- - whatsapp_message_metadata: Message tracking and delivery status
-- - whatsapp_message_queue: Retry queue with exponential backoff
-- - whatsapp_opt_outs: GDPR-compliant opt-out tracking

-- ============================================================================
-- CREATE WHATSAPP MESSAGE TEMPLATES TABLE
-- ============================================================================

-- Table for storing customizable message templates with Meta approval tracking
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- NULL = global template
  template_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(100) NOT NULL, -- Name for Meta approval
  language_code VARCHAR(10) NOT NULL DEFAULT 'en', -- ISO 639-1 (en, de, fr, es, etc.)

  -- Template Content
  header_text TEXT,
  body_template TEXT NOT NULL, -- Main message with {{placeholders}}
  footer_text TEXT,
  button_config JSONB, -- WhatsApp buttons configuration (optional)

  -- Meta WhatsApp API Status
  meta_template_id VARCHAR(255), -- Meta's template ID after approval
  meta_status VARCHAR(50) DEFAULT 'draft', -- draft, pending, approved, rejected
  meta_rejected_reason TEXT,
  submitted_to_meta_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,

  -- Timing Configuration
  is_enabled BOOLEAN DEFAULT true,
  send_timing_days_before INTEGER, -- For payment_reminder/pre_arrival
  send_timing_hours_before INTEGER,

  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_template_type CHECK (template_type IN (
    'booking_confirmation',
    'payment_received',
    'payment_reminder',
    'pre_arrival',
    'booking_modified',
    'booking_cancelled'
  )),
  CONSTRAINT valid_meta_status CHECK (meta_status IN (
    'draft', 'pending', 'approved', 'rejected'
  )),
  UNIQUE(property_id, template_type, language_code)
);

-- Indexes for whatsapp_message_templates
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_property
  ON whatsapp_message_templates(property_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_type
  ON whatsapp_message_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status
  ON whatsapp_message_templates(meta_status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_enabled
  ON whatsapp_message_templates(is_enabled) WHERE is_enabled = true;

-- ============================================================================
-- CREATE WHATSAPP MESSAGE METADATA TABLE
-- ============================================================================

-- Table for tracking WhatsApp-specific message data and delivery status
CREATE TABLE IF NOT EXISTS whatsapp_message_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_message_id UUID UNIQUE REFERENCES chat_messages(id) ON DELETE CASCADE,

  -- WhatsApp API IDs
  whatsapp_message_id VARCHAR(255) UNIQUE, -- Meta's message ID
  whatsapp_conversation_id VARCHAR(255), -- Meta conversation ID

  -- Delivery Tracking
  status VARCHAR(50) DEFAULT 'queued', -- queued, sent, delivered, read, failed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Template Info
  template_id UUID REFERENCES whatsapp_message_templates(id) ON DELETE SET NULL,
  template_variables JSONB, -- {{placeholder}} values used

  -- Phone Numbers (E.164 format)
  recipient_phone VARCHAR(20), -- E.164 format (+27821234567)
  sender_phone VARCHAR(20), -- WhatsApp Business number

  -- Message Details
  direction VARCHAR(20) DEFAULT 'outbound', -- outbound, inbound
  message_type VARCHAR(50) DEFAULT 'template', -- template, text, image, document
  meta_response JSONB, -- Full API response from Meta

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN (
    'queued', 'sent', 'delivered', 'read', 'failed'
  )),
  CONSTRAINT valid_direction CHECK (direction IN ('outbound', 'inbound')),
  CONSTRAINT valid_message_type CHECK (message_type IN (
    'template', 'text', 'image', 'document', 'video', 'audio'
  ))
);

-- Indexes for whatsapp_message_metadata
CREATE INDEX IF NOT EXISTS idx_whatsapp_metadata_message
  ON whatsapp_message_metadata(chat_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_metadata_whatsapp_id
  ON whatsapp_message_metadata(whatsapp_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_metadata_status
  ON whatsapp_message_metadata(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_metadata_phone
  ON whatsapp_message_metadata(recipient_phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_metadata_direction
  ON whatsapp_message_metadata(direction);

-- ============================================================================
-- CREATE WHATSAPP MESSAGE QUEUE TABLE
-- ============================================================================

-- Table for retry queue with exponential backoff
CREATE TABLE IF NOT EXISTS whatsapp_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  whatsapp_metadata_id UUID REFERENCES whatsapp_message_metadata(id) ON DELETE CASCADE,

  -- Queue Management
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Retry Timing (exponential backoff: 1min, 5min, 30min)
  next_retry_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,

  -- Failure Handling
  last_error TEXT,
  should_fallback_to_email BOOLEAN DEFAULT true,
  email_fallback_sent BOOLEAN DEFAULT false,
  email_fallback_sent_at TIMESTAMPTZ,

  -- Booking Context
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50), -- booking_created, payment_received, pre_arrival, manual

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_queue_status CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10),
  CONSTRAINT valid_trigger_type CHECK (trigger_type IN (
    'booking_created', 'payment_received', 'payment_reminder',
    'pre_arrival', 'booking_modified', 'booking_cancelled', 'manual'
  ))
);

-- Indexes for whatsapp_message_queue
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status
  ON whatsapp_message_queue(status, next_retry_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_booking
  ON whatsapp_message_queue(booking_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_priority
  ON whatsapp_message_queue(priority, status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_pending
  ON whatsapp_message_queue(next_retry_at)
  WHERE status = 'pending';

-- ============================================================================
-- CREATE WHATSAPP OPT-OUTS TABLE
-- ============================================================================

-- Table for GDPR-compliant opt-out tracking
CREATE TABLE IF NOT EXISTS whatsapp_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL, -- E.164 format
  guest_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Opt-out Details
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  opt_out_reason VARCHAR(255),
  opt_out_source VARCHAR(50) DEFAULT 'user_request', -- user_request, whatsapp_stop, admin, bounce

  -- Re-opt-in Tracking
  opted_in_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_opt_out_source CHECK (opt_out_source IN (
    'user_request', 'whatsapp_stop', 'admin', 'bounce'
  ))
);

-- Indexes for whatsapp_opt_outs
CREATE INDEX IF NOT EXISTS idx_whatsapp_opt_outs_phone
  ON whatsapp_opt_outs(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_opt_outs_guest
  ON whatsapp_opt_outs(guest_id) WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_opt_outs_active
  ON whatsapp_opt_outs(phone_number)
  WHERE opted_in_at IS NULL OR opted_in_at < opted_out_at;

-- ============================================================================
-- CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger for whatsapp_message_templates
CREATE OR REPLACE FUNCTION update_whatsapp_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_whatsapp_templates_updated_at ON whatsapp_message_templates;
CREATE TRIGGER trigger_update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_templates_updated_at();

-- Trigger for whatsapp_message_metadata
CREATE OR REPLACE FUNCTION update_whatsapp_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_whatsapp_metadata_updated_at ON whatsapp_message_metadata;
CREATE TRIGGER trigger_update_whatsapp_metadata_updated_at
  BEFORE UPDATE ON whatsapp_message_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_metadata_updated_at();

-- Trigger for whatsapp_message_queue
CREATE OR REPLACE FUNCTION update_whatsapp_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_whatsapp_queue_updated_at ON whatsapp_message_queue;
CREATE TRIGGER trigger_update_whatsapp_queue_updated_at
  BEFORE UPDATE ON whatsapp_message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_queue_updated_at();

-- Trigger for whatsapp_opt_outs
CREATE OR REPLACE FUNCTION update_whatsapp_opt_outs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_whatsapp_opt_outs_updated_at ON whatsapp_opt_outs;
CREATE TRIGGER trigger_update_whatsapp_opt_outs_updated_at
  BEFORE UPDATE ON whatsapp_opt_outs
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_opt_outs_updated_at();

-- ============================================================================
-- VERIFICATION AND REPORTING
-- ============================================================================

DO $whatsapp_schema_report$
DECLARE
  templates_table_exists BOOLEAN;
  metadata_table_exists BOOLEAN;
  queue_table_exists BOOLEAN;
  opt_outs_table_exists BOOLEAN;
BEGIN
  -- Check if tables were created
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'whatsapp_message_templates'
  ) INTO templates_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'whatsapp_message_metadata'
  ) INTO metadata_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'whatsapp_message_queue'
  ) INTO queue_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'whatsapp_opt_outs'
  ) INTO opt_outs_table_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'WhatsApp Schema Creation Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'whatsapp_message_templates: %',
    CASE WHEN templates_table_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE 'whatsapp_message_metadata: %',
    CASE WHEN metadata_table_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE 'whatsapp_message_queue: %',
    CASE WHEN queue_table_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE 'whatsapp_opt_outs: %',
    CASE WHEN opt_outs_table_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE '========================================';

  -- Sanity check
  IF NOT (templates_table_exists AND metadata_table_exists AND
          queue_table_exists AND opt_outs_table_exists) THEN
    RAISE WARNING 'Some WhatsApp tables failed to create. Check migration log.';
  END IF;
END $whatsapp_schema_report$;
