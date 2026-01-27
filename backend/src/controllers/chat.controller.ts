/**
 * Chat Controller
 * Chat System - HTTP request handlers for chat endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as chatService from '../services/chat.service';
import * as whatsappReplyService from '../services/whatsapp-reply.service';
import type {
  ConversationListParams,
  MessageListParams,
  CreateConversationRequest,
  SendMessageRequest,
  SearchMessagesParams,
  ParticipantRole,
} from '../types/chat.types';

// ============================================================================
// Conversation Endpoints
// ============================================================================

/**
 * GET /api/chat/conversations
 * List user's conversations
 */
export const listConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await chatService.getConversations(
      req.user!.id,
      req.query as unknown as ConversationListParams
    );

    sendSuccess(res, result, 200, {
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/conversations/:id
 * Get a single conversation
 */
export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversation = await chatService.getConversation(req.params.id, req.user!.id);
    sendSuccess(res, { conversation });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/conversations
 * Create a new conversation
 */
export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await chatService.createConversation(
      req.body as CreateConversationRequest,
      req.user!.id
    );
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/chat/conversations/:id/archive
 * Archive a conversation
 */
export const archiveConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversation = await chatService.archiveConversation(
      req.params.id,
      req.user!.id,
      true
    );
    sendSuccess(res, { conversation, message: 'Conversation archived' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/chat/conversations/:id/unarchive
 * Unarchive a conversation
 */
export const unarchiveConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversation = await chatService.archiveConversation(
      req.params.id,
      req.user!.id,
      false
    );
    sendSuccess(res, { conversation, message: 'Conversation unarchived' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/chat/conversations/:id/read
 * Mark conversation as read
 */
export const markConversationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await chatService.markAsRead(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Message Endpoints
// ============================================================================

/**
 * GET /api/chat/conversations/:id/messages
 * List messages in a conversation
 */
export const listMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await chatService.getMessages(
      req.params.id,
      req.user!.id,
      req.query as unknown as MessageListParams
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/conversations/:id/messages
 * Send a message to a conversation
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const message = await chatService.sendMessage(
      req.params.id,
      req.body as SendMessageRequest,
      req.user!.id
    );
    sendSuccess(res, { message }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/chat/messages/:id
 * Edit a message
 */
export const updateMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const message = await chatService.updateMessage(
      req.params.id,
      req.body.content,
      req.user!.id
    );
    sendSuccess(res, { message });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/messages/:id
 * Delete a message
 */
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await chatService.deleteMessage(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Reaction Endpoints
// ============================================================================

/**
 * POST /api/chat/messages/:id/reactions
 * Add a reaction to a message
 */
export const addReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reaction = await chatService.addReaction(
      req.params.id,
      req.body.emoji,
      req.user!.id
    );
    sendSuccess(res, { reaction }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/messages/:id/reactions/:reactionId
 * Remove a reaction
 */
export const removeReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await chatService.removeReaction(req.params.reactionId, req.user!.id);
    sendSuccess(res, { message: 'Reaction removed' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Participant Endpoints
// ============================================================================

/**
 * POST /api/chat/conversations/:id/participants
 * Add participants to a conversation
 */
export const addParticipants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const participants = await chatService.addParticipants(
      req.params.id,
      req.body.user_ids,
      req.body.role || 'member',
      req.user!.id
    );
    sendSuccess(res, { participants }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/chat/conversations/:id/participants/:participantId
 * Remove a participant
 */
export const removeParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await chatService.removeParticipant(
      req.params.id,
      req.params.participantId,
      req.user!.id
    );
    sendSuccess(res, { message: 'Participant removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/chat/conversations/:id/participants/:participantId
 * Update participant settings
 */
export const updateParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await chatService.updateParticipant(
      req.params.id,
      req.params.participantId,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { message: 'Participant updated' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Typing Indicator
// ============================================================================

/**
 * POST /api/chat/conversations/:id/typing
 * Set typing indicator
 */
export const setTyping = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await chatService.setTypingIndicator(
      req.params.id,
      req.user!.id,
      req.body.is_typing
    );
    sendSuccess(res, { ok: true });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Search
// ============================================================================

/**
 * GET /api/chat/messages/search
 * Search messages
 */
export const searchMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await chatService.searchMessages(
      req.user!.id,
      req.query as unknown as SearchMessagesParams
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Stats
// ============================================================================

/**
 * GET /api/chat/stats
 * Get chat statistics
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await chatService.getChatStats(req.user!.id);
    sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// WhatsApp Reply Endpoints
// ============================================================================

/**
 * POST /api/chat/conversations/:conversationId/reply-whatsapp
 * Send a WhatsApp reply from the chat interface
 */
export const replyWhatsApp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { content, recipientPhone } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!content || !recipientPhone) {
      res.status(400).json({ error: 'Missing content or recipientPhone' });
      return;
    }

    await whatsappReplyService.sendWhatsAppReply({
      conversationId,
      senderId: userId,
      content,
      recipientPhone,
    });

    sendSuccess(res, { message: 'Reply sent successfully' });
  } catch (error: any) {
    // Handle template required error
    if (error.code === 'TEMPLATE_REQUIRED') {
      res.status(400).json({
        error: 'template_required',
        message: 'Outside 24-hour window. Please select a template.',
      });
      return;
    }

    next(error);
  }
};

/**
 * GET /api/chat/conversations/:conversationId/whatsapp-window
 * Check if 24-hour conversation window is active
 */
export const checkWhatsAppWindow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;

    const isActive = await whatsappReplyService.isConversationWindowActive(conversationId);

    sendSuccess(res, {
      windowActive: isActive,
      message: isActive
        ? 'Free-form replies allowed'
        : 'Template required (outside 24h window)',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/conversations/:conversationId/whatsapp-window/status
 * Get detailed 24-hour conversation window status
 */
export const getWhatsAppWindowStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;

    const status = await whatsappReplyService.getConversationWindowStatus(conversationId);

    sendSuccess(res, status);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Guest Chat
// ============================================================================

/**
 * POST /api/chat/guest/start
 * Start a guest chat (public endpoint - no auth required)
 * Creates guest account if needed, starts conversation
 */
export const startGuestChat = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== [CHAT_CONTROLLER] startGuestChat called ===');
    console.log('[CHAT_CONTROLLER] Request body:', JSON.stringify(req.body, null, 2));

    const { property_id, property_owner_id, guest_email, guest_name } = req.body;

    // Validate required fields
    if (!property_id || !property_owner_id || !guest_email || !guest_name) {
      throw new Error('Missing required fields: property_id, property_owner_id, guest_email, guest_name');
    }

    const result = await chatService.startGuestChat({
      property_id,
      property_owner_id,
      guest_email,
      guest_name,
    });

    console.log('[CHAT_CONTROLLER] Guest chat started successfully:', result);

    sendSuccess(res, result, 200, {
      message: result.is_new_user
        ? 'Guest account created and chat started. Password setup email sent.'
        : 'Chat started successfully.',
    });
  } catch (error) {
    console.error('[CHAT_CONTROLLER] Failed to start guest chat:', error);
    next(error);
  }
};
