-- Migration: 135_add_book_via_chat_to_companies.sql
-- Description: Add Book via Chat feature configuration to companies
-- Date: 2026-01-22

-- ============================================================================
-- ADD BOOK VIA CHAT CONFIGURATION
-- ============================================================================

-- Add flag to enable/disable Book via Chat feature per company
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS enable_book_via_chat BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.companies.enable_book_via_chat IS
  'Enable guests to complete bookings via chat when enabled by property owner';

-- Create index for companies with this feature enabled
CREATE INDEX IF NOT EXISTS idx_companies_book_via_chat
ON public.companies(enable_book_via_chat)
WHERE enable_book_via_chat = true;

-- ============================================================================
-- HELPER FUNCTION FOR FINDING CONVERSATIONS
-- ============================================================================

-- Function to find existing conversation between two users for a property
CREATE OR REPLACE FUNCTION find_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_property_id UUID,
  p_type VARCHAR(50)
)
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.id
  FROM chat_conversations c
  INNER JOIN chat_participants cp1 ON cp1.conversation_id = c.id
  INNER JOIN chat_participants cp2 ON cp2.conversation_id = c.id
  WHERE c.type = p_type
    AND c.property_id = p_property_id
    AND cp1.user_id = p_user1_id
    AND cp2.user_id = p_user2_id
    AND c.is_archived = false
  ORDER BY c.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
