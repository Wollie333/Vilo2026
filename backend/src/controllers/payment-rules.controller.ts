/**
 * Payment Rules Controller
 *
 * HTTP request handlers for payment rules API endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import * as paymentRulesService from '../services/payment-rules.service';
import { CreatePaymentRuleRequest, UpdatePaymentRuleRequest } from '../types/payment-rules.types';

/**
 * Create a new payment rule
 * POST /api/rooms/:roomId/payment-rules
 */
export const createPaymentRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { roomId } = req.params;
    const input: CreatePaymentRuleRequest = {
      ...req.body,
      room_id: roomId,
    };

    const rule = await paymentRulesService.createPaymentRule(userId, input);

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a payment rule by ID
 * GET /api/rooms/:roomId/payment-rules/:id
 */
export const getPaymentRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const rule = await paymentRulesService.getPaymentRule(userId, id);

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List payment rules for a room
 * GET /api/rooms/:roomId/payment-rules
 */
export const listRoomPaymentRules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { roomId } = req.params;

    const response = await paymentRulesService.listRoomPaymentRules(userId, roomId);

    res.status(200).json({
      success: true,
      data: response.rules,
      total: response.total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a payment rule
 * PUT /api/rooms/:roomId/payment-rules/:id
 */
export const updatePaymentRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const input: UpdatePaymentRuleRequest = req.body;

    const rule = await paymentRulesService.updatePaymentRule(userId, id, input);

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a payment rule
 * DELETE /api/rooms/:roomId/payment-rules/:id
 */
export const deletePaymentRule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    await paymentRulesService.deletePaymentRule(userId, id);

    res.status(200).json({
      success: true,
      message: 'Payment rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CENTRALIZED MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * List all payment rules across user's properties
 * GET /api/payment-rules
 */
export const listAllPaymentRules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { propertyId } = req.query;

    const response = await paymentRulesService.listAllPaymentRules(
      userId,
      propertyId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: response.rules,
      total: response.total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get room assignments for a payment rule
 * GET /api/payment-rules/:id/assignments
 */
export const getPaymentRuleAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const assignments = await paymentRulesService.getPaymentRuleAssignments(userId, id);

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign payment rule to multiple rooms
 * POST /api/payment-rules/:id/assign-rooms
 */
export const assignPaymentRuleToRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { roomIds } = req.body;

    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      res.status(400).json({ error: 'roomIds must be a non-empty array' });
      return;
    }

    await paymentRulesService.assignPaymentRuleToRooms(userId, id, roomIds);

    res.status(200).json({
      success: true,
      message: 'Payment rule assigned to rooms successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unassign payment rule from a room
 * DELETE /api/payment-rules/:id/unassign-room/:roomId
 */
export const unassignPaymentRuleFromRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id, roomId } = req.params;

    await paymentRulesService.unassignPaymentRuleFromRoom(userId, id, roomId);

    res.status(200).json({
      success: true,
      message: 'Payment rule unassigned from room successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GLOBAL PROPERTY-LEVEL CRUD CONTROLLERS
// ============================================================================

/**
 * Create a payment rule at property level
 * POST /api/payment-rules
 */
export const createPaymentRuleGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { property_id, room_ids, ...ruleData } = req.body;

    if (!property_id) {
      res.status(400).json({ error: 'property_id is required' });
      return;
    }

    // Create the payment rule
    const rule = await paymentRulesService.createPaymentRuleGlobal(
      userId,
      property_id,
      ruleData
    );

    // Optionally assign to rooms
    if (room_ids && Array.isArray(room_ids) && room_ids.length > 0) {
      await paymentRulesService.assignPaymentRuleToRooms(userId, rule.id, room_ids);
    }

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a payment rule by ID
 * PUT /api/payment-rules/:id
 */
export const updatePaymentRuleGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const input: UpdatePaymentRuleRequest = req.body;

    const rule = await paymentRulesService.updatePaymentRuleGlobal(userId, id, input);

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a payment rule by ID
 * DELETE /api/payment-rules/:id
 */
export const deletePaymentRuleGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    await paymentRulesService.deletePaymentRuleGlobal(userId, id);

    res.status(200).json({
      success: true,
      message: 'Payment rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a payment rule by ID (for editing)
 * GET /api/payment-rules/:id
 */
export const getPaymentRuleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const rule = await paymentRulesService.getPaymentRuleById(userId, id);

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a payment rule can be edited (not assigned to any rooms)
 * GET /api/payment-rules/:id/edit-permission
 */
export const checkRuleEditPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const validation = await paymentRulesService.validateRuleEditPermission(id, userId);

    res.status(200).json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
};
