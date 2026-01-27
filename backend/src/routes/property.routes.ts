/**
 * Property Routes
 * Route definitions for property management endpoints.
 */

import { Router, RequestHandler } from 'express';
import multer from 'multer';
import * as propertyController from '../controllers/property.controller';
import {
  authenticate,
  loadUserProfile,
  validateBody,
  validateParams,
} from '../middleware';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyIdParamSchema,
} from '../validators/property.validators';

// Configure multer for property image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * GET /api/properties/:id/terms/pdf
 * Download Terms & Conditions as PDF
 * Public endpoint - accessible without authentication
 */
router.get(
  '/:id/terms/pdf',
  validateParams(propertyIdParamSchema),
  propertyController.downloadTermsPDF
);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

// All routes below require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// Property Limit Route (must be before :id route)
// ============================================================================

/**
 * GET /api/properties/limit
 * Get property limit info for current user
 */
router.get('/limit', propertyController.getPropertyLimit);

// ============================================================================
// Property CRUD Routes
// ============================================================================

/**
 * GET /api/properties
 * List all properties for current user
 */
router.get('/', propertyController.listProperties);

/**
 * GET /api/properties/:id
 * Get a single property by ID
 */
router.get(
  '/:id',
  validateParams(propertyIdParamSchema),
  propertyController.getProperty
);

/**
 * POST /api/properties
 * Create a new property
 */
router.post(
  '/',
  validateBody(createPropertySchema),
  propertyController.createProperty
);

/**
 * PUT /api/properties/:id
 * Update a property
 */
router.put(
  '/:id',
  validateParams(propertyIdParamSchema),
  validateBody(updatePropertySchema),
  propertyController.updateProperty
);

/**
 * PATCH /api/properties/:id
 * Partial update a property
 */
router.patch(
  '/:id',
  validateParams(propertyIdParamSchema),
  validateBody(updatePropertySchema),
  propertyController.patchProperty
);

/**
 * DELETE /api/properties/:id
 * Delete a property
 */
router.delete(
  '/:id',
  validateParams(propertyIdParamSchema),
  propertyController.deleteProperty
);

// ============================================================================
// Property Image Upload Routes
// ============================================================================

/**
 * POST /api/properties/:id/featured-image
 * Upload a featured image for a property
 */
router.post(
  '/:id/featured-image',
  validateParams(propertyIdParamSchema),
  imageUpload.single('image') as unknown as RequestHandler,
  propertyController.uploadFeaturedImage
);

/**
 * DELETE /api/properties/:id/featured-image
 * Delete the featured image for a property
 */
router.delete(
  '/:id/featured-image',
  validateParams(propertyIdParamSchema),
  propertyController.deleteFeaturedImage
);

/**
 * POST /api/properties/:id/logo
 * Upload a logo for a property
 */
router.post(
  '/:id/logo',
  validateParams(propertyIdParamSchema),
  imageUpload.single('image') as unknown as RequestHandler,
  propertyController.uploadLogo
);

/**
 * DELETE /api/properties/:id/logo
 * Delete the logo for a property
 */
router.delete(
  '/:id/logo',
  validateParams(propertyIdParamSchema),
  propertyController.deleteLogo
);

// ============================================================================
// Gallery Image Routes
// ============================================================================

/**
 * POST /api/properties/:id/gallery-image
 * Upload a gallery image for a property
 */
router.post(
  '/:id/gallery-image',
  validateParams(propertyIdParamSchema),
  imageUpload.single('image') as unknown as RequestHandler,
  propertyController.uploadGalleryImage
);

/**
 * DELETE /api/properties/:id/gallery-image
 * Delete a gallery image for a property
 */
router.delete(
  '/:id/gallery-image',
  validateParams(propertyIdParamSchema),
  propertyController.deleteGalleryImage
);

// ============================================================================
// Public Listing Routes
// ============================================================================

/**
 * GET /api/properties/:id/listing-readiness
 * Check if property meets requirements for public listing
 */
router.get(
  '/:id/listing-readiness',
  validateParams(propertyIdParamSchema),
  propertyController.checkListingReadiness
);

/**
 * PATCH /api/properties/:id/public-listing
 * Toggle public listing visibility
 */
router.patch(
  '/:id/public-listing',
  validateParams(propertyIdParamSchema),
  propertyController.togglePublicListing
);

export default router;
