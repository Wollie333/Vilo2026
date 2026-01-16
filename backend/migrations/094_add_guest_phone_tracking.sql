-- Migration: 094_add_guest_phone_tracking.sql
-- Description: Add guest phone number tracking for WhatsApp conversations
-- Date: 2026-01-15
--
-- This migration adds phone number tracking to users, conversations, and bookings
-- to enable matching incoming WhatsApp messages to existing guests and conversations.

-- ============================================================================
-- ADD WHATSAPP PHONE TO USERS TABLE
-- ============================================================================

-- Add whatsapp_phone column to users (optional field for guests)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'whatsapp_phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN whatsapp_phone VARCHAR(20);

    COMMENT ON COLUMN public.users.whatsapp_phone IS 'Guest WhatsApp phone number in E.164 format (e.g., +27123456789)';
  END IF;
END $$;

-- Index for fast lookup by WhatsApp phone (only where not null)
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_phone
  ON public.users(whatsapp_phone)
  WHERE whatsapp_phone IS NOT NULL;

-- ============================================================================
-- VERIFY WHATSAPP OPT-IN COLUMN IN BOOKINGS (from migration 087)
-- ============================================================================

-- Ensure whatsapp_opt_in_at column exists in bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'whatsapp_opt_in_at'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN whatsapp_opt_in_at TIMESTAMPTZ;

    COMMENT ON COLUMN public.bookings.whatsapp_opt_in_at IS 'Timestamp when guest opted in to WhatsApp communications';
  END IF;
END $$;

-- ============================================================================
-- ADD CONVERSATION METADATA FOR WHATSAPP
-- ============================================================================

-- Add last_inbound_whatsapp_at to track 24-hour conversation window
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_conversations' AND column_name = 'last_inbound_whatsapp_at'
  ) THEN
    ALTER TABLE public.chat_conversations ADD COLUMN last_inbound_whatsapp_at TIMESTAMPTZ;

    COMMENT ON COLUMN public.chat_conversations.last_inbound_whatsapp_at IS 'Last time guest sent a WhatsApp message (for 24h window tracking)';
  END IF;
END $$;

-- Add guest_phone_number to conversations for routing and matching
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_conversations' AND column_name = 'guest_phone_number'
  ) THEN
    ALTER TABLE public.chat_conversations ADD COLUMN guest_phone_number VARCHAR(20);

    COMMENT ON COLUMN public.chat_conversations.guest_phone_number IS 'Guest phone number in E.164 format for WhatsApp conversations';
  END IF;
END $$;

-- Index for fast lookup by guest phone number
CREATE INDEX IF NOT EXISTS idx_conversations_guest_phone
  ON public.chat_conversations(guest_phone_number)
  WHERE guest_phone_number IS NOT NULL;

-- Index for finding conversations with active WhatsApp windows
CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_window
  ON public.chat_conversations(last_inbound_whatsapp_at)
  WHERE last_inbound_whatsapp_at IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify users.whatsapp_phone column was added
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'whatsapp_phone';

-- Verify bookings.whatsapp_opt_in_at column exists
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND column_name = 'whatsapp_opt_in_at';

-- Verify chat_conversations columns were added
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chat_conversations'
  AND column_name IN ('last_inbound_whatsapp_at', 'guest_phone_number')
ORDER BY column_name;

-- Show all indexes created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    (tablename = 'users' AND indexname = 'idx_users_whatsapp_phone')
    OR
    (tablename = 'chat_conversations' AND indexname IN ('idx_conversations_guest_phone', 'idx_conversations_whatsapp_window'))
  )
ORDER BY tablename, indexname;
