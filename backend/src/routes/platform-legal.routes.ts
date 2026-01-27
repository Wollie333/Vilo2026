/**
 * Platform Legal Documents Routes
 *
 * API routes for managing platform-level legal documents
 */

import { Router } from 'express';
import { authenticate, validateBody } from '../middleware/index';
import { requireAnyUserType } from '../middleware/permissions.middleware';
import * as controller from '../controllers/platform-legal.controller';
import {
  createPlatformLegalDocumentSchema,
  updatePlatformLegalDocumentSchema,
} from '../validators/platform-legal.validators';

const router = Router();

// Admin routes (protected - super_admin OR saas_team_member)
const requireAdminAccess = requireAnyUserType(['super_admin', 'saas_team_member']);

/**
 * GET /api/admin/platform-legal/documents
 * List all platform legal documents (including inactive)
 */
router.get(
  '/admin/platform-legal/documents',
  authenticate,
  requireAdminAccess,
  controller.listAllDocuments
);

/**
 * GET /api/admin/platform-legal/documents/:id
 * Get single document by ID
 */
router.get(
  '/admin/platform-legal/documents/:id',
  authenticate,
  requireAdminAccess,
  controller.getDocument
);

/**
 * GET /api/admin/platform-legal/documents/type/:type
 * Get active document by type
 */
router.get(
  '/admin/platform-legal/documents/type/:type',
  authenticate,
  requireAdminAccess,
  controller.getDocumentByType
);

/**
 * GET /api/admin/platform-legal/documents/type/:type/versions
 * Get all versions of a document type
 */
router.get(
  '/admin/platform-legal/documents/type/:type/versions',
  authenticate,
  requireAdminAccess,
  controller.getDocumentVersions
);

/**
 * POST /api/admin/platform-legal/documents
 * Create new platform legal document
 */
router.post(
  '/admin/platform-legal/documents',
  authenticate,
  requireAdminAccess,
  validateBody(createPlatformLegalDocumentSchema),
  controller.createDocument
);

/**
 * PUT /api/admin/platform-legal/documents/:id
 * Update platform legal document
 */
router.put(
  '/admin/platform-legal/documents/:id',
  (req, res, next) => {
    console.log('🔵 [PLATFORM_LEGAL_ROUTES] PUT /:id - Route hit');
    console.log('🔵 [PLATFORM_LEGAL_ROUTES] Document ID:', req.params.id);
    console.log('🔵 [PLATFORM_LEGAL_ROUTES] Content-Type:', req.headers['content-type']);
    console.log('🔵 [PLATFORM_LEGAL_ROUTES] Body size:', JSON.stringify(req.body).length);
    next();
  },
  authenticate,
  (req, res, next) => {
    console.log('🔵 [PLATFORM_LEGAL_ROUTES] ✓ Authentication passed');
    next();
  },
  requireAdminAccess,
  (req, res, next) => {
    console.log('🔵 [PLATFORM_LEGAL_ROUTES] ✓ Admin access verified');
    next();
  },
  validateBody(updatePlatformLegalDocumentSchema),
  (req, res, next) => {
    console.log('🔵 [PLATFORM_LEGAL_ROUTES] ✓ Validation passed');
    next();
  },
  controller.updateDocument
);

/**
 * PUT /api/admin/platform-legal/documents/:id/activate
 * Activate a document version (deactivates other versions of same type)
 */
router.put(
  '/admin/platform-legal/documents/:id/activate',
  authenticate,
  requireAdminAccess,
  controller.activateDocument
);

/**
 * DELETE /api/admin/platform-legal/documents/:id
 * Delete (soft delete) platform legal document
 */
router.delete(
  '/admin/platform-legal/documents/:id',
  authenticate,
  requireAdminAccess,
  controller.deleteDocument
);

// ============================================================================
// PUBLIC ROUTES (NO AUTH REQUIRED)
// ============================================================================

/**
 * GET /api/platform-legal/active/:type
 * Get active document by type (public access for signup/login pages)
 */
router.get('/platform-legal/active/:type', controller.getActiveDocumentByType);

export default router;
