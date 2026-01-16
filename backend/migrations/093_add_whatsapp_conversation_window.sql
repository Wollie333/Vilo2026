-- Migration: 093_add_whatsapp_conversation_window.sql
-- Description: Add 24-hour conversation window tracking for WhatsApp messages
-- Date: 2026-01-15
--
-- This migration enables tracking of Meta's 24-hour conversation window
-- for WhatsApp messages, allowing the system to determine when free-form
-- replies are allowed vs when templates are required.

-- ============================================================================
-- ADD CONVERSATION WINDOW TRACKING TO WHATSAPP METADATA
-- ============================================================================

-- Add conversation_window_expires_at column to track 24-hour window
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_message_metadata' AND column_name = 'conversation_window_expires_at'
  ) THEN
    ALTER TABLE whatsapp_message_metadata
      ADD COLUMN conversation_window_expires_at TIMESTAMPTZ;

    COMMENT ON COLUMN whatsapp_message_metadata.conversation_window_expires_at IS 'Meta 24-hour conversation window expiry (for free-form replies). Only applies to inbound messages.';
  END IF;
END $$;

-- Index for quick window expiry checks (only for inbound messages)
-- Note: We can't use NOW() in the WHERE clause as it's not immutable
-- The index will still be efficient for queries filtering on inbound messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_metadata_window_expiry
  ON whatsapp_message_metadata(conversation_window_expires_at)
  WHERE direction = 'inbound' AND conversation_window_expires_at IS NOT NULL;

-- ============================================================================
-- CREATE PHONE NUMBER TO COMPANY MAPPING TABLE
-- ============================================================================

-- This table maps Meta's phone_number_id to companies for incoming message routing
CREATE TABLE IF NOT EXISTS public.whatsapp_phone_company_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id VARCHAR(50) UNIQUE NOT NULL,  -- Meta's phone number ID (plain text)
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one-to-one mapping
  CONSTRAINT unique_phone_per_company UNIQUE(phone_number_id, company_id)
);

-- Index for fast company lookup by phone_number_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_mapping_phone
  ON public.whatsapp_phone_company_mapping(phone_number_id);

-- Index for finding all phones for a company
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_mapping_company
  ON public.whatsapp_phone_company_mapping(company_id);

-- ============================================================================
-- ADD UPDATED_AT TRIGGER
-- ============================================================================

-- Add trigger to automatically update updated_at on row changes
CREATE TRIGGER update_whatsapp_phone_mapping_updated_at
  BEFORE UPDATE ON public.whatsapp_phone_company_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.whatsapp_phone_company_mapping IS 'Maps Meta phone number IDs to companies for incoming message routing. Populated when WhatsApp credentials are configured.';
COMMENT ON COLUMN public.whatsapp_phone_company_mapping.phone_number_id IS 'Meta WhatsApp Business API phone number ID (stored in plain text for routing)';
COMMENT ON COLUMN public.whatsapp_phone_company_mapping.company_id IS 'Company that owns this WhatsApp number';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify column was added
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'whatsapp_message_metadata'
  AND column_name = 'conversation_window_expires_at';

-- Verify mapping table was created
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'whatsapp_phone_company_mapping'
ORDER BY ordinal_position;

-- Show indexes created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'whatsapp_message_metadata' AND indexname = 'idx_whatsapp_metadata_window_expiry'
    OR
    tablename = 'whatsapp_phone_company_mapping'
  )
ORDER BY tablename, indexname;
