-- Migration: 030_create_chat_schema.sql
-- Description: Create chat system tables (conversations, participants, messages, reactions, attachments)
-- Feature: Chat System
-- Date: 2026-01-05

-- ============================================================================
-- CHAT CONVERSATIONS TABLE
-- Main table for chat conversations (guest_inquiry, team, support)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conversation type
  type VARCHAR(20) NOT NULL DEFAULT 'guest_inquiry',
  title VARCHAR(255),

  -- Property scope (nullable for team/support chats)
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_archived BOOLEAN DEFAULT false,

  -- Tracking
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_conversation_type CHECK (type IN ('guest_inquiry', 'team', 'support'))
);

-- Indexes for chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_type ON chat_conversations(type);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_property ON chat_conversations(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON chat_conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_archived ON chat_conversations(is_archived) WHERE is_archived = false;

COMMENT ON TABLE chat_conversations IS 'Chat conversations between users';
COMMENT ON COLUMN chat_conversations.type IS 'guest_inquiry: guest to property owner, team: internal team chat, support: admin support';
COMMENT ON COLUMN chat_conversations.property_id IS 'Property context for guest inquiries';

-- ============================================================================
-- CHAT PARTICIPANTS TABLE
-- Users participating in conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Participant role in conversation
  role VARCHAR(20) NOT NULL DEFAULT 'member',

  -- Status
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,

  -- Unique constraint: user can only be in a conversation once
  UNIQUE(conversation_id, user_id),

  CONSTRAINT valid_participant_role CHECK (role IN ('owner', 'admin', 'member', 'guest'))
);

-- Indexes for chat_participants
CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation ON chat_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_conversation ON chat_participants(user_id, conversation_id);

COMMENT ON TABLE chat_participants IS 'Users participating in chat conversations';
COMMENT ON COLUMN chat_participants.role IS 'owner: created the chat, admin: can manage, member: regular participant, guest: external user';
COMMENT ON COLUMN chat_participants.last_read_at IS 'Timestamp of last message read by this participant';

-- ============================================================================
-- CHAT MESSAGES TABLE
-- Individual messages in conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',

  -- Reply threading
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,

  -- Edit/delete tracking (soft delete)
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'system', 'media'))
);

-- Indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply ON chat_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_not_deleted ON chat_messages(conversation_id, created_at DESC) WHERE is_deleted = false;

-- Full-text search index on message content
CREATE INDEX IF NOT EXISTS idx_chat_messages_search ON chat_messages USING gin(to_tsvector('english', content));

COMMENT ON TABLE chat_messages IS 'Individual messages in chat conversations';
COMMENT ON COLUMN chat_messages.message_type IS 'text: regular message, system: auto-generated, media: has attachments';
COMMENT ON COLUMN chat_messages.reply_to_id IS 'Reference to message being replied to';

-- ============================================================================
-- CHAT ATTACHMENTS TABLE
-- File attachments for messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,

  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,

  -- Storage URLs
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat_attachments
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON chat_attachments(message_id);

COMMENT ON TABLE chat_attachments IS 'File attachments for chat messages';
COMMENT ON COLUMN chat_attachments.file_url IS 'Supabase Storage URL for the file';
COMMENT ON COLUMN chat_attachments.thumbnail_url IS 'Generated thumbnail for images';

-- ============================================================================
-- CHAT REACTIONS TABLE
-- Emoji reactions to messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reaction emoji
  emoji VARCHAR(20) NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One reaction type per user per message
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes for chat_reactions
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user ON chat_reactions(user_id);

COMMENT ON TABLE chat_reactions IS 'Emoji reactions to chat messages';
COMMENT ON COLUMN chat_reactions.emoji IS 'Emoji character(s) for the reaction';

-- ============================================================================
-- CHAT TYPING INDICATORS TABLE
-- Ephemeral typing status (auto-cleaned)
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 seconds',

  -- One typing indicator per user per conversation
  UNIQUE(conversation_id, user_id)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_chat_typing_expires ON chat_typing_indicators(expires_at);

COMMENT ON TABLE chat_typing_indicators IS 'Ephemeral typing indicators for real-time updates';

-- ============================================================================
-- UPDATE TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER trg_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

DROP TRIGGER IF EXISTS trg_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER trg_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();

-- ============================================================================
-- TRIGGER: Update conversation last_message_at on new message
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_last_message ON chat_messages;
CREATE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- TRIGGER: Auto-cleanup expired typing indicators
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM chat_typing_indicators WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup periodically (on any insert/update to typing indicators)
DROP TRIGGER IF EXISTS trg_cleanup_typing_indicators ON chat_typing_indicators;
CREATE TRIGGER trg_cleanup_typing_indicators
  AFTER INSERT OR UPDATE ON chat_typing_indicators
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_typing_indicators();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- CONVERSATIONS: Users can only see conversations they participate in
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS chat_conversations_select_participant ON chat_conversations;
CREATE POLICY chat_conversations_select_participant ON chat_conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_conversations.id
      AND chat_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_conversations_insert_policy ON chat_conversations;
CREATE POLICY chat_conversations_insert_policy ON chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS chat_conversations_update_participant ON chat_conversations;
CREATE POLICY chat_conversations_update_participant ON chat_conversations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_conversations.id
      AND chat_participants.user_id = auth.uid()
      AND chat_participants.role IN ('owner', 'admin')
    )
  );

-- Super admin can access all conversations (for support)
DROP POLICY IF EXISTS chat_conversations_admin_select ON chat_conversations;
CREATE POLICY chat_conversations_admin_select ON chat_conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- ----------------------------------------------------------------------------
-- PARTICIPANTS: Users can see participants of their conversations
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS chat_participants_select_policy ON chat_participants;
CREATE POLICY chat_participants_select_policy ON chat_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.conversation_id = chat_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_participants_insert_policy ON chat_participants;
CREATE POLICY chat_participants_insert_policy ON chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Can add yourself
    user_id = auth.uid()
    OR
    -- Or be owner/admin of the conversation
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.conversation_id = chat_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS chat_participants_update_own ON chat_participants;
CREATE POLICY chat_participants_update_own ON chat_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS chat_participants_delete_policy ON chat_participants;
CREATE POLICY chat_participants_delete_policy ON chat_participants
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.conversation_id = chat_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.role IN ('owner', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- MESSAGES: Users can see/send messages in their conversations
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS chat_messages_select_policy ON chat_messages;
CREATE POLICY chat_messages_select_policy ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_messages.conversation_id
      AND chat_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_messages_insert_policy ON chat_messages;
CREATE POLICY chat_messages_insert_policy ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_messages.conversation_id
      AND chat_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_messages_update_own ON chat_messages;
CREATE POLICY chat_messages_update_own ON chat_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS chat_messages_delete_own ON chat_messages;
CREATE POLICY chat_messages_delete_own ON chat_messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- ----------------------------------------------------------------------------
-- ATTACHMENTS: Same access as messages
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS chat_attachments_select_policy ON chat_attachments;
CREATE POLICY chat_attachments_select_policy ON chat_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages m
      JOIN chat_participants p ON p.conversation_id = m.conversation_id
      WHERE m.id = chat_attachments.message_id
      AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_attachments_insert_policy ON chat_attachments;
CREATE POLICY chat_attachments_insert_policy ON chat_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_messages m
      WHERE m.id = chat_attachments.message_id
      AND m.sender_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- REACTIONS: Users can react to messages in their conversations
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS chat_reactions_select_policy ON chat_reactions;
CREATE POLICY chat_reactions_select_policy ON chat_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages m
      JOIN chat_participants p ON p.conversation_id = m.conversation_id
      WHERE m.id = chat_reactions.message_id
      AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_reactions_insert_policy ON chat_reactions;
CREATE POLICY chat_reactions_insert_policy ON chat_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_messages m
      JOIN chat_participants p ON p.conversation_id = m.conversation_id
      WHERE m.id = chat_reactions.message_id
      AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_reactions_delete_own ON chat_reactions;
CREATE POLICY chat_reactions_delete_own ON chat_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- TYPING INDICATORS: Users can see/update typing in their conversations
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS chat_typing_select_policy ON chat_typing_indicators;
CREATE POLICY chat_typing_select_policy ON chat_typing_indicators
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_typing_indicators.conversation_id
      AND chat_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_typing_insert_policy ON chat_typing_indicators;
CREATE POLICY chat_typing_insert_policy ON chat_typing_indicators
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.conversation_id = chat_typing_indicators.conversation_id
      AND chat_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS chat_typing_update_own ON chat_typing_indicators;
CREATE POLICY chat_typing_update_own ON chat_typing_indicators
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS chat_typing_delete_own ON chat_typing_indicators;
CREATE POLICY chat_typing_delete_own ON chat_typing_indicators
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- ENABLE REALTIME FOR CHAT TABLES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Remove if already added (to avoid errors on re-run)
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE chat_conversations;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE chat_messages;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'chat_typing_indicators'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE chat_typing_indicators;
    END IF;

    -- Add tables to realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_typing_indicators;
  END IF;
END $$;

-- ============================================================================
-- HELPER FUNCTION: Get unread message count for a user in a conversation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_chat_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_last_read_at TIMESTAMPTZ;
BEGIN
  -- Get user's last read timestamp
  SELECT last_read_at INTO v_last_read_at
  FROM chat_participants
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;

  -- If never read, count all messages
  IF v_last_read_at IS NULL THEN
    RETURN (
      SELECT COUNT(*)::INTEGER
      FROM chat_messages
      WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND is_deleted = false
    );
  END IF;

  -- Count messages after last read
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM chat_messages
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_deleted = false
    AND created_at > v_last_read_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Get total unread count for a user across all conversations
-- ============================================================================

CREATE OR REPLACE FUNCTION get_total_chat_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(get_chat_unread_count(conversation_id, p_user_id)), 0)::INTEGER
    FROM chat_participants
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Search messages with full-text search
-- ============================================================================

CREATE OR REPLACE FUNCTION search_chat_messages(
  p_user_id UUID,
  p_query TEXT,
  p_conversation_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.created_at,
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', p_query)) AS rank
  FROM chat_messages m
  JOIN chat_participants p ON p.conversation_id = m.conversation_id
  WHERE p.user_id = p_user_id
    AND m.is_deleted = false
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', p_query)
    AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON chat_conversations TO service_role;
GRANT ALL ON chat_participants TO service_role;
GRANT ALL ON chat_messages TO service_role;
GRANT ALL ON chat_attachments TO service_role;
GRANT ALL ON chat_reactions TO service_role;
GRANT ALL ON chat_typing_indicators TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT ON chat_attachments TO authenticated;
GRANT SELECT, INSERT, DELETE ON chat_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_typing_indicators TO authenticated;

GRANT EXECUTE ON FUNCTION get_chat_unread_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_chat_unread_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_chat_messages(UUID, TEXT, UUID, INTEGER) TO authenticated;
