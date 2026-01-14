/**
 * Company Routes
 * Route definitions for company management endpoints.
 */

import { Router, RequestHandler } from 'express';
import multer from 'multer';
import * as companyController from '../controllers/company.controller';
import {
  authenticate,
  loadUserProfile,
  validateBody,
  validateParams,
} from '../middleware';
import {
  createCompanySchema,
  updateCompanySchema,
  companyIdParamSchema,
  propertyIdParamSchema,
} from '../validators/company.validators';

const router = Router();

// Configure multer for logo uploads
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// Company Limit Route (must be before :id route)
// ============================================================================

/**
 * GET /api/companies/limit
 * Get company limit info for current user
 */
router.get('/limit', companyController.getCompanyLimit);

// ============================================================================
// Company CRUD Routes
// ============================================================================

/**
 * GET /api/companies
 * List all companies for current user
 */
router.get('/', companyController.listCompanies);

/**
 * GET /api/companies/:id
 * Get a single company by ID
 */
router.get(
  '/:id',
  validateParams(companyIdParamSchema),
  companyController.getCompany
);

/**
 * POST /api/companies
 * Create a new company
 */
router.post(
  '/',
  validateBody(createCompanySchema),
  companyController.createCompany
);

/**
 * PUT /api/companies/:id
 * Update a company
 */
router.put(
  '/:id',
  validateParams(companyIdParamSchema),
  validateBody(updateCompanySchema),
  companyController.updateCompany
);

/**
 * PATCH /api/companies/:id
 * Partial update a company
 */
router.patch(
  '/:id',
  validateParams(companyIdParamSchema),
  validateBody(updateCompanySchema),
  companyController.patchCompany
);

/**
 * DELETE /api/companies/:id
 * Delete a company
 */
router.delete(
  '/:id',
  validateParams(companyIdParamSchema),
  companyController.deleteCompany
);

// ============================================================================
// Company Logo Upload
// ============================================================================

/**
 * POST /api/companies/:id/logo
 * Upload company logo
 */
router.post(
  '/:id/logo',
  validateParams(companyIdParamSchema),
  logoUpload.single('logo') as unknown as RequestHandler,
  companyController.uploadLogo
);

// ============================================================================
// Company Properties Routes
// ============================================================================

/**
 * GET /api/companies/:id/properties
 * Get all properties for a company
 */
router.get(
  '/:id/properties',
  validateParams(companyIdParamSchema),
  companyController.getCompanyProperties
);

/**
 * POST /api/companies/:id/properties/:propertyId
 * Link a property to a company
 */
router.post(
  '/:id/properties/:propertyId',
  validateParams(propertyIdParamSchema),
  companyController.linkProperty
);

/**
 * DELETE /api/companies/:id/properties/:propertyId
 * Unlink a property from a company
 */
router.delete(
  '/:id/properties/:propertyId',
  validateParams(propertyIdParamSchema),
  companyController.unlinkProperty
);

// ============================================================================
// Company Invoice Settings Routes
// ============================================================================

/**
 * GET /api/companies/:id/invoice-settings
 * Get invoice settings for a company (with fallback indicator)
 */
router.get(
  '/:id/invoice-settings',
  validateParams(companyIdParamSchema),
  companyController.getCompanyInvoiceSettings
);

/**
 * PUT /api/companies/:id/invoice-settings
 * Create or update invoice settings for a company
 */
router.put(
  '/:id/invoice-settings',
  validateParams(companyIdParamSchema),
  companyController.updateCompanyInvoiceSettings
);

/**
 * POST /api/companies/:id/invoice-settings/logo
 * Upload company invoice logo
 */
router.post(
  '/:id/invoice-settings/logo',
  validateParams(companyIdParamSchema),
  logoUpload.single('logo') as unknown as RequestHandler,
  companyController.uploadCompanyInvoiceLogo
);

/**
 * DELETE /api/companies/:id/invoice-settings/logo
 * Delete company invoice logo
 */
router.delete(
  '/:id/invoice-settings/logo',
  validateParams(companyIdParamSchema),
  companyController.deleteCompanyInvoiceLogo
);

export default router;
