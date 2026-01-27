/**
 * Support Routes
 * Routes for support tickets, canned responses, and internal notes
 */

import { Router } from 'express';
import * as supportController from '../controllers/support.controller';
import { authenticate, loadUserProfile } from '../middleware/auth.middleware';
import { requireManager } from '../middleware/rbac.middleware';

const router = Router();

// All routes require authentication and user profile
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// TICKET MANAGEMENT
// ============================================================================

// List tickets
router.get('/tickets', supportController.listTickets);

// Get my queue (agent's assigned tickets)
router.get('/tickets/my-queue', supportController.getMyQueue);

// Get ticket statistics (managers/admins only)
router.get('/tickets/stats', requireManager(), supportController.getTicketStats);

// Get ticket details
router.get('/tickets/:id', supportController.getTicket);

// Get ticket with customer context
router.get('/tickets/:id/context', supportController.getTicketWithContext);

// Create ticket
router.post('/tickets', supportController.createTicket);

// Update ticket
router.patch('/tickets/:id', supportController.updateTicket);

// Assign ticket to agent
router.post('/tickets/:id/assign', supportController.assignTicket);

// Resolve ticket
router.post('/tickets/:id/resolve', supportController.resolveTicket);

// Close ticket
router.post('/tickets/:id/close', supportController.closeTicket);

// Add internal note
router.post('/tickets/:id/notes', supportController.addInternalNote);

// ============================================================================
// CANNED RESPONSES
// ============================================================================

// List canned responses
router.get('/canned-responses', supportController.listCannedResponses);

// Create canned response
router.post('/canned-responses', supportController.createCannedResponse);

// Update canned response
router.patch('/canned-responses/:id', supportController.updateCannedResponse);

// Use canned response (increment usage count)
router.post('/canned-responses/:id/use', supportController.useCannedResponse);

export default router;
