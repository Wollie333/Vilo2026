/**
 * Property Controller
 * HTTP request handlers for property management endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as propertyService from '../services/property.service';
import * as pdfService from '../services/pdf.service';
import {
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertyListParams,
} from '../types/property.types';
import { AppError } from '../utils/errors';

// ============================================================================
// List Properties
// ============================================================================

/**
 * GET /api/properties
 * Get all properties for the current user
 */
export const listProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: PropertyListParams = {
      company_id: req.query.company_id as string | undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as 'name' | 'created_at' | 'updated_at' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await propertyService.listUserProperties(req.user!.id, params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Get Single Property
// ============================================================================

/**
 * GET /api/properties/:id
 * Get a single property by ID
 */
export const getProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id, req.user!.id);
    sendSuccess(res, property);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Create Property
// ============================================================================

/**
 * POST /api/properties
 * Create a new property
 */
export const createProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: CreatePropertyRequest = req.body;
    const property = await propertyService.createProperty(req.user!.id, input);
    sendSuccess(res, property, 201);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Update Property
// ============================================================================

/**
 * PUT /api/properties/:id
 * Update a property
 */
export const updateProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: UpdatePropertyRequest = req.body;
    const property = await propertyService.updateProperty(id, req.user!.id, input);
    sendSuccess(res, property);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/properties/:id
 * Partial update a property (same as PUT but more RESTful for partial updates)
 */
export const patchProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: UpdatePropertyRequest = req.body;

    // DEBUG: Log what controller received
    console.log('\n🎯 CONTROLLER received PATCH /properties/:id');
    console.log('  - Property ID:', id);
    console.log('  - Body keys:', Object.keys(req.body));
    if (req.body.terms_and_conditions) {
      console.log('  - terms_and_conditions in req.body:', req.body.terms_and_conditions.length, 'chars');
    } else {
      console.log('  - terms_and_conditions in req.body: NOT PRESENT');
    }
    console.log('  - Input keys:', Object.keys(input));
    if (input.terms_and_conditions) {
      console.log('  - terms_and_conditions in input:', input.terms_and_conditions.length, 'chars');
    } else {
      console.log('  - terms_and_conditions in input: NOT PRESENT');
    }

    const property = await propertyService.updateProperty(id, req.user!.id, input);
    sendSuccess(res, property);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Delete Property
// ============================================================================

/**
 * DELETE /api/properties/:id
 * Delete a property
 */
export const deleteProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await propertyService.deleteProperty(id, req.user!.id);
    sendSuccess(res, { message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Property Limit Info
// ============================================================================

/**
 * GET /api/properties/limit
 * Get the property limit info for the current user
 */
export const getPropertyLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limitInfo = await propertyService.getPropertyLimitInfo(req.user!.id);
    sendSuccess(res, limitInfo);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Property Image Upload
// ============================================================================

/**
 * POST /api/properties/:id/featured-image
 * Upload a featured image for a property
 */
export const uploadFeaturedImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
      });
      return;
    }

    const imageUrl = await propertyService.uploadFeaturedImage(
      req.params.id,
      req.user!.id,
      req.file
    );
    sendSuccess(res, { imageUrl, message: 'Featured image uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/properties/:id/featured-image
 * Delete the featured image for a property
 */
export const deleteFeaturedImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await propertyService.deleteFeaturedImage(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Featured image deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/properties/:id/logo
 * Upload a logo for a property
 */
export const uploadLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
      });
      return;
    }

    const imageUrl = await propertyService.uploadLogo(
      req.params.id,
      req.user!.id,
      req.file
    );
    sendSuccess(res, { imageUrl, message: 'Logo uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/properties/:id/logo
 * Delete the logo for a property
 */
export const deleteLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await propertyService.deleteLogo(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Logo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Gallery Image Upload
// ============================================================================

/**
 * POST /api/properties/:id/gallery-image
 * Upload a gallery image for a property
 */
export const uploadGalleryImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
      });
      return;
    }

    const imageUrl = await propertyService.uploadGalleryImage(
      req.params.id,
      req.user!.id,
      req.file
    );
    sendSuccess(res, { imageUrl, message: 'Gallery image uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/properties/:id/gallery-image
 * Delete a gallery image for a property
 */
export const deleteGalleryImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No imageUrl provided' },
      });
      return;
    }

    await propertyService.deleteGalleryImage(req.params.id, req.user!.id, imageUrl);
    sendSuccess(res, { message: 'Gallery image deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Public Listing Management
// ============================================================================

/**
 * GET /api/properties/:id/listing-readiness
 * Check if property meets requirements for public listing
 */
export const checkListingReadiness = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const readiness = await propertyService.checkListingReadiness(req.params.id);
    sendSuccess(res, readiness);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/properties/:id/public-listing
 * Toggle public listing visibility
 */
export const togglePublicListing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { is_listed } = req.body;

    if (typeof is_listed !== 'boolean') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'is_listed must be a boolean' },
      });
      return;
    }

    await propertyService.togglePublicListing(
      req.params.id,
      req.user!.id,
      is_listed
    );

    sendSuccess(res, {
      message: is_listed
        ? 'Property is now publicly listed'
        : 'Property removed from public listing',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Terms & Conditions PDF Download
// ============================================================================

/**
 * GET /api/properties/:id/terms/pdf
 * Download Terms & Conditions as PDF
 */
export const downloadTermsPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const propertyId = req.params.id;

    // Get property (no user check - public access to terms)
    const property = await propertyService.getProperty(propertyId);

    if (!property) {
      throw new AppError('NOT_FOUND', 'Property not found');
    }

    if (!property.terms_and_conditions) {
      throw new AppError('NOT_FOUND', 'No terms and conditions available for this property');
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generateTermsPDF(
      property.terms_and_conditions,
      property.name
    );

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Terms-${property.slug}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
