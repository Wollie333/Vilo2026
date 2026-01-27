/**
 * Company WhatsApp Configuration Routes
 * API endpoints for managing per-company WhatsApp Business API credentials
 */

import { Router } from 'express';
import { authenticate, loadUserProfile } from '../middleware/auth.middleware';
import { requireCompanyOwnership } from '../middleware/rbac.middleware';
import * as controller from '../controllers/company-whatsapp-config.controller';

const router = Router();

// All routes require authentication and user profile
router.use(authenticate);
router.use(loadUserProfile);

/**
 * GET /api/company-whatsapp-config/:companyId
 * Get WhatsApp configuration for a company
 * Returns public version (no encrypted credentials)
 */
router.get(
  '/:companyId',
  requireCompanyOwnership,
  controller.getCompanyWhatsAppConfig
);

/**
 * PUT /api/company-whatsapp-config/:companyId
 * Create or update WhatsApp configuration
 * Encrypts credentials before storing
 */
router.put(
  '/:companyId',
  requireCompanyOwnership,
  controller.upsertCompanyWhatsAppConfig
);

/**
 * POST /api/company-whatsapp-config/:companyId/test
 * Test WhatsApp API connection
 * Verifies credentials with Meta API
 */
router.post(
  '/:companyId/test',
  requireCompanyOwnership,
  controller.testConnection
);

/**
 * PATCH /api/company-whatsapp-config/:companyId/toggle
 * Toggle WhatsApp configuration active status
 */
router.patch(
  '/:companyId/toggle',
  requireCompanyOwnership,
  controller.toggleConfig
);

/**
 * DELETE /api/company-whatsapp-config/:companyId
 * Delete WhatsApp configuration
 * Removes all credentials from database
 */
router.delete(
  '/:companyId',
  requireCompanyOwnership,
  controller.deleteConfig
);

export default router;
