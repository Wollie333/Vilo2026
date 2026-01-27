import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as invoiceService from '../services/invoice.service';
import type { InvoiceListParams, InvoiceStatus } from '../types/invoice.types';

// ============================================================================
// USER INVOICE ENDPOINTS
// ============================================================================

/**
 * GET /api/invoices/my-invoices
 * List current user's invoices
 */
export const getMyInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: InvoiceListParams = {
      status: req.query.status as InvoiceStatus | undefined,
      from_date: req.query.from_date as string | undefined,
      to_date: req.query.to_date as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      sortBy: req.query.sortBy as 'created_at' | 'invoice_number' | 'total_cents' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await invoiceService.listUserInvoices(req.user!.id, params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/invoices/:id
 * Get a single invoice (user can only access their own)
 */
export const getInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isAdmin = req.userProfile?.roles?.some(r => ['admin', 'super_admin'].includes(r.name));

    // If admin, don't pass userId to allow access to any invoice
    const invoice = await invoiceService.getInvoice(
      req.params.id,
      isAdmin ? undefined : req.user!.id
    );

    sendSuccess(res, { invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/invoices/:id/download
 * Get signed download URL for invoice PDF
 */
export const downloadInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const isAdmin = req.userProfile?.roles?.some(r => ['admin', 'super_admin'].includes(r.name));

    const downloadUrl = await invoiceService.getInvoiceDownloadUrl(
      req.params.id,
      isAdmin ? undefined : req.user!.id
    );

    sendSuccess(res, { download_url: downloadUrl });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN INVOICE ENDPOINTS
// ============================================================================

/**
 * GET /api/invoices/admin/settings
 * Get invoice settings (admin only)
 */
export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('[INVOICE_SETTINGS] GET request received', {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRoles: req.userProfile?.roles?.map(r => r.name),
    });

    const settings = await invoiceService.getInvoiceSettings();

    logger.info('[INVOICE_SETTINGS] Successfully retrieved settings', {
      settingsId: settings.id,
      companyName: settings.company_name,
      hasLogo: !!settings.logo_url,
    });

    sendSuccess(res, { settings });
  } catch (error) {
    logger.error('[INVOICE_SETTINGS] Error getting settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    next(error);
  }
};

/**
 * PATCH /api/invoices/admin/settings
 * Update invoice settings (admin only)
 */
export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('[INVOICE_SETTINGS] PATCH request received', {
      userId: req.user?.id,
      userEmail: req.user?.email,
      fieldsToUpdate: Object.keys(req.body),
    });

    const settings = await invoiceService.updateInvoiceSettings(req.body, req.user!.id);

    logger.info('[INVOICE_SETTINGS] Successfully updated settings', {
      settingsId: settings.id,
      userId: req.user?.id,
    });

    sendSuccess(res, { settings });
  } catch (error) {
    logger.error('[INVOICE_SETTINGS] Error updating settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      body: req.body,
    });
    next(error);
  }
};

/**
 * GET /api/invoices/admin/list
 * List all invoices (admin only)
 */
export const listAllInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: InvoiceListParams = {
      user_id: req.query.user_id as string | undefined,
      status: req.query.status as InvoiceStatus | undefined,
      from_date: req.query.from_date as string | undefined,
      to_date: req.query.to_date as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      sortBy: req.query.sortBy as 'created_at' | 'invoice_number' | 'total_cents' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await invoiceService.listAllInvoices(params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/invoices/admin/:id/void
 * Void an invoice (admin only)
 */
export const voidInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invoice = await invoiceService.voidInvoice(req.params.id, req.user!.id);
    sendSuccess(res, { invoice });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/invoices/admin/:id/regenerate-pdf
 * Regenerate PDF for an invoice (admin only)
 */
export const regeneratePDF = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pdfUrl = await invoiceService.regenerateInvoicePDF(req.params.id, req.user!.id);
    sendSuccess(res, { pdf_url: pdfUrl, message: 'PDF regenerated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/invoices/admin/logo
 * Upload invoice logo (admin only)
 */
export const uploadLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('[INVOICE_LOGO] Upload request received', {
      userId: req.user?.id,
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
    });

    if (!req.file) {
      throw new AppError('BAD_REQUEST', 'No file uploaded');
    }

    const logoUrl = await invoiceService.uploadInvoiceLogo(req.file, req.user!.id);

    logger.info('[INVOICE_LOGO] Successfully uploaded logo', {
      userId: req.user?.id,
      logoUrl,
    });
    sendSuccess(res, { logo_url: logoUrl, message: 'Logo uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/invoices/admin/logo
 * Delete invoice logo (admin only)
 */
export const deleteLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('[INVOICE_LOGO] Delete request received', {
      userId: req.user?.id,
    });

    await invoiceService.deleteInvoiceLogo(req.user!.id);

    logger.info('[INVOICE_LOGO] Successfully deleted logo', {
      userId: req.user?.id,
    });
    sendSuccess(res, { message: 'Logo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/invoices/admin/bookings/:bookingId/generate
 * Manually generate invoice for a paid booking (admin only)
 */
export const generateBookingInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const invoice = await invoiceService.manuallyGenerateBookingInvoice(bookingId, req.user!.id);
    sendSuccess(res, {
      invoice,
      message: 'Invoice generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/invoices/admin/checkouts/:checkoutId/generate
 * Manually generate invoice for a completed checkout
 */
export const generateCheckoutInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { checkoutId } = req.params;
    const invoice = await invoiceService.generateInvoice(checkoutId);
    sendSuccess(res, {
      invoice,
      message: 'Invoice generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// TYPE-SPECIFIC INVOICE ENDPOINTS
// ============================================================================

/**
 * GET /api/invoices/subscription
 * Get subscription invoices for current user (SaaS billing)
 * Returns invoices where the user is the payer (subscription owner)
 */
export const getSubscriptionInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const invoices = await invoiceService.getUserSubscriptionInvoices(userId);
    sendSuccess(res, invoices);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/invoices/booking/issued
 * Get booking invoices issued by current user (property owner perspective)
 * Returns invoices where the user is the issuer (property owner)
 */
export const getIssuedBookingInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const invoices = await invoiceService.getPropertyOwnerBookingInvoices(userId);
    sendSuccess(res, invoices);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/invoices/booking/received
 * Get booking invoices received by current user (guest perspective)
 * Returns invoices for bookings where the user is the guest
 */
export const getReceivedBookingInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const invoices = await invoiceService.getGuestBookingInvoices(userId);
    sendSuccess(res, invoices);
  } catch (error) {
    next(error);
  }
};
