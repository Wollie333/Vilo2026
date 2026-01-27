/**
 * Chat Types (Frontend)
 * Chat System - TypeScript interfaces for the frontend chat system
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type ConversationType = 'guest_inquiry' | 'team' | 'support';
export type ParticipantRole = 'owner' | 'admin' | 'member' | 'guest';
export type MessageType = 'text' | 'system' | 'media';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageChannel = 'internal' | 'whatsapp' | 'email' | 'sms';
export type WhatsAppDeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

// ============================================================================
// Core Entities
// ============================================================================

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

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

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  message_channel?: MessageChannel; // WhatsApp integration
  reply_to_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  reply_to: ChatMessage | null;
  attachments: ChatAttachment[];
  reactions: ChatReaction[];
  // Frontend-only status for optimistic updates
  status?: MessageStatus;
  // WhatsApp metadata (if sent via WhatsApp)
  whatsapp_metadata?: {
    status: WhatsAppDeliveryStatus;
    sent_at: string | null;
    delivered_at: string | null;
    read_at: string | null;
    failed_at: string | null;
    failure_reason: string | null;
  };
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  property_id: string | null;
  property?: {
    id: string;
    name: string;
    featured_image_url: string | null;
  } | null;
  created_by: string;
  is_archived: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  participants: ChatParticipant[];
  last_message: ChatMessage | null;
  unread_count: number;
  // Metadata for special conversation types (promo claims, support tickets, etc.)
  metadata?: {
    type?: 'promo_claim' | string;
    promotion_id?: string;
    is_new_lead?: boolean;
    [key: string]: any;
  };
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
// API Request Types
// ============================================================================

export interface ConversationListParams {
  page?: number;
  limit?: number;
  type?: ConversationType;
  property_id?: string;
  search?: string;
  archived?: boolean;
}

export interface MessageListParams {
  before?: string;
  limit?: number;
}

export interface CreateConversationData {
  type: ConversationType;
  title?: string;
  property_id?: string;
  participant_user_ids: string[];
  initial_message?: string;
}

export interface SendMessageData {
  conversation_id: string;
  content: string;
  reply_to_id?: string;
  attachments?: File[];
}

export interface UpdateMessageData {
  content: string;
}

export interface SearchMessagesParams {
  q: string;
  conversation_id?: string;
  limit?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessageListResponse {
  messages: ChatMessage[];
  has_more: boolean;
  oldest_id: string | null;
}

export interface CreateConversationResponse {
  conversation: Conversation;
  message?: ChatMessage;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface SearchMessagesResponse {
  messages: ChatMessage[];
  total: number;
}

export interface ChatStats {
  total_conversations: number;
  total_unread: number;
  conversations_by_type: Record<ConversationType, number>;
}

// ============================================================================
// Context State Types
// ============================================================================

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>; // keyed by conversation_id
  typingUsers: Record<string, TypingEvent[]>; // keyed by conversation_id
  totalUnreadCount: number;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  error: string | null;
}

export interface ChatContextValue extends ChatState {
  // Conversation operations
  fetchConversations: (params?: ConversationListParams) => Promise<void>;
  createConversation: (data: CreateConversationData) => Promise<Conversation>;
  archiveConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;

  // Message operations
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  sendMessage: (data: SendMessageData) => Promise<ChatMessage>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, reactionId: string) => Promise<void>;

  // Read receipts
  markConversationAsRead: (conversationId: string) => Promise<void>;

  // Typing
  setTyping: (conversationId: string, isTyping: boolean) => void;

  // Search
  searchMessages: (query: string, conversationId?: string) => Promise<ChatMessage[]>;

  // Refresh
  refreshUnreadCount: () => Promise<void>;
}

// ============================================================================
// Realtime Types
// ============================================================================

export interface TypingEvent {
  conversation_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

export interface MessageRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: ChatMessage | null;
  old: { id: string } | null;
}

export interface ConversationRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Conversation | null;
  old: { id: string } | null;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conversation: Conversation) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filter: ConversationListParams) => void;
  isLoading?: boolean;
}

export interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export interface MessageThreadProps {
  messages: ChatMessage[];
  conversationId: string;
  currentUserId: string;
  typingUsers: TypingEvent[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore: () => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  isGrouped: boolean;
  showAvatar: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}

export interface ChatInputProps {
  conversationId: string;
  replyTo: ChatMessage | null;
  onSend: (content: string, attachments?: File[]) => void;
  onCancelReply: () => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export interface ChatHeaderProps {
  conversation: Conversation;
  onSearch: () => void;
  onInfo: () => void;
  onArchive: () => void;
  onBack?: () => void;
}
