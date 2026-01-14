/**
 * Company Controller
 * HTTP request handlers for company management endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as companyService from '../services/company.service';
import {
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyListParams,
} from '../types/company.types';

// ============================================================================
// List Companies
// ============================================================================

/**
 * GET /api/companies
 * Get all companies for the current user
 */
export const listCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: CompanyListParams = {
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as 'name' | 'created_at' | 'updated_at' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await companyService.listUserCompanies(req.user!.id, params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Get Single Company
// ============================================================================

/**
 * GET /api/companies/:id
 * Get a single company by ID
 */
export const getCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const company = await companyService.getCompanyById(id, req.user!.id);
    sendSuccess(res, company);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Create Company
// ============================================================================

/**
 * POST /api/companies
 * Create a new company
 */
export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: CreateCompanyRequest = req.body;
    const company = await companyService.createCompany(req.user!.id, input);
    sendSuccess(res, company, 201);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Update Company
// ============================================================================

/**
 * PUT /api/companies/:id
 * Update a company
 */
export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: UpdateCompanyRequest = req.body;
    const company = await companyService.updateCompany(id, req.user!.id, input);
    sendSuccess(res, company);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/:id
 * Partial update a company (same as PUT but more RESTful for partial updates)
 */
export const patchCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: UpdateCompanyRequest = req.body;
    const company = await companyService.updateCompany(id, req.user!.id, input);
    sendSuccess(res, company);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Delete Company
// ============================================================================

/**
 * DELETE /api/companies/:id
 * Delete a company
 */
export const deleteCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await companyService.deleteCompany(id, req.user!.id);
    sendSuccess(res, { message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Company Limit Info
// ============================================================================

/**
 * GET /api/companies/limit
 * Get the company limit info for the current user
 */
export const getCompanyLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limitInfo = await companyService.getCompanyLimitInfo(req.user!.id);
    sendSuccess(res, limitInfo);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Company Properties
// ============================================================================

/**
 * GET /api/companies/:id/properties
 * Get all properties for a company
 */
export const getCompanyProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const properties = await companyService.getCompanyProperties(id, req.user!.id);
    sendSuccess(res, properties);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies/:id/properties/:propertyId
 * Link a property to a company
 */
export const linkProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, propertyId } = req.params;
    await companyService.linkPropertyToCompany(propertyId, id, req.user!.id);
    sendSuccess(res, { message: 'Property linked to company successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/companies/:id/properties/:propertyId
 * Unlink a property from a company
 */
export const unlinkProperty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    await companyService.unlinkPropertyFromCompany(propertyId, req.user!.id);
    sendSuccess(res, { message: 'Property unlinked from company successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Logo Upload
// ============================================================================

/**
 * POST /api/companies/:id/logo
 * Upload company logo
 */
export const uploadLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' },
      });
      return;
    }

    const logoUrl = await companyService.uploadLogo(id, req.user!.id, req.file);
    sendSuccess(res, { logoUrl, message: 'Logo uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Company Invoice Settings
// ============================================================================

/**
 * GET /api/companies/:id/invoice-settings
 * Get invoice settings for a company
 */
export const getCompanyInvoiceSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await companyService.getCompanyInvoiceSettings(id, req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/companies/:id/invoice-settings
 * Create or update invoice settings for a company
 */
export const updateCompanyInvoiceSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input = req.body;
    const settings = await companyService.createOrUpdateCompanyInvoiceSettings(
      id,
      req.user!.id,
      input
    );
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies/:id/invoice-settings/logo
 * Upload company invoice logo
 */
export const uploadCompanyInvoiceLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' },
      });
      return;
    }

    const logoUrl = await companyService.uploadCompanyInvoiceLogo(id, req.user!.id, req.file);
    sendSuccess(res, { logoUrl, message: 'Invoice logo uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/companies/:id/invoice-settings/logo
 * Delete company invoice logo
 */
export const deleteCompanyInvoiceLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await companyService.deleteCompanyInvoiceLogo(id, req.user!.id);
    sendSuccess(res, { message: 'Invoice logo deleted successfully' });
  } catch (error) {
    next(error);
  }
};
