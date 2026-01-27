/**
 * Quote Request Routes
 *
 * API routes for quote request management
 */

import { Router } from 'express';
import * as quoteRequestController from '../controllers/quote-request.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  createQuoteRequestSchema,
  respondToQuoteSchema,
  updateQuoteStatusSchema,
  quoteRequestIdParamSchema,
} from '../validators/quote-request.validators';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * POST /quote-requests
 * Submit a quote request (guest/public access)
 */
router.post(
  '/',
  validateBody(createQuoteRequestSchema),
  quoteRequestController.create
);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

/**
 * GET /quote-requests/stats
 * Get quote request statistics
 * IMPORTANT: This MUST come before /:id route to avoid matching "stats" as an ID
 */
router.get(
  '/stats',
  authenticate,
  quoteRequestController.getStats
);

/**
 * GET /quote-requests
 * List quote requests with filters
 */
router.get(
  '/',
  authenticate,
  quoteRequestController.list
);

/**
 * GET /quote-requests/:id
 * Get a specific quote request by ID
 */
router.get(
  '/:id',
  authenticate,
  validateParams(quoteRequestIdParamSchema),
  quoteRequestController.getById
);

/**
 * POST /quote-requests/:id/respond
 * Respond to a quote request
 */
router.post(
  '/:id/respond',
  authenticate,
  validateParams(quoteRequestIdParamSchema),
  validateBody(respondToQuoteSchema),
  quoteRequestController.respond
);

/**
 * PATCH /quote-requests/:id/status
 * Update quote request status
 */
router.patch(
  '/:id/status',
  authenticate,
  validateParams(quoteRequestIdParamSchema),
  validateBody(updateQuoteStatusSchema),
  quoteRequestController.updateStatus
);

/**
 * POST /quote-requests/:id/convert
 * Mark quote as converted to booking
 */
router.post(
  '/:id/convert',
  authenticate,
  validateParams(quoteRequestIdParamSchema),
  quoteRequestController.convertToBooking
);

export default router;
