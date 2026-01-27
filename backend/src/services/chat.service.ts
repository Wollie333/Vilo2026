/**
 * Chat Service
 * Chat System - Core business logic for conversations and messages
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import type {
  ChatConversation,
  ChatMessage,
  ChatMessageFull,
  ChatMessageWithSender,
  ChatParticipantWithUser,
  ChatAttachment,
  ChatReaction,
  ChatReactionWithUser,
  ConversationWithDetails,
  ConversationListParams,
  ConversationListResponse,
  MessageListParams,
  MessageListResponse,
  CreateConversationRequest,
  SendMessageRequest,
  SearchMessagesParams,
  SearchMessagesResponse,
  ChatStats,
  ParticipantRole,
  AttachmentUpload,
} from '../types/chat.types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user info for denormalization
 */
const getUserInfo = async (userId: string) => {
  const supabase = getAdminClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url')
    .eq('id', userId)
    .single();
  return user;
};

/**
 * Check if user is participant in conversation
 */
const isParticipant = async (conversationId: string, userId: string): Promise<boolean> => {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('chat_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();
  return !!data;
};

/**
 * Check if user is admin/owner of conversation
 */
const isConversationAdmin = async (conversationId: string, userId: string): Promise<boolean> => {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('chat_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();
  return data?.role === 'owner' || data?.role === 'admin';
};

/**
 * Get unread count for a user in a conversation
 */
const getUnreadCount = async (conversationId: string, userId: string): Promise<number> => {
  const supabase = getAdminClient();
  const { data, error } = await supabase.rpc('get_chat_unread_count', {
    p_conversation_id: conversationId,
    p_user_id: userId,
  });
  if (error) {
    logger.error('Failed to get unread count', { error, conversationId, userId });
    return 0;
  }
  return data || 0;
};

/**
 * Enrich message with sender, attachments, and reactions
 */
const enrichMessage = async (message: ChatMessage): Promise<ChatMessageFull> => {
  const supabase = getAdminClient();

  // Get sender info
  const sender = await getUserInfo(message.sender_id);

  // Get attachments
  const { data: attachments } = await supabase
    .from('chat_attachments')
    .select('*')
    .eq('message_id', message.id);

  // Get reactions with user info
  const { data: reactions } = await supabase
    .from('chat_reactions')
    .select('*, user:users(id, full_name, avatar_url)')
    .eq('message_id', message.id);

  // Get reply_to if exists
  let replyTo: ChatMessageWithSender | null = null;
  if (message.reply_to_id) {
    const { data: replyMessage } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', message.reply_to_id)
      .single();
    if (replyMessage) {
      const replySender = await getUserInfo(replyMessage.sender_id);
      replyTo = {
        ...replyMessage,
        sender: replySender || { id: replyMessage.sender_id, full_name: 'Unknown', avatar_url: null },
      };
    }
  }

  return {
    ...message,
    sender: sender || { id: message.sender_id, full_name: 'Unknown', avatar_url: null },
    reply_to: replyTo,
    attachments: attachments || [],
    reactions: (reactions || []) as ChatReactionWithUser[],
  };
};

// ============================================================================
// Conversation Operations
// ============================================================================

/**
 * Get user's conversations with pagination
 */
export const getConversations = async (
  userId: string,
  params: ConversationListParams
): Promise<ConversationListResponse> => {
  const supabase = getAdminClient();

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  // Get conversation IDs where user is participant
  let participantQuery = supabase
    .from('chat_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  const { data: participantData } = await participantQuery;
  const conversationIds = participantData?.map((p) => p.conversation_id) || [];

  console.log('[GET CONVERSATIONS] User:', userId, 'Conversations found:', conversationIds.length);

  if (conversationIds.length === 0) {
    return {
      conversations: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  // Build conversation query
  let query = supabase
    .from('chat_conversations')
    .select('*', { count: 'exact' })
    .in('id', conversationIds);

  // Apply filters
  if (params.type) {
    query = query.eq('type', params.type);
  }
  if (params.property_id) {
    query = query.eq('property_id', params.property_id);
  }
  if (params.archived !== undefined) {
    query = query.eq('is_archived', params.archived);
  } else {
    // Default: exclude archived
    query = query.eq('is_archived', false);
  }
  if (params.search) {
    query = query.ilike('title', `%${params.search}%`);
  }

  // Sort by last message
  query = query.order('last_message_at', { ascending: false, nullsFirst: false });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: conversations, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch conversations', { error, userId });
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch conversations');
  }

  console.log('[GET CONVERSATIONS] Fetched', conversations?.length || 0, 'conversations');
  if (conversations && conversations.length > 0) {
    const types = conversations.map(c => c.type);
    console.log('[GET CONVERSATIONS] Types:', types);
  }

  // Enrich conversations with details
  const enrichedConversations: ConversationWithDetails[] = await Promise.all(
    (conversations || []).map(async (conv) => {
      // Get participants
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('*, user:users(id, full_name, email, avatar_url)')
        .eq('conversation_id', conv.id);

      // Get property if exists
      let property = null;
      if (conv.property_id) {
        const { data: prop } = await supabase
          .from('properties')
          .select('id, name, featured_image_url')
          .eq('id', conv.property_id)
          .single();
        property = prop;
      }

      // Get last message
      const { data: lastMessageData } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let lastMessage: ChatMessageWithSender | null = null;
      if (lastMessageData) {
        const sender = await getUserInfo(lastMessageData.sender_id);
        lastMessage = {
          ...lastMessageData,
          sender: sender || { id: lastMessageData.sender_id, full_name: 'Unknown', avatar_url: null },
        };
      }

      // Get unread count
      const unreadCount = await getUnreadCount(conv.id, userId);

      // Get support ticket metadata if this is a support conversation
      let supportTicket = null;
      if (conv.type === 'support') {
        const { data: ticket } = await supabase
          .from('support_tickets')
          .select('id, ticket_number, status, priority, category, sla_due_at, sla_breached')
          .eq('conversation_id', conv.id)
          .single();
        supportTicket = ticket;
      }

      return {
        ...conv,
        property,
        participants: (participants || []) as ChatParticipantWithUser[],
        last_message: lastMessage,
        unread_count: unreadCount,
        support_ticket: supportTicket,
      };
    })
  );

  return {
    conversations: enrichedConversations,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

/**
 * Get single conversation with details
 */
export const getConversation = async (
  conversationId: string,
  userId: string
): Promise<ConversationWithDetails> => {
  const supabase = getAdminClient();

  // Check access
  const hasAccess = await isParticipant(conversationId, userId);
  if (!hasAccess) {
    throw new AppError('FORBIDDEN', 'You are not a participant in this conversation');
  }

  const { data: conversation, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !conversation) {
    throw new AppError('NOT_FOUND', 'Conversation not found');
  }

  // Get participants
  const { data: participants } = await supabase
    .from('chat_participants')
    .select('*, user:users(id, full_name, email, avatar_url)')
    .eq('conversation_id', conversationId);

  // Get property if exists
  let property = null;
  if (conversation.property_id) {
    const { data: prop } = await supabase
      .from('properties')
      .select('id, name, featured_image_url')
      .eq('id', conversation.property_id)
      .single();
    property = prop;
  }

  // Get last message
  const { data: lastMessageData } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let lastMessage: ChatMessageWithSender | null = null;
  if (lastMessageData) {
    const sender = await getUserInfo(lastMessageData.sender_id);
    lastMessage = {
      ...lastMessageData,
      sender: sender || { id: lastMessageData.sender_id, full_name: 'Unknown', avatar_url: null },
    };
  }

  // Get unread count
  const unreadCount = await getUnreadCount(conversationId, userId);

  // Get support ticket metadata if this is a support conversation
  let supportTicket = null;
  if (conversation.type === 'support') {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, ticket_number, status, priority, category, sla_due_at, sla_breached')
      .eq('conversation_id', conversationId)
      .single();
    supportTicket = ticket;
  }

  return {
    ...conversation,
    property,
    participants: (participants || []) as ChatParticipantWithUser[],
    last_message: lastMessage,
    unread_count: unreadCount,
    support_ticket: supportTicket,
  };
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  request: CreateConversationRequest,
  creatorId: string
): Promise<{ conversation: ConversationWithDetails; message?: ChatMessageFull }> => {
  const supabase = getAdminClient();

  // Create conversation
  const { data: conversation, error } = await supabase
    .from('chat_conversations')
    .insert({
      type: request.type,
      title: request.title,
      property_id: request.property_id,
      created_by: creatorId,
    })
    .select()
    .single();

  if (error || !conversation) {
    console.error('❌ [ChatService] Failed to create conversation');
    console.error('  Error:', JSON.stringify(error, null, 2));
    console.error('  Request:', JSON.stringify(request, null, 2));
    logger.error('Failed to create conversation', { error, request });
    throw new AppError('INTERNAL_ERROR', 'Failed to create conversation');
  }

  // Add creator as owner
  await supabase.from('chat_participants').insert({
    conversation_id: conversation.id,
    user_id: creatorId,
    role: 'owner',
  });

  // Add other participants
  const participantInserts = request.participant_user_ids
    .filter((id) => id !== creatorId)
    .map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: 'member' as ParticipantRole,
    }));

  if (participantInserts.length > 0) {
    await supabase.from('chat_participants').insert(participantInserts);
  }

  // Send initial message if provided
  let initialMessage: ChatMessageFull | undefined;
  if (request.initial_message) {
    initialMessage = await sendMessage(
      conversation.id,
      { content: request.initial_message },
      creatorId
    );
  }

  // Get full conversation details
  const fullConversation = await getConversation(conversation.id, creatorId);

  logger.info('Conversation created', {
    conversationId: conversation.id,
    type: request.type,
    creatorId,
    participantCount: request.participant_user_ids.length + 1,
  });

  return { conversation: fullConversation, message: initialMessage };
};

/**
 * Archive/unarchive a conversation
 */
export const archiveConversation = async (
  conversationId: string,
  userId: string,
  archive: boolean = true
): Promise<ChatConversation> => {
  const supabase = getAdminClient();

  // Check if user is a participant (any participant can archive for themselves)
  const hasAccess = await isParticipant(conversationId, userId);
  if (!hasAccess) {
    throw new AppError('FORBIDDEN', 'You are not a participant in this conversation');
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .update({ is_archived: archive })
    .eq('id', conversationId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update conversation');
  }

  return data;
};

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Get messages for a conversation (cursor-based pagination)
 */
export const getMessages = async (
  conversationId: string,
  userId: string,
  params: MessageListParams
): Promise<MessageListResponse> => {
  const supabase = getAdminClient();

  // Check access
  const hasAccess = await isParticipant(conversationId, userId);
  if (!hasAccess) {
    throw new AppError('FORBIDDEN', 'You are not a participant in this conversation');
  }

  const limit = params.limit || 50;

  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there are more

  // Cursor pagination: get messages before this ID
  if (params.before) {
    const { data: cursorMessage } = await supabase
      .from('chat_messages')
      .select('created_at')
      .eq('id', params.before)
      .single();

    if (cursorMessage) {
      query = query.lt('created_at', cursorMessage.created_at);
    }
  }

  const { data: messages, error } = await query;

  if (error) {
    logger.error('Failed to fetch messages', { error, conversationId });
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch messages');
  }

  // Check if there are more messages
  const hasMore = (messages?.length || 0) > limit;
  const resultMessages = hasMore ? messages?.slice(0, limit) : messages;

  // Enrich messages
  const enrichedMessages = await Promise.all(
    (resultMessages || []).map((msg) => enrichMessage(msg))
  );

  // Reverse to get chronological order
  enrichedMessages.reverse();

  return {
    messages: enrichedMessages,
    has_more: hasMore,
    oldest_id: enrichedMessages.length > 0 ? enrichedMessages[0].id : null,
  };
};

/**
 * Send a message to a conversation
 */
export const sendMessage = async (
  conversationId: string,
  request: SendMessageRequest,
  senderId: string
): Promise<ChatMessageFull> => {
  const supabase = getAdminClient();

  // Check access
  const hasAccess = await isParticipant(conversationId, senderId);
  if (!hasAccess) {
    throw new AppError('FORBIDDEN', 'You are not a participant in this conversation');
  }

  // If replying, verify reply_to exists in same conversation
  if (request.reply_to_id) {
    const { data: replyMessage } = await supabase
      .from('chat_messages')
      .select('conversation_id')
      .eq('id', request.reply_to_id)
      .single();

    if (!replyMessage || replyMessage.conversation_id !== conversationId) {
      throw new AppError('BAD_REQUEST', 'Invalid reply_to_id');
    }
  }

  // Create message
  const { data: message, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: request.content,
      message_type: request.message_type || 'text',
      reply_to_id: request.reply_to_id,
    })
    .select()
    .single();

  if (error || !message) {
    logger.error('Failed to send message', { error, conversationId, senderId });
    throw new AppError('INTERNAL_ERROR', 'Failed to send message');
  }

  const enrichedMessage = await enrichMessage(message);

  logger.info('Message sent', {
    messageId: message.id,
    conversationId,
    senderId,
  });

  return enrichedMessage;
};

/**
 * Update a message (edit)
 */
export const updateMessage = async (
  messageId: string,
  content: string,
  userId: string
): Promise<ChatMessageFull> => {
  const supabase = getAdminClient();

  // Get message
  const { data: message } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (!message) {
    throw new AppError('NOT_FOUND', 'Message not found');
  }

  // Check ownership
  if (message.sender_id !== userId) {
    throw new AppError('FORBIDDEN', 'You can only edit your own messages');
  }

  // Check if message is deleted
  if (message.is_deleted) {
    throw new AppError('BAD_REQUEST', 'Cannot edit a deleted message');
  }

  // Update message
  const { data: updated, error } = await supabase
    .from('chat_messages')
    .update({
      content,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update message');
  }

  return enrichMessage(updated);
};

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Get message
  const { data: message } = await supabase
    .from('chat_messages')
    .select('sender_id, conversation_id')
    .eq('id', messageId)
    .single();

  if (!message) {
    throw new AppError('NOT_FOUND', 'Message not found');
  }

  // Check ownership or admin status
  const isOwner = message.sender_id === userId;
  const isAdmin = await isConversationAdmin(message.conversation_id, userId);

  if (!isOwner && !isAdmin) {
    throw new AppError('FORBIDDEN', 'You can only delete your own messages');
  }

  // Soft delete
  const { error } = await supabase
    .from('chat_messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', messageId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete message');
  }

  logger.info('Message deleted', { messageId, userId });
};

// ============================================================================
// Reaction Operations
// ============================================================================

/**
 * Add a reaction to a message
 */
export const addReaction = async (
  messageId: string,
  emoji: string,
  userId: string
): Promise<ChatReactionWithUser> => {
  const supabase = getAdminClient();

  // Get message
  const { data: message } = await supabase
    .from('chat_messages')
    .select('conversation_id')
    .eq('id', messageId)
    .single();

  if (!message) {
    throw new AppError('NOT_FOUND', 'Message not found');
  }

  // Check access
  const hasAccess = await isParticipant(message.conversation_id, userId);
  if (!hasAccess) {
    throw new AppError('FORBIDDEN', 'You are not a participant in this conversation');
  }

  // Add reaction (will fail if duplicate due to unique constraint)
  const { data: reaction, error } = await supabase
    .from('chat_reactions')
    .insert({
      message_id: messageId,
      user_id: userId,
      emoji,
    })
    .select('*, user:users(id, full_name, avatar_url)')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique violation - reaction already exists
      throw new AppError('CONFLICT', 'You already reacted with this emoji');
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to add reaction');
  }

  return reaction as ChatReactionWithUser;
};

/**
 * Remove a reaction
 */
export const removeReaction = async (
  reactionId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Get reaction
  const { data: reaction } = await supabase
    .from('chat_reactions')
    .select('user_id')
    .eq('id', reactionId)
    .single();

  if (!reaction) {
    throw new AppError('NOT_FOUND', 'Reaction not found');
  }

  // Check ownership
  if (reaction.user_id !== userId) {
    throw new AppError('FORBIDDEN', 'You can only remove your own reactions');
  }

  const { error } = await supabase.from('chat_reactions').delete().eq('id', reactionId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to remove reaction');
  }
};

// ============================================================================
// Participant Operations
// ============================================================================

/**
 * Add participants to a conversation
 */
export const addParticipants = async (
  conversationId: string,
  userIds: string[],
  role: ParticipantRole,
  actorId: string
): Promise<ChatParticipantWithUser[]> => {
  const supabase = getAdminClient();

  // Check if actor is admin
  const isAdmin = await isConversationAdmin(conversationId, actorId);
  if (!isAdmin) {
    throw new AppError('FORBIDDEN', 'Only conversation admins can add participants');
  }

  // Filter out users already in conversation
  const { data: existing } = await supabase
    .from('chat_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .in('user_id', userIds);

  const existingIds = new Set(existing?.map((e) => e.user_id) || []);
  const newUserIds = userIds.filter((id) => !existingIds.has(id));

  if (newUserIds.length === 0) {
    return [];
  }

  // Insert new participants
  const inserts = newUserIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId,
    role,
  }));

  const { data: participants, error } = await supabase
    .from('chat_participants')
    .insert(inserts)
    .select('*, user:users(id, full_name, email, avatar_url)');

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to add participants');
  }

  return (participants || []) as ChatParticipantWithUser[];
};

/**
 * Remove a participant from a conversation
 */
export const removeParticipant = async (
  conversationId: string,
  participantUserId: string,
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Allow self-removal or admin removal
  const isSelf = participantUserId === actorId;
  const isAdmin = await isConversationAdmin(conversationId, actorId);

  if (!isSelf && !isAdmin) {
    throw new AppError('FORBIDDEN', 'Only admins can remove other participants');
  }

  const { error } = await supabase
    .from('chat_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', participantUserId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to remove participant');
  }
};

/**
 * Update participant settings (mute, role)
 */
export const updateParticipant = async (
  conversationId: string,
  participantUserId: string,
  updates: { is_muted?: boolean; role?: ParticipantRole },
  actorId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Self can only update mute status
  // Admins can update roles
  const isSelf = participantUserId === actorId;
  const isAdmin = await isConversationAdmin(conversationId, actorId);

  if (updates.role && !isAdmin) {
    throw new AppError('FORBIDDEN', 'Only admins can change roles');
  }

  if (!isSelf && !isAdmin) {
    throw new AppError('FORBIDDEN', 'Permission denied');
  }

  const { error } = await supabase
    .from('chat_participants')
    .update(updates)
    .eq('conversation_id', conversationId)
    .eq('user_id', participantUserId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update participant');
  }
};

// ============================================================================
// Read Receipts
// ============================================================================

/**
 * Mark conversation as read (update last_read_at)
 */
export const markAsRead = async (conversationId: string, userId: string): Promise<void> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to mark conversation as read', { error, conversationId, userId });
    throw new AppError('INTERNAL_ERROR', 'Failed to mark as read');
  }
};

// ============================================================================
// Typing Indicators
// ============================================================================

/**
 * Set typing indicator
 */
export const setTypingIndicator = async (
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  const supabase = getAdminClient();

  if (isTyping) {
    // Upsert typing indicator
    const { error } = await supabase.from('chat_typing_indicators').upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5000).toISOString(), // 5 seconds
      },
      { onConflict: 'conversation_id,user_id' }
    );

    if (error) {
      logger.error('Failed to set typing indicator', { error });
    }
  } else {
    // Remove typing indicator
    await supabase
      .from('chat_typing_indicators')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  }
};

// ============================================================================
// Search
// ============================================================================

/**
 * Search messages using full-text search
 */
export const searchMessages = async (
  userId: string,
  params: SearchMessagesParams
): Promise<SearchMessagesResponse> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc('search_chat_messages', {
    p_user_id: userId,
    p_query: params.q,
    p_conversation_id: params.conversation_id || null,
    p_limit: params.limit || 50,
  });

  if (error) {
    logger.error('Failed to search messages', { error, params });
    throw new AppError('INTERNAL_ERROR', 'Failed to search messages');
  }

  // Enrich results
  const enrichedMessages = await Promise.all(
    (data || []).map(async (result: { id: string }) => {
      const { data: message } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', result.id)
        .single();
      return message ? enrichMessage(message) : null;
    })
  );

  return {
    messages: enrichedMessages.filter(Boolean) as ChatMessageFull[],
    total: enrichedMessages.length,
  };
};

// ============================================================================
// Stats
// ============================================================================

/**
 * Get chat statistics for a user
 */
export const getChatStats = async (userId: string): Promise<ChatStats> => {
  const supabase = getAdminClient();

  // Get total unread
  const { data: totalUnread } = await supabase.rpc('get_total_chat_unread_count', {
    p_user_id: userId,
  });

  // Get conversation counts by type
  const { data: conversations } = await supabase
    .from('chat_participants')
    .select('conversation:chat_conversations(type)')
    .eq('user_id', userId);

  const byType: Record<string, number> = {
    guest_inquiry: 0,
    team: 0,
    support: 0,
  };

  (conversations || []).forEach((c) => {
    const conv = c.conversation as { type?: string } | null;
    const type = conv?.type;
    if (type && type in byType) {
      byType[type]++;
    }
  });

  return {
    total_conversations: conversations?.length || 0,
    total_unread: totalUnread || 0,
    conversations_by_type: byType as Record<'guest_inquiry' | 'team' | 'support', number>,
  };
};

// ============================================================================
// Attachments
// ============================================================================

/**
 * Add attachment to a message
 */
export const addAttachment = async (
  messageId: string,
  attachment: AttachmentUpload,
  userId: string
): Promise<ChatAttachment> => {
  const supabase = getAdminClient();

  // Verify message ownership
  const { data: message } = await supabase
    .from('chat_messages')
    .select('sender_id')
    .eq('id', messageId)
    .single();

  if (!message || message.sender_id !== userId) {
    throw new AppError('FORBIDDEN', 'Cannot add attachment to this message');
  }

  // Get public URL for the file
  const { data: urlData } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(attachment.file_path);

  const { data: created, error } = await supabase
    .from('chat_attachments')
    .insert({
      message_id: messageId,
      file_name: attachment.file_name,
      file_type: attachment.file_type,
      file_size: attachment.file_size,
      file_url: urlData.publicUrl,
      thumbnail_url: null, // TODO: Generate thumbnails for images
    })
    .select()
    .single();

  if (error || !created) {
    throw new AppError('INTERNAL_ERROR', 'Failed to save attachment');
  }

  return created;
};

// ============================================================================
// Guest Chat
// ============================================================================

/**
 * Start a guest chat
 * Creates guest account if needed, initiates conversation
 * Public endpoint - no authentication required
 */
export const startGuestChat = async (data: {
  property_id: string;
  property_owner_id: string;
  guest_email: string;
  guest_name: string;
}): Promise<{
  conversation_id: string;
  guest_user_id: string;
  is_new_user: boolean;
}> => {
  console.log('=== [CHAT_SERVICE] startGuestChat called ===');
  console.log('[CHAT_SERVICE] Input:', JSON.stringify(data, null, 2));

  const { property_id, property_owner_id, guest_email, guest_name } = data;

  try {
    // Step 1: Check if user exists
    console.log('[CHAT_SERVICE] Checking if user exists...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === guest_email.toLowerCase()
    );

    let guestUserId: string;
    let isNewUser = false;

    if (existingUser) {
      console.log('[CHAT_SERVICE] User exists:', existingUser.id);
      guestUserId = existingUser.id;
    } else {
      console.log('[CHAT_SERVICE] Creating new guest user...');

      // Create new user account
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: guest_email.toLowerCase(),
        email_confirm: true,
        user_metadata: {
          full_name: guest_name,
          name: guest_name,
        },
      });

      if (createError || !newUser.user) {
        console.error('[CHAT_SERVICE] Failed to create user:', createError);
        throw new AppError('INTERNAL_ERROR', 'Failed to create guest account');
      }

      console.log('[CHAT_SERVICE] User created:', newUser.user.id);
      guestUserId = newUser.user.id;
      isNewUser = true;

      // Insert into users table
      const { error: insertError } = await supabase.from('users').insert({
        id: guestUserId,
        email: guest_email.toLowerCase(),
        full_name: guest_name,
        role: 'guest',
        is_active: true,
      });

      if (insertError) {
        console.error('[CHAT_SERVICE] Failed to insert user record:', insertError);
        // Continue anyway - the auth user is created
      }

      // Send password setup email
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: guest_email.toLowerCase(),
      });

      if (resetError) {
        console.error('[CHAT_SERVICE] Failed to send password setup email:', resetError);
        // Continue anyway - user can request password reset later
      } else {
        console.log('[CHAT_SERVICE] Password setup email sent');
      }
    }

    // Step 2: Check if conversation already exists
    console.log('[CHAT_SERVICE] Checking for existing conversation...');
    const { data: existingConversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('property_id', property_id)
      .eq('type', 'guest_inquiry');

    if (existingConversations && existingConversations.length > 0) {
      // Check if guest is participant in any of these conversations
      for (const conv of existingConversations) {
        const { data: participation } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conv.id)
          .eq('user_id', guestUserId)
          .single();

        if (participation) {
          console.log('[CHAT_SERVICE] Using existing conversation:', conv.id);
          return {
            conversation_id: conv.id,
            guest_user_id: guestUserId,
            is_new_user: isNewUser,
          };
        }
      }
    }

    // Step 3: Create new conversation
    console.log('[CHAT_SERVICE] Creating new conversation...');
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'guest_inquiry',
        property_id: property_id,
        title: `Chat with ${guest_name}`,
        created_by: guestUserId,
      })
      .select()
      .single();

    if (convError || !conversation) {
      console.error('[CHAT_SERVICE] Failed to create conversation:', convError);
      throw new AppError('INTERNAL_ERROR', 'Failed to create conversation');
    }

    console.log('[CHAT_SERVICE] Conversation created:', conversation.id);

    // Step 4: Add participants
    console.log('[CHAT_SERVICE] Adding participants...');
    const { error: participantsError } = await supabase.from('conversation_participants').insert([
      {
        conversation_id: conversation.id,
        user_id: guestUserId,
        role: 'member',
      },
      {
        conversation_id: conversation.id,
        user_id: property_owner_id,
        role: 'admin',
      },
    ]);

    if (participantsError) {
      console.error('[CHAT_SERVICE] Failed to add participants:', participantsError);
      throw new AppError('INTERNAL_ERROR', 'Failed to add chat participants');
    }

    console.log('[CHAT_SERVICE] Participants added successfully');

    return {
      conversation_id: conversation.id,
      guest_user_id: guestUserId,
      is_new_user: isNewUser,
    };
  } catch (error: any) {
    console.error('[CHAT_SERVICE] Error in startGuestChat:', error);
    console.error('[CHAT_SERVICE] Error stack:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
};
