import { Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as creditMemoService from '../services/credit-memo.service';
import type { CreditMemoListParams } from '../types/credit-memo.types';

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * Get credit memo details
 * GET /api/credit-memos/:id
 */
export const getCreditMemo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const creditMemo = await creditMemoService.getCreditMemo(id, userId);

    res.json({
      success: true,
      data: creditMemo,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching credit memo:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get credit memo download URL
 * GET /api/credit-memos/:id/download
 */
export const downloadCreditMemo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const downloadUrl = await creditMemoService.getCreditMemoDownloadUrl(id, userId);

    res.json({
      success: true,
      data: downloadUrl,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error generating download URL:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * List all credit memos (admin)
 * GET /api/admin/credit-memos
 */
export const listCreditMemos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const params: CreditMemoListParams = {
      status: req.query.status as any,
      property_id: req.query.property_id as string,
      user_id: req.query.user_id as string,
      booking_id: req.query.booking_id as string,
      invoice_id: req.query.invoice_id as string,
      refund_request_id: req.query.refund_request_id as string,
      from_date: req.query.from_date as string,
      to_date: req.query.to_date as string,
      min_amount_cents: req.query.min_amount_cents
        ? parseInt(req.query.min_amount_cents as string)
        : undefined,
      max_amount_cents: req.query.max_amount_cents
        ? parseInt(req.query.max_amount_cents as string)
        : undefined,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as any) || 'created_at',
      sortOrder: (req.query.sortOrder as any) || 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await creditMemoService.listCreditMemos(params, userId);

    res.json({
      success: true,
      data: result.credit_memos,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error listing credit memos:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Void a credit memo
 * POST /api/admin/credit-memos/:id/void
 */
export const voidCreditMemo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const reason = req.body.reason;

    const creditMemo = await creditMemoService.voidCreditMemo(id, userId, reason);

    res.json({
      success: true,
      data: creditMemo,
      message: 'Credit memo voided successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error voiding credit memo:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Regenerate PDF for credit memo
 * POST /api/admin/credit-memos/:id/regenerate-pdf
 */
export const regeneratePDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const pdfUrl = await creditMemoService.regenerateCreditMemoPDF(id, userId);

    res.json({
      success: true,
      data: {
        pdf_url: pdfUrl,
        credit_memo_id: id,
      },
      message: 'PDF regenerated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error regenerating PDF:', error instanceof Error ? { message: error.message, stack: error.stack } : { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Generate credit memo for refund request (admin manual trigger)
 * POST /api/admin/refunds/:refundId/generate-credit-memo
 */
export const generateCreditMemo = async (req: Request, res: Response) => {
  try {
    const { refundId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const creditMemo = await creditMemoService.generateCreditMemo(refundId, userId);

    res.json({
      success: true,
      data: creditMemo,
      message: 'Credit memo generated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error generating credit memo:', error instanceof Error ? { message: error.message, stack: error.stack } : { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};
