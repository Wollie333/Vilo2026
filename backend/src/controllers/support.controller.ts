/**
 * Support Controller
 * Handles API endpoints for support tickets and canned responses
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as supportTicketService from '../services/support-ticket.service';
import * as chatService from '../services/chat.service';
import { AppError } from '../utils/errors';

// ============================================================================
// TICKET MANAGEMENT
// ============================================================================

/**
 * List tickets
 * GET /api/support/tickets
 */
export const listTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      status: req.query.status as any,
      priority: req.query.priority as any,
      category: req.query.category as any,
      assigned_to: req.query.assigned_to as string | undefined,
      requester_id: req.query.requester_id as string | undefined,
      company_id: req.query.company_id as string | undefined,
      sla_breached: req.query.sla_breached === 'true' ? true : req.query.sla_breached === 'false' ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    const result = await supportTicketService.listTickets(params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get ticket details
 * GET /api/support/tickets/:id
 */
export const getTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ticket = await supportTicketService.getTicket(id);
    sendSuccess(res, ticket);
  } catch (error) {
    next(error);
  }
};

/**
 * Get ticket with customer context
 * GET /api/support/tickets/:id/context
 */
export const getTicketWithContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ticket = await supportTicketService.getTicketWithContext(id);
    sendSuccess(res, ticket);
  } catch (error) {
    next(error);
  }
};

/**
 * Create ticket
 * POST /api/support/tickets
 */
export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const ticket = await supportTicketService.createTicket(req.body, userId);
    sendSuccess(res, ticket, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket
 * PATCH /api/support/tickets/:id
 */
export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ticket = await supportTicketService.updateTicket(id, req.body);
    sendSuccess(res, ticket);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign ticket to agent
 * POST /api/support/tickets/:id/assign
 */
export const assignTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const ticket = await supportTicketService.assignTicket(id, req.body, userId);
    sendSuccess(res, ticket);
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve ticket
 * POST /api/support/tickets/:id/resolve
 */
export const resolveTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const ticket = await supportTicketService.resolveTicket(id, req.body, userId);
    sendSuccess(res, ticket);
  } catch (error) {
    next(error);
  }
};

/**
 * Close ticket
 * POST /api/support/tickets/:id/close
 */
export const closeTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { archive_conversation } = req.body;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const ticket = await supportTicketService.closeTicket(id, userId);

    // Optionally archive the conversation
    if (archive_conversation && ticket.conversation_id) {
      await chatService.archiveConversation(ticket.conversation_id, userId, true);
    }

    sendSuccess(res, ticket);
  } catch (error) {
    next(error);
  }
};

/**
 * Add internal note
 * POST /api/support/tickets/:id/notes
 */
export const addInternalNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const note = await supportTicketService.addInternalNote(id, req.body, userId);
    sendSuccess(res, note, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get agent's ticket queue
 * GET /api/support/tickets/my-queue
 */
export const getMyQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const tickets = await supportTicketService.getAgentQueue(userId, { status, limit });
    sendSuccess(res, tickets);
  } catch (error) {
    next(error);
  }
};

/**
 * Get ticket statistics
 * GET /api/support/tickets/stats
 */
export const getTicketStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      agent_id: req.query.agent_id as string | undefined,
      company_id: req.query.company_id as string | undefined,
      date_from: req.query.date_from ? new Date(req.query.date_from as string) : undefined,
      date_to: req.query.date_to ? new Date(req.query.date_to as string) : undefined,
    };

    const stats = await supportTicketService.getTicketStats(params);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CANNED RESPONSES
// ============================================================================

/**
 * List canned responses
 * GET /api/support/canned-responses
 */
export const listCannedResponses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      category: req.query.category as string | undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
    };

    const responses = await supportTicketService.listCannedResponses(params);
    sendSuccess(res, responses);
  } catch (error) {
    next(error);
  }
};

/**
 * Create canned response
 * POST /api/support/canned-responses
 */
export const createCannedResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const response = await supportTicketService.createCannedResponse(req.body, userId);
    sendSuccess(res, response, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update canned response
 * PATCH /api/support/canned-responses/:id
 */
export const updateCannedResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const response = await supportTicketService.updateCannedResponse(id, req.body);
    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
};

/**
 * Use canned response (increment usage count)
 * POST /api/support/canned-responses/:id/use
 */
export const useCannedResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await supportTicketService.incrementCannedResponseUsage(id);
    sendSuccess(res, { message: 'Usage count incremented' });
  } catch (error) {
    next(error);
  }
};
