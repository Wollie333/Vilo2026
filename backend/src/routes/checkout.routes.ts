import { Router } from 'express';
import * as checkoutController from '../controllers/checkout.controller';
import {
  authenticate,
  loadUserProfile,
  requireAdmin,
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware';
import {
  initializeCheckoutSchema,
  selectProviderSchema,
  verifyPaymentSchema,
  cancelCheckoutSchema,
  confirmEFTSchema,
  checkoutListQuerySchema,
  checkoutIdParamSchema,
} from '../validators/checkout.validators';

const router = Router();

// ============================================================================
// PUBLIC ENDPOINT - Payment Methods (No auth required)
// ============================================================================

/**
 * GET /api/checkout/payment-methods
 * Get available payment methods for the pricing page
 */
router.get('/payment-methods', checkoutController.getPaymentMethods);

// ============================================================================
// AUTHENTICATED ENDPOINTS
// ============================================================================

// All routes below require authentication
router.use(authenticate);
router.use(loadUserProfile);

/**
 * POST /api/checkout/initialize
 * Start a new checkout session
 */
router.post(
  '/initialize',
  validateBody(initializeCheckoutSchema),
  checkoutController.initializeCheckout
);

/**
 * POST /api/checkout/select-provider
 * Select payment provider and get initialization data
 */
router.post(
  '/select-provider',
  validateBody(selectProviderSchema),
  checkoutController.selectProvider
);

/**
 * POST /api/checkout/verify
 * Verify payment after returning from provider
 */
router.post(
  '/verify',
  validateBody(verifyPaymentSchema),
  checkoutController.verifyPayment
);

/**
 * POST /api/checkout/cancel
 * Cancel a pending checkout
 */
router.post(
  '/cancel',
  validateBody(cancelCheckoutSchema),
  checkoutController.cancelCheckout
);

/**
 * GET /api/checkout/:id
 * Get checkout details
 */
router.get(
  '/:id',
  validateParams(checkoutIdParamSchema),
  checkoutController.getCheckout
);

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /api/checkout/admin/list
 * List all checkouts
 */
router.get(
  '/admin/list',
  requireAdmin(),
  validateQuery(checkoutListQuerySchema),
  checkoutController.listCheckouts
);

/**
 * POST /api/checkout/admin/confirm-eft
 * Confirm EFT payment manually
 */
router.post(
  '/admin/confirm-eft',
  requireAdmin(),
  validateBody(confirmEFTSchema),
  checkoutController.confirmEFTPayment
);

export default router;
