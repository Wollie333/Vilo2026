import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as companyPaymentService from '../services/company-payment-integration.service';
import { PaymentProvider } from '../types/payment.types';
import { AppError } from '../utils/errors';

// ============================================================================
// COMPANY PAYMENT INTEGRATIONS
// ============================================================================

/**
 * GET /api/company-payment-integrations/:companyId
 * List all payment integrations for a company
 */
export const listCompanyIntegrations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;

    // Verify user owns this company (via middleware already checked)
    const response = await companyPaymentService.listCompanyIntegrations(companyId);

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/company-payment-integrations/:companyId/:provider
 * Get single payment integration for a company
 */
export const getCompanyIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId, provider } = req.params;

    const integration = await companyPaymentService.getCompanyIntegration(
      companyId,
      provider as PaymentProvider
    );

    sendSuccess(res, { integration });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/company-payment-integrations/:companyId/:provider
 * Create or update a payment integration for a company
 */
export const upsertCompanyIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== [PAYMENT_INTEGRATION_CONTROLLER] upsertCompanyIntegration called ===');
    const { companyId, provider } = req.params;
    console.log('[PAYMENT_INTEGRATION_CONTROLLER] Company ID:', companyId);
    console.log('[PAYMENT_INTEGRATION_CONTROLLER] Provider:', provider);
    console.log('[PAYMENT_INTEGRATION_CONTROLLER] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[PAYMENT_INTEGRATION_CONTROLLER] User ID:', req.user?.id);

    const integration = await companyPaymentService.upsertCompanyIntegration(
      companyId,
      provider as PaymentProvider,
      req.body,
      req.user!.id
    );

    console.log('[PAYMENT_INTEGRATION_CONTROLLER] Success - Integration saved:', integration.id);
    sendSuccess(res, { integration, message: 'Payment integration saved successfully' });
  } catch (error) {
    console.error('[PAYMENT_INTEGRATION_CONTROLLER] Error occurred:', error);
    if (error instanceof AppError) {
      console.error('[PAYMENT_INTEGRATION_CONTROLLER] AppError details:', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/company-payment-integrations/:companyId/:provider/toggle
 * Toggle payment integration enabled/disabled
 */
export const toggleCompanyIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId, provider } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      throw new AppError('BAD_REQUEST', 'enabled field must be a boolean');
    }

    const integration = await companyPaymentService.toggleCompanyIntegration(
      companyId,
      provider as PaymentProvider,
      enabled,
      req.user!.id
    );

    sendSuccess(res, { integration, message: `Payment integration ${enabled ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/company-payment-integrations/:companyId/:provider/set-primary
 * Set payment integration as primary
 */
export const setPrimaryCompanyIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId, provider } = req.params;

    const integration = await companyPaymentService.setPrimaryCompanyIntegration(
      companyId,
      provider as PaymentProvider,
      req.user!.id
    );

    sendSuccess(res, { integration, message: 'Primary payment method updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/company-payment-integrations/:companyId/:provider
 * Delete a company payment integration
 */
export const deleteCompanyIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId, provider } = req.params;

    await companyPaymentService.deleteCompanyIntegration(
      companyId,
      provider as PaymentProvider,
      req.user!.id
    );

    sendSuccess(res, { message: 'Payment integration deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/company-payment-integrations/:companyId/:provider/test
 * Test connection to a payment provider
 */
export const testCompanyConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId, provider } = req.params;

    const result = await companyPaymentService.testCompanyConnection(
      companyId,
      provider as PaymentProvider,
      req.user!.id
    );

    sendSuccess(res, { result });
  } catch (error) {
    next(error);
  }
};
