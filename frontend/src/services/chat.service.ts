/**
 * Chat Service (Frontend)
 * Chat System - API client for chat endpoints
 */

import { api } from './api.service';
import type {
  Conversation,
  ConversationListParams,
  ConversationListResponse,
  ChatMessage,
  MessageListParams,
  MessageListResponse,
  CreateConversationData,
  CreateConversationResponse,
  SendMessageResponse,
  UpdateMessageData,
  SearchMessagesParams,
  SearchMessagesResponse,
  ChatStats,
  ChatReaction,
} from '@/types/chat.types';

class ChatService {
  private basePath = '/chat';

  // ============================================================================
  // Conversations
  // ============================================================================

  /**
   * Get user's conversations with pagination and filtering
   */
  async getConversations(params: ConversationListParams = {}): Promise<ConversationListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.type) queryParams.set('type', params.type);
    if (params.property_id) queryParams.set('property_id', params.property_id);
    if (params.search) queryParams.set('search', params.search);
    if (params.archived !== undefined) queryParams.set('archived', String(params.archived));

    const queryString = queryParams.toString();
    const url = queryString
      ? `${this.basePath}/conversations?${queryString}`
      : `${this.basePath}/conversations`;

    const response = await api.get<ConversationListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch conversations');
    }

    return response.data;
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(id: string): Promise<Conversation> {
    const response = await api.get<{ conversation: Conversation }>(
      `${this.basePath}/conversations/${id}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch conversation');
    }

    return response.data.conversation;
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationData): Promise<CreateConversationResponse> {
    const response = await api.post<CreateConversationResponse>(
      `${this.basePath}/conversations`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create conversation');
    }

    return response.data;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(id: string): Promise<void> {
    const response = await api.patch(`${this.basePath}/conversations/${id}/archive`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to archive conversation');
    }
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(id: string): Promise<void> {
    const response = await api.patch(`${this.basePath}/conversations/${id}/unarchive`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to unarchive conversation');
    }
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    const response = await api.patch(`${this.basePath}/conversations/${conversationId}/read`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to mark as read');
    }
  }

  // ============================================================================
  // Messages
  // ============================================================================

  /**
   * Get messages for a conversation (cursor-based pagination)
   */
  async getMessages(
    conversationId: string,
    params: MessageListParams = {}
  ): Promise<MessageListResponse> {
    const queryParams = new URLSearchParams();

    if (params.before) queryParams.set('before', params.before);
    if (params.limit) queryParams.set('limit', String(params.limit));

    const queryString = queryParams.toString();
    const url = queryString
      ? `${this.basePath}/conversations/${conversationId}/messages?${queryString}`
      : `${this.basePath}/conversations/${conversationId}/messages`;

    const response = await api.get<MessageListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch messages');
    }

    return response.data;
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string
  ): Promise<ChatMessage> {
    const response = await api.post<SendMessageResponse>(
      `${this.basePath}/conversations/${conversationId}/messages`,
      {
        content,
        reply_to_id: replyToId,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to send message');
    }

    return response.data.message;
  }

  /**
   * Send a message with attachments
   */
  async sendMessageWithAttachments(
    conversationId: string,
    content: string,
    attachments: File[],
    replyToId?: string
  ): Promise<ChatMessage> {
    const formData = new FormData();
    formData.append('content', content);
    if (replyToId) formData.append('reply_to_id', replyToId);
    attachments.forEach((file, i) => formData.append(`attachments[${i}]`, file));

    const response = await api.upload<SendMessageResponse>(
      `${this.basePath}/conversations/${conversationId}/messages`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to send message');
    }

    return response.data.message;
  }

  /**
   * Edit a message
   */
  async updateMessage(messageId: string, data: UpdateMessageData): Promise<ChatMessage> {
    const response = await api.patch<{ message: ChatMessage }>(
      `${this.basePath}/messages/${messageId}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update message');
    }

    return response.data.message;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const response = await api.delete(`${this.basePath}/messages/${messageId}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete message');
    }
  }

  // ============================================================================
  // Reactions
  // ============================================================================

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<ChatReaction> {
    const response = await api.post<{ reaction: ChatReaction }>(
      `${this.basePath}/messages/${messageId}/reactions`,
      { emoji }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add reaction');
    }

    return response.data.reaction;
  }

  /**
   * Remove a reaction
   */
  async removeReaction(messageId: string, reactionId: string): Promise<void> {
    const response = await api.delete(
      `${this.basePath}/messages/${messageId}/reactions/${reactionId}`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove reaction');
    }
  }

  // ============================================================================
  // Typing Indicator
  // ============================================================================

  /**
   * Set typing indicator
   */
  async setTyping(conversationId: string, isTyping: boolean): Promise<void> {
    const response = await api.post(`${this.basePath}/conversations/${conversationId}/typing`, {
      is_typing: isTyping,
    });

    if (!response.success) {
      // Don't throw for typing indicator - it's not critical
      console.error('Failed to set typing indicator');
    }
  }

  // ============================================================================
  // Search
  // ============================================================================

  /**
   * Search messages
   */
  async searchMessages(params: SearchMessagesParams): Promise<SearchMessagesResponse> {
    const queryParams = new URLSearchParams();
    queryParams.set('q', params.q);
    if (params.conversation_id) queryParams.set('conversation_id', params.conversation_id);
    if (params.limit) queryParams.set('limit', String(params.limit));

    const response = await api.get<SearchMessagesResponse>(
      `${this.basePath}/messages/search?${queryParams}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to search messages');
    }

    return response.data;
  }

  // ============================================================================
  // Stats
  // ============================================================================

  /**
   * Get chat statistics
   */
  async getStats(): Promise<ChatStats> {
    const response = await api.get<{ stats: ChatStats }>(`${this.basePath}/stats`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch chat stats');
    }

    return response.data.stats;
  }

  // ============================================================================
  // Participants
  // ============================================================================

  /**
   * Add participants to a conversation
   */
  async addParticipants(
    conversationId: string,
    userIds: string[],
    role: string = 'member'
  ): Promise<void> {
    const response = await api.post(`${this.basePath}/conversations/${conversationId}/participants`, {
      user_ids: userIds,
      role,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add participants');
    }
  }

  /**
   * Remove a participant from a conversation
   */
  async removeParticipant(conversationId: string, participantId: string): Promise<void> {
    const response = await api.delete(
      `${this.basePath}/conversations/${conversationId}/participants/${participantId}`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove participant');
    }
  }

  /**
   * Update participant settings (mute/role)
   */
  async updateParticipant(
    conversationId: string,
    participantId: string,
    updates: { is_muted?: boolean; role?: string }
  ): Promise<void> {
    const response = await api.patch(
      `${this.basePath}/conversations/${conversationId}/participants/${participantId}`,
      updates
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update participant');
    }
  }
}

export const chatService = new ChatService();
