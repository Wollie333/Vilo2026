import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
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
    const settings = await invoiceService.getInvoiceSettings();
    sendSuccess(res, { settings });
  } catch (error) {
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
    const settings = await invoiceService.updateInvoiceSettings(req.body, req.user!.id);
    sendSuccess(res, { settings });
  } catch (error) {
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
    if (!req.file) {
      throw new AppError('BAD_REQUEST', 'No file uploaded');
    }

    const logoUrl = await invoiceService.uploadInvoiceLogo(req.file, req.user!.id);
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
    await invoiceService.deleteInvoiceLogo(req.user!.id);
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
