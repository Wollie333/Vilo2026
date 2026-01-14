/**
 * Payment Rules Routes
 *
 * API routes for payment rules management.
 */

import { Router } from 'express';
import * as paymentRulesController from '../controllers/payment-rules.controller';
import { authenticate, validateBody } from '../middleware';
import {
  createPaymentRuleSchema,
  updatePaymentRuleSchema,
} from '../validators/payment-rules.validators';

/**
 * Global Payment Rules Router - Centralized Management
 * Mount at root level for /api/payment-rules endpoints
 */
export const globalPaymentRulesRouter = Router();

globalPaymentRulesRouter.use(authenticate);

// List all payment rules across properties
globalPaymentRulesRouter.get('/payment-rules', paymentRulesController.listAllPaymentRules);

// Create payment rule (property-level)
globalPaymentRulesRouter.post(
  '/payment-rules',
  validateBody(createPaymentRuleSchema),
  paymentRulesController.createPaymentRuleGlobal
);

// Get a specific payment rule by ID
globalPaymentRulesRouter.get('/payment-rules/:id', paymentRulesController.getPaymentRuleById);

// Check if payment rule can be edited (not assigned to rooms)
globalPaymentRulesRouter.get('/payment-rules/:id/edit-permission', paymentRulesController.checkRuleEditPermission);

// Update payment rule by ID
globalPaymentRulesRouter.put(
  '/payment-rules/:id',
  validateBody(updatePaymentRuleSchema),
  paymentRulesController.updatePaymentRuleGlobal
);

// Delete payment rule by ID
globalPaymentRulesRouter.delete('/payment-rules/:id', paymentRulesController.deletePaymentRuleGlobal);

// Get room assignments for a payment rule
globalPaymentRulesRouter.get('/payment-rules/:id/assignments', paymentRulesController.getPaymentRuleAssignments);

// Assign payment rule to multiple rooms
globalPaymentRulesRouter.post('/payment-rules/:id/assign-rooms', paymentRulesController.assignPaymentRuleToRooms);

// Unassign payment rule from a specific room
globalPaymentRulesRouter.delete('/payment-rules/:id/unassign-room/:roomId', paymentRulesController.unassignPaymentRuleFromRoom);

/**
 * Room-Specific Payment Rules Router
 * Mount under /api/rooms for /api/rooms/:roomId/payment-rules endpoints
 */
export const roomPaymentRulesRouter = Router();

roomPaymentRulesRouter.use(authenticate);

// Create a payment rule for a room
roomPaymentRulesRouter.post(
  '/:roomId/payment-rules',
  validateBody(createPaymentRuleSchema),
  paymentRulesController.createPaymentRule
);

// List all payment rules for a room
roomPaymentRulesRouter.get('/:roomId/payment-rules', paymentRulesController.listRoomPaymentRules);

// Get a specific payment rule
roomPaymentRulesRouter.get('/:roomId/payment-rules/:id', paymentRulesController.getPaymentRule);

// Update a payment rule
roomPaymentRulesRouter.put(
  '/:roomId/payment-rules/:id',
  validateBody(updatePaymentRuleSchema),
  paymentRulesController.updatePaymentRule
);

// Delete a payment rule
roomPaymentRulesRouter.delete('/:roomId/payment-rules/:id', paymentRulesController.deletePaymentRule);

// Default export for backward compatibility
export default globalPaymentRulesRouter;
