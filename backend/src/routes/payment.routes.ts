import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import {
  authenticate,
  loadUserProfile,
  requireSuperAdmin,
} from '../middleware';

const router = Router();

// All routes require authentication and super admin
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// PAYMENT INTEGRATIONS
// ============================================================================

// List all payment integrations
router.get(
  '/',
  requireSuperAdmin(),
  paymentController.listIntegrations
);

// Get single payment integration
router.get(
  '/:provider',
  requireSuperAdmin(),
  paymentController.getIntegration
);

// Update payment integration
router.patch(
  '/:provider',
  requireSuperAdmin(),
  paymentController.updateIntegration
);

// Test connection to payment provider
router.post(
  '/:provider/test',
  requireSuperAdmin(),
  paymentController.testConnection
);

export default router;
