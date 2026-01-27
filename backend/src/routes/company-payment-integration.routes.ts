import { Router } from 'express';
import * as companyPaymentController from '../controllers/company-payment-integration.controller';
import { authenticate, loadUserProfile, requireCompanyOwnership } from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// COMPANY PAYMENT INTEGRATIONS
// ============================================================================

// List all payment integrations for a company
router.get(
  '/:companyId',
  requireCompanyOwnership,
  companyPaymentController.listCompanyIntegrations
);

// Get single payment integration for a company
router.get(
  '/:companyId/:provider',
  requireCompanyOwnership,
  companyPaymentController.getCompanyIntegration
);

// Create or update payment integration for a company
router.put(
  '/:companyId/:provider',
  requireCompanyOwnership,
  companyPaymentController.upsertCompanyIntegration
);

// Toggle payment integration enabled/disabled
router.patch(
  '/:companyId/:provider/toggle',
  requireCompanyOwnership,
  companyPaymentController.toggleCompanyIntegration
);

// Set payment integration as primary
router.post(
  '/:companyId/:provider/set-primary',
  requireCompanyOwnership,
  companyPaymentController.setPrimaryCompanyIntegration
);

// Test connection to payment provider
router.post(
  '/:companyId/:provider/test',
  requireCompanyOwnership,
  companyPaymentController.testCompanyConnection
);

// Delete payment integration
router.delete(
  '/:companyId/:provider',
  requireCompanyOwnership,
  companyPaymentController.deleteCompanyIntegration
);

export default router;
