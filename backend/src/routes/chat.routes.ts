/**
 * Chat Routes
 * Chat System - Route definitions for chat endpoints
 */

import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import {
  authenticate,
  loadUserProfile,
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware';
import {
  conversationIdParamSchema,
  messageIdParamSchema,
  reactionIdParamSchema,
  participantIdParamSchema,
  conversationListQuerySchema,
  createConversationSchema,
  messageListQuerySchema,
  sendMessageSchema,
  updateMessageSchema,
  addReactionSchema,
  addParticipantsSchema,
  updateParticipantSchema,
  setTypingSchema,
  searchMessagesQuerySchema,
} from '../validators/chat.validators';

const router = Router();

// ============================================================================
// Public Routes (No Authentication Required)
// ============================================================================

// POST /api/chat/guest/start - Start guest chat (public)
router.post('/guest/start', chatController.startGuestChat);

// ============================================================================
// Protected Routes (Authentication Required)
// ============================================================================

// All routes below require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// Conversation Routes
// ============================================================================

// GET /api/chat/conversations - List user's conversations
router.get(
  '/conversations',
  validateQuery(conversationListQuerySchema),
  chatController.listConversations
);

// POST /api/chat/conversations - Create a new conversation
router.post(
  '/conversations',
  validateBody(createConversationSchema),
  chatController.createConversation
);

// GET /api/chat/conversations/:id - Get single conversation
router.get(
  '/conversations/:id',
  validateParams(conversationIdParamSchema),
  chatController.getConversation
);

// PATCH /api/chat/conversations/:id/archive - Archive conversation
router.patch(
  '/conversations/:id/archive',
  validateParams(conversationIdParamSchema),
  chatController.archiveConversation
);

// PATCH /api/chat/conversations/:id/unarchive - Unarchive conversation
router.patch(
  '/conversations/:id/unarchive',
  validateParams(conversationIdParamSchema),
  chatController.unarchiveConversation
);

// PATCH /api/chat/conversations/:id/read - Mark conversation as read
router.patch(
  '/conversations/:id/read',
  validateParams(conversationIdParamSchema),
  chatController.markConversationAsRead
);

// ============================================================================
// Message Routes
// ============================================================================

// GET /api/chat/conversations/:id/messages - List messages in conversation
router.get(
  '/conversations/:id/messages',
  validateParams(conversationIdParamSchema),
  validateQuery(messageListQuerySchema),
  chatController.listMessages
);

// POST /api/chat/conversations/:id/messages - Send a message
router.post(
  '/conversations/:id/messages',
  validateParams(conversationIdParamSchema),
  validateBody(sendMessageSchema),
  chatController.sendMessage
);

// PATCH /api/chat/messages/:id - Edit a message
router.patch(
  '/messages/:id',
  validateParams(messageIdParamSchema),
  validateBody(updateMessageSchema),
  chatController.updateMessage
);

// DELETE /api/chat/messages/:id - Delete a message
router.delete(
  '/messages/:id',
  validateParams(messageIdParamSchema),
  chatController.deleteMessage
);

// ============================================================================
// Reaction Routes
// ============================================================================

// POST /api/chat/messages/:id/reactions - Add a reaction
router.post(
  '/messages/:id/reactions',
  validateParams(messageIdParamSchema),
  validateBody(addReactionSchema),
  chatController.addReaction
);

// DELETE /api/chat/messages/:id/reactions/:reactionId - Remove a reaction
router.delete(
  '/messages/:id/reactions/:reactionId',
  validateParams(reactionIdParamSchema),
  chatController.removeReaction
);

// ============================================================================
// Participant Routes
// ============================================================================

// POST /api/chat/conversations/:id/participants - Add participants
router.post(
  '/conversations/:id/participants',
  validateParams(conversationIdParamSchema),
  validateBody(addParticipantsSchema),
  chatController.addParticipants
);

// DELETE /api/chat/conversations/:id/participants/:participantId - Remove participant
router.delete(
  '/conversations/:id/participants/:participantId',
  validateParams(participantIdParamSchema),
  chatController.removeParticipant
);

// PATCH /api/chat/conversations/:id/participants/:participantId - Update participant
router.patch(
  '/conversations/:id/participants/:participantId',
  validateParams(participantIdParamSchema),
  validateBody(updateParticipantSchema),
  chatController.updateParticipant
);

// ============================================================================
// Typing Indicator Route
// ============================================================================

// POST /api/chat/conversations/:id/typing - Set typing indicator
router.post(
  '/conversations/:id/typing',
  validateParams(conversationIdParamSchema),
  validateBody(setTypingSchema),
  chatController.setTyping
);

// ============================================================================
// Search Route
// ============================================================================

// GET /api/chat/messages/search - Search messages
router.get(
  '/messages/search',
  validateQuery(searchMessagesQuerySchema),
  chatController.searchMessages
);

// ============================================================================
// Stats Route
// ============================================================================

// GET /api/chat/stats - Get chat statistics
router.get('/stats', chatController.getStats);

// ============================================================================
// WhatsApp Reply Routes
// ============================================================================

// POST /api/chat/conversations/:conversationId/reply-whatsapp - Send WhatsApp reply
router.post(
  '/conversations/:conversationId/reply-whatsapp',
  validateParams(conversationIdParamSchema),
  chatController.replyWhatsApp
);

// GET /api/chat/conversations/:conversationId/whatsapp-window - Check 24h window status
router.get(
  '/conversations/:conversationId/whatsapp-window',
  validateParams(conversationIdParamSchema),
  chatController.checkWhatsAppWindow
);

// GET /api/chat/conversations/:conversationId/whatsapp-window/status - Get detailed window status
router.get(
  '/conversations/:conversationId/whatsapp-window/status',
  validateParams(conversationIdParamSchema),
  chatController.getWhatsAppWindowStatus
);

export default router;
