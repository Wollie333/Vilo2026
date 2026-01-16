-- Migration: 089_modify_chat_for_whatsapp.sql
-- Description: Modify existing chat tables to support WhatsApp integration
-- Date: 2026-01-15
--
-- This migration adds WhatsApp-related fields to existing tables:
-- - chat_messages: Add message_channel field to track channel type
-- - chat_conversations: Add language tracking for multi-language support
-- - bookings: Add WhatsApp notification preferences

-- ============================================================================
-- MODIFY CHAT_MESSAGES TABLE
-- ============================================================================

-- Add message_channel column to track message channel (internal, whatsapp, email, sms)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'message_channel'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN message_channel VARCHAR(50) DEFAULT 'internal';

    RAISE NOTICE 'Added message_channel column to chat_messages table';
  ELSE
    RAISE NOTICE 'message_channel column already exists in chat_messages table';
  END IF;
END $$;

-- Add constraint to validate message_channel values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'chat_messages' AND constraint_name = 'valid_message_channel'
  ) THEN
    ALTER TABLE chat_messages ADD CONSTRAINT valid_message_channel
      CHECK (message_channel IN ('internal', 'whatsapp', 'email', 'sms'));

    RAISE NOTICE 'Added valid_message_channel constraint to chat_messages table';
  ELSE
    RAISE NOTICE 'valid_message_channel constraint already exists';
  END IF;
END $$;

-- Create index on message_channel for filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel
  ON chat_messages(message_channel);

DO $$
BEGIN
  RAISE NOTICE 'Created index idx_chat_messages_channel';
END $$;

-- ============================================================================
-- MODIFY CHAT_CONVERSATIONS TABLE
-- ============================================================================

-- Add language_code column for multi-language support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_conversations' AND column_name = 'language_code'
  ) THEN
    ALTER TABLE chat_conversations ADD COLUMN language_code VARCHAR(10) DEFAULT 'en';

    RAISE NOTICE 'Added language_code column to chat_conversations table';
  ELSE
    RAISE NOTICE 'language_code column already exists in chat_conversations table';
  END IF;
END $$;

-- Add auto_detected_language column to track if language was auto-detected
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_conversations' AND column_name = 'auto_detected_language'
  ) THEN
    ALTER TABLE chat_conversations ADD COLUMN auto_detected_language BOOLEAN DEFAULT false;

    RAISE NOTICE 'Added auto_detected_language column to chat_conversations table';
  ELSE
    RAISE NOTICE 'auto_detected_language column already exists in chat_conversations table';
  END IF;
END $$;

-- Create index on language_code for filtering
CREATE INDEX IF NOT EXISTS idx_chat_conversations_language
  ON chat_conversations(language_code);

DO $$
BEGIN
  RAISE NOTICE 'Created index idx_chat_conversations_language';
END $$;

-- ============================================================================
-- MODIFY BOOKINGS TABLE
-- ============================================================================

-- Add whatsapp_notifications_enabled column to track guest preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'whatsapp_notifications_enabled'
  ) THEN
    ALTER TABLE bookings ADD COLUMN whatsapp_notifications_enabled BOOLEAN DEFAULT true;

    RAISE NOTICE 'Added whatsapp_notifications_enabled column to bookings table';
  ELSE
    RAISE NOTICE 'whatsapp_notifications_enabled column already exists in bookings table';
  END IF;
END $$;

-- Add whatsapp_opt_in_at column to track when guest opted in
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'whatsapp_opt_in_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN whatsapp_opt_in_at TIMESTAMPTZ;

    RAISE NOTICE 'Added whatsapp_opt_in_at column to bookings table';
  ELSE
    RAISE NOTICE 'whatsapp_opt_in_at column already exists in bookings table';
  END IF;
END $$;

-- Create index on whatsapp_notifications_enabled for filtering
CREATE INDEX IF NOT EXISTS idx_bookings_whatsapp_enabled
  ON bookings(whatsapp_notifications_enabled) WHERE whatsapp_notifications_enabled = true;

DO $$
BEGIN
  RAISE NOTICE 'Created index idx_bookings_whatsapp_enabled';
END $$;

-- ============================================================================
-- DATA MIGRATION: SET DEFAULT LANGUAGE FOR EXISTING CONVERSATIONS
-- ============================================================================

-- Update existing conversations with default language if not set
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE chat_conversations
  SET language_code = 'en'
  WHERE language_code IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Updated % existing conversations with default language', updated_count;
END $$;

-- ============================================================================
-- DATA MIGRATION: SET DEFAULT CHANNEL FOR EXISTING MESSAGES
-- ============================================================================

-- Update existing messages with default channel if not set
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE chat_messages
  SET message_channel = 'internal'
  WHERE message_channel IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Updated % existing messages with default channel', updated_count;
END $$;

-- ============================================================================
-- DATA MIGRATION: ENABLE WHATSAPP FOR EXISTING BOOKINGS
-- ============================================================================

-- Enable WhatsApp notifications for existing bookings by default
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE bookings
  SET whatsapp_notifications_enabled = true
  WHERE whatsapp_notifications_enabled IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Enabled WhatsApp notifications for % existing bookings', updated_count;
END $$;

-- ============================================================================
-- VERIFICATION AND REPORTING
-- ============================================================================

DO $chat_modification_report$
DECLARE
  message_channel_exists BOOLEAN;
  language_code_exists BOOLEAN;
  auto_detected_language_exists BOOLEAN;
  whatsapp_notifications_exists BOOLEAN;
  whatsapp_opt_in_exists BOOLEAN;
BEGIN
  -- Check if columns were added
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'message_channel'
  ) INTO message_channel_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_conversations' AND column_name = 'language_code'
  ) INTO language_code_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_conversations' AND column_name = 'auto_detected_language'
  ) INTO auto_detected_language_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'whatsapp_notifications_enabled'
  ) INTO whatsapp_notifications_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'whatsapp_opt_in_at'
  ) INTO whatsapp_opt_in_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Chat Tables Modification Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'chat_messages.message_channel: %',
    CASE WHEN message_channel_exists THEN 'ADDED' ELSE 'FAILED' END;
  RAISE NOTICE 'chat_conversations.language_code: %',
    CASE WHEN language_code_exists THEN 'ADDED' ELSE 'FAILED' END;
  RAISE NOTICE 'chat_conversations.auto_detected_language: %',
    CASE WHEN auto_detected_language_exists THEN 'ADDED' ELSE 'FAILED' END;
  RAISE NOTICE 'bookings.whatsapp_notifications_enabled: %',
    CASE WHEN whatsapp_notifications_exists THEN 'ADDED' ELSE 'FAILED' END;
  RAISE NOTICE 'bookings.whatsapp_opt_in_at: %',
    CASE WHEN whatsapp_opt_in_exists THEN 'ADDED' ELSE 'FAILED' END;
  RAISE NOTICE '========================================';

  -- Sanity check
  IF NOT (message_channel_exists AND language_code_exists AND
          auto_detected_language_exists AND whatsapp_notifications_exists AND
          whatsapp_opt_in_exists) THEN
    RAISE WARNING 'Some columns failed to be added. Check migration log.';
  END IF;
END $chat_modification_report$;
