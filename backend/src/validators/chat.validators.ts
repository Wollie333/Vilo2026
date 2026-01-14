/**
 * Chat Validators (Zod Schemas)
 * Chat System - Conversations, Messages, Reactions
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const conversationIdParamSchema = z.object({
  id: z.string().uuid('Invalid conversation ID'),
});

export const messageIdParamSchema = z.object({
  id: z.string().uuid('Invalid message ID'),
});

export const reactionIdParamSchema = z.object({
  id: z.string().uuid('Invalid message ID'),
  reactionId: z.string().uuid('Invalid reaction ID'),
});

export const conversationTypeSchema = z.enum(['guest_inquiry', 'team', 'support']);

export const participantRoleSchema = z.enum(['owner', 'admin', 'member', 'guest']);

export const messageTypeSchema = z.enum(['text', 'system', 'media']);

// ============================================================================
// Conversation Schemas
// ============================================================================

/**
 * Schema for listing conversations
 */
export const conversationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: conversationTypeSchema.optional(),
  property_id: z.string().uuid().optional(),
  search: z.string().max(255).optional(),
  archived: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional()
  ),
});

/**
 * Schema for creating a conversation
 */
export const createConversationSchema = z.object({
  type: conversationTypeSchema,
  title: z.string().max(255).optional(),
  property_id: z.string().uuid().optional(),
  participant_user_ids: z
    .array(z.string().uuid())
    .min(1, 'At least one participant is required')
    .max(50, 'Maximum 50 participants allowed'),
  initial_message: z.string().max(10000).optional(),
});

/**
 * Schema for updating a conversation
 */
export const updateConversationSchema = z.object({
  title: z.string().max(255).optional(),
  is_archived: z.boolean().optional(),
});

// ============================================================================
// Message Schemas
// ============================================================================

/**
 * Schema for listing messages (cursor-based pagination)
 */
export const messageListQuerySchema = z.object({
  before: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Schema for sending a message
 */
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  message_type: messageTypeSchema.default('text'),
  reply_to_id: z.string().uuid().optional(),
});

/**
 * Schema for updating a message
 */
export const updateMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
});

// ============================================================================
// Reaction Schemas
// ============================================================================

/**
 * Schema for adding a reaction
 */
export const addReactionSchema = z.object({
  emoji: z
    .string()
    .min(1, 'Emoji is required')
    .max(20, 'Emoji too long')
    .refine(
      (val) => {
        // Basic emoji validation - allows emoji characters and common emoji shortcodes
        const emojiRegex = /^[\p{Emoji}\u200d]+$/u;
        const shortcodeRegex = /^:[a-z0-9_+-]+:$/;
        return emojiRegex.test(val) || shortcodeRegex.test(val);
      },
      { message: 'Invalid emoji format' }
    ),
});

// ============================================================================
// Participant Schemas
// ============================================================================

/**
 * Schema for adding participants
 */
export const addParticipantsSchema = z.object({
  user_ids: z
    .array(z.string().uuid())
    .min(1, 'At least one user is required')
    .max(50, 'Maximum 50 users per request'),
  role: participantRoleSchema.default('member'),
});

/**
 * Schema for updating participant settings
 */
export const updateParticipantSchema = z.object({
  is_muted: z.boolean().optional(),
  role: participantRoleSchema.optional(),
});

/**
 * Schema for participant ID param
 */
export const participantIdParamSchema = z.object({
  id: z.string().uuid('Invalid conversation ID'),
  participantId: z.string().uuid('Invalid participant ID'),
});

// ============================================================================
// Typing Indicator Schemas
// ============================================================================

/**
 * Schema for setting typing indicator
 */
export const setTypingSchema = z.object({
  is_typing: z.boolean(),
});

// ============================================================================
// Search Schemas
// ============================================================================

/**
 * Schema for searching messages
 */
export const searchMessagesQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(255),
  conversation_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ============================================================================
// Inferred Types
// ============================================================================

export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;
export type MessageIdParam = z.infer<typeof messageIdParamSchema>;
export type ReactionIdParam = z.infer<typeof reactionIdParamSchema>;
export type ParticipantIdParam = z.infer<typeof participantIdParamSchema>;

export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

export type MessageListQuery = z.infer<typeof messageListQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;

export type AddReactionInput = z.infer<typeof addReactionSchema>;

export type AddParticipantsInput = z.infer<typeof addParticipantsSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;

export type SetTypingInput = z.infer<typeof setTypingSchema>;

export type SearchMessagesQuery = z.infer<typeof searchMessagesQuerySchema>;
