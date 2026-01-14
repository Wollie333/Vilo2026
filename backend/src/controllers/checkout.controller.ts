import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as checkoutService from '../services/checkout.service';
import type { CheckoutStatus, PaymentProvider, CheckoutListParams } from '../types/checkout.types';

// ============================================================================
// PUBLIC CHECKOUT ENDPOINTS
// ============================================================================

/**
 * POST /api/checkout/initialize
 * Initialize a new checkout session
 */
export const initializeCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await checkoutService.initializeCheckout(req.user!.id, req.body);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/checkout/select-provider
 * Select a payment provider for the checkout
 */
export const selectProvider = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await checkoutService.selectPaymentProvider(req.user!.id, req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/checkout/verify
 * Verify payment and complete checkout
 */
export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== VERIFY CONTROLLER DEBUG ===');
    console.log('User:', req.user?.id);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    const result = await checkoutService.verifyPayment(req.user!.id, req.body);
    sendSuccess(res, result);
  } catch (error) {
    console.error('=== VERIFY CONTROLLER ERROR ===');
    console.error('Error:', error);
    next(error);
  }
};

/**
 * GET /api/checkout/payment-methods
 * Get available payment methods
 */
export const getPaymentMethods = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await checkoutService.getPaymentMethods();
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/checkout/cancel
 * Cancel a checkout session
 */
export const cancelCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await checkoutService.cancelCheckout(req.body.checkout_id, req.user!.id);
    sendSuccess(res, { message: 'Checkout cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/checkout/:id
 * Get checkout details
 */
export const getCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const checkout = await checkoutService.getCheckoutWithDetails(req.params.id);

    // Verify ownership (unless admin)
    const isAdmin = req.userProfile?.roles?.some(r => ['admin', 'super_admin'].includes(r.name));
    if (checkout.user_id !== req.user!.id && !isAdmin) {
      sendSuccess(res, { error: 'Forbidden' }, 403);
      return;
    }

    sendSuccess(res, { checkout });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /api/checkout/admin/list
 * List all checkouts (admin only)
 */
export const listCheckouts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: CheckoutListParams = {
      status: req.query.status as CheckoutStatus | undefined,
      payment_provider: req.query.payment_provider as PaymentProvider | undefined,
      user_id: req.query.user_id as string | undefined,
      from_date: req.query.from_date as string | undefined,
      to_date: req.query.to_date as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      sortBy: req.query.sortBy as 'created_at' | 'updated_at' | 'amount_cents' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await checkoutService.listCheckouts(params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/checkout/admin/confirm-eft
 * Confirm EFT payment (admin only)
 */
export const confirmEFTPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await checkoutService.confirmEFTPayment(req.body, req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
