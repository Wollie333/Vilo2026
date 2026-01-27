/**
 * Company WhatsApp Configuration Controller
 * HTTP request handlers for WhatsApp config API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as companyWhatsAppConfigService from '../services/company-whatsapp-config.service';
import { AppError } from '../utils/errors';
import type { UpsertWhatsAppConfigDTO } from '../types/company-whatsapp-config.types';

/**
 * Get WhatsApp configuration for a company
 * GET /api/company-whatsapp-config/:companyId
 */
export const getCompanyWhatsAppConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      throw new AppError('VALIDATION_ERROR', 'Company ID is required');
    }

    const config = await companyWhatsAppConfigService.getCompanyWhatsAppConfig(companyId);

    res.json({
      success: true,
      data: {
        config,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update WhatsApp configuration
 * PUT /api/company-whatsapp-config/:companyId
 */
export const upsertCompanyWhatsAppConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;
    const input: UpsertWhatsAppConfigDTO = req.body;

    if (!companyId) {
      throw new AppError('VALIDATION_ERROR', 'Company ID is required');
    }

    if (!req.user?.id) {
      throw new AppError('UNAUTHORIZED', 'User ID not found');
    }

    // Validate input
    if (!input.phone_number_id) {
      throw new AppError('VALIDATION_ERROR', 'Phone Number ID is required');
    }

    if (!input.access_token) {
      throw new AppError('VALIDATION_ERROR', 'Access Token is required');
    }

    // Create or update config
    const config = await companyWhatsAppConfigService.upsertCompanyWhatsAppConfig(
      companyId,
      input,
      req.user.id
    );

    res.json({
      success: true,
      data: {
        config,
        message: 'WhatsApp configuration saved successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test WhatsApp API connection
 * POST /api/company-whatsapp-config/:companyId/test
 */
export const testConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      throw new AppError('VALIDATION_ERROR', 'Company ID is required');
    }

    const result = await companyWhatsAppConfigService.testWhatsAppConnection(companyId);

    res.json({
      success: true,
      data: {
        result,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle WhatsApp configuration active status
 * PATCH /api/company-whatsapp-config/:companyId/toggle
 */
export const toggleConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { is_active } = req.body;

    if (!companyId) {
      throw new AppError('VALIDATION_ERROR', 'Company ID is required');
    }

    if (typeof is_active !== 'boolean') {
      throw new AppError('VALIDATION_ERROR', 'is_active must be a boolean');
    }

    await companyWhatsAppConfigService.toggleWhatsAppConfig(companyId, is_active);

    res.json({
      success: true,
      data: {
        message: `WhatsApp configuration ${is_active ? 'enabled' : 'disabled'} successfully`,
        is_active,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete WhatsApp configuration
 * DELETE /api/company-whatsapp-config/:companyId
 */
export const deleteConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      throw new AppError('VALIDATION_ERROR', 'Company ID is required');
    }

    if (!req.user?.id) {
      throw new AppError('UNAUTHORIZED', 'User ID not found');
    }

    await companyWhatsAppConfigService.deleteCompanyWhatsAppConfig(companyId, req.user.id);

    res.json({
      success: true,
      data: {
        message: 'WhatsApp configuration deleted successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};
