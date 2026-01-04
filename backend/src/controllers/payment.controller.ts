import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as paymentService from '../services/payment.service';
import { PaymentProvider } from '../types/payment.types';

// ============================================================================
// PAYMENT INTEGRATIONS
// ============================================================================

/**
 * GET /api/payment-integrations
 * List all payment integrations
 */
export const listIntegrations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const integrations = await paymentService.listIntegrations();

    // Generate webhook URLs based on current API URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const webhookUrls = paymentService.generateWebhookURLs(baseUrl);

    sendSuccess(res, { integrations, webhookUrls });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payment-integrations/:provider
 * Get single payment integration
 */
export const getIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const provider = req.params.provider as PaymentProvider;
    const integration = await paymentService.getIntegration(provider);

    // Generate webhook URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const webhookUrls = paymentService.generateWebhookURLs(baseUrl);

    sendSuccess(res, { integration, webhookUrls });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/payment-integrations/:provider
 * Update a payment integration
 */
export const updateIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const provider = req.params.provider as PaymentProvider;
    const integration = await paymentService.updateIntegration(
      provider,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { integration, message: 'Payment integration updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payment-integrations/:provider/test
 * Test connection to a payment provider
 */
export const testConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const provider = req.params.provider as PaymentProvider;
    const result = await paymentService.testConnection(provider, req.user!.id);
    sendSuccess(res, { result });
  } catch (error) {
    next(error);
  }
};
