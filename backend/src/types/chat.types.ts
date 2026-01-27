/**
 * Chat Types
 * Chat System - Conversations, Messages, Reactions
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type ConversationType = 'guest_inquiry' | 'team' | 'support';
export type ParticipantRole = 'owner' | 'admin' | 'member' | 'guest';
export type MessageType = 'text' | 'system' | 'media';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// ============================================================================
// Database Entities
// ============================================================================

/**
 * Chat conversation from database
 */
export interface ChatConversation {
  id: string;
  type: ConversationType;
  title: string | null;
  property_id: string | null;
  created_by: string;
  is_archived: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Chat participant from database
 */
export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
}

/**
 * Chat participant with user info joined
 */
export interface ChatParticipantWithUser extends ChatParticipant {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

/**
 * Chat message from database
 */
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  reply_to_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Chat message with sender info joined
 */
export interface ChatMessageWithSender extends ChatMessage {
  sender: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

/**
 * Chat message with all relations
 */
export interface ChatMessageFull extends ChatMessageWithSender {
  reply_to: ChatMessageWithSender | null;
  attachments: ChatAttachment[];
  reactions: ChatReactionWithUser[];
}

/**
 * Chat attachment from database
 */
export interface ChatAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

/**
 * Chat reaction from database
 */
export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

/**
 * Chat reaction with user info
 */
export interface ChatReactionWithUser extends ChatReaction {
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

/**
 * Typing indicator from database
 */
export interface ChatTypingIndicator {
  id: string;
  conversation_id: string;
  user_id: string;
  started_at: string;
  expires_at: string;
}

/**
 * Conversation with all relations for list view
 */
export interface ConversationWithDetails extends ChatConversation {
  property?: {
    id: string;
    name: string;
    featured_image_url: string | null;
  } | null;
  participants: ChatParticipantWithUser[];
  last_message: ChatMessageWithSender | null;
  unread_count: number;
  support_ticket?: {
    id: string;
    ticket_number: string;
    status: string;
    priority: string;
    category: string | null;
    sla_due_at: string | null;
    sla_breached: boolean;
  } | null;
  // WhatsApp conversation tracking
  guest_phone_number?: string | null;
  last_inbound_whatsapp_at?: string | null;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request to create a new conversation
 */
export interface CreateConversationRequest {
  type: ConversationType;
  title?: string;
  property_id?: string;
  /** User IDs to add as participants */
  participant_user_ids: string[];
  /** Optional first message to send */
  initial_message?: string;
}

/**
 * Request to send a message
 */
export interface SendMessageRequest {
  content: string;
  message_type?: MessageType;
  reply_to_id?: string;
}

/**
 * Request to update a message
 */
export interface UpdateMessageRequest {
  content: string;
}

/**
 * Request to add a reaction
 */
export interface AddReactionRequest {
  emoji: string;
}

/**
 * Request to add participants to a conversation
 */
export interface AddParticipantsRequest {
  user_ids: string[];
  role?: ParticipantRole;
}

/**
 * Request to update participant settings
 */
export interface UpdateParticipantRequest {
  is_muted?: boolean;
  role?: ParticipantRole;
}

/**
 * Request to set typing indicator
 */
export interface SetTypingRequest {
  is_typing: boolean;
}

// ============================================================================
// Query Parameters
// ============================================================================

/**
 * Query parameters for listing conversations
 */
export interface ConversationListParams {
  page?: number;
  limit?: number;
  type?: ConversationType;
  property_id?: string;
  search?: string;
  archived?: boolean;
}

/**
 * Query parameters for listing messages (cursor-based)
 */
export interface MessageListParams {
  /** Cursor: get messages before this message ID */
  before?: string;
  /** Number of messages to fetch */
  limit?: number;
}

/**
 * Query parameters for searching messages
 */
export interface SearchMessagesParams {
  q: string;
  conversation_id?: string;
  limit?: number;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response for paginated conversation list
 */
export interface ConversationListResponse {
  conversations: ConversationWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response for message list (cursor-based)
 */
export interface MessageListResponse {
  messages: ChatMessageFull[];
  has_more: boolean;
  oldest_id: string | null;
}

/**
 * Response for search results
 */
export interface SearchMessagesResponse {
  messages: ChatMessageFull[];
  total: number;
}

/**
 * Response for conversation details
 */
export interface ConversationDetailResponse {
  conversation: ConversationWithDetails;
}

/**
 * Response for created conversation
 */
export interface CreateConversationResponse {
  conversation: ConversationWithDetails;
  message?: ChatMessageFull;
}

/**
 * Response for sent message
 */
export interface SendMessageResponse {
  message: ChatMessageFull;
}

/**
 * Stats for chat
 */
export interface ChatStats {
  total_conversations: number;
  total_unread: number;
  conversations_by_type: Record<ConversationType, number>;
}

// ============================================================================
// Realtime Types
// ============================================================================

/**
 * Supabase Realtime payload for conversation changes
 */
export interface ConversationRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: ChatConversation | null;
  old: ChatConversation | null;
}

/**
 * Supabase Realtime payload for message changes
 */
export interface MessageRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: ChatMessage | null;
  old: ChatMessage | null;
}

/**
 * Typing event for broadcast
 */
export interface TypingEvent {
  conversation_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

// ============================================================================
// Upload Types
// ============================================================================

/**
 * Attachment upload info
 */
export interface AttachmentUpload {
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
}

/**
 * Created attachment response
 */
export interface AttachmentResponse {
  id: string;
  file_url: string;
  thumbnail_url: string | null;
}
