import { Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as refundService from '../services/refund.service';
import type {
  CreateRefundRequestDTO,
  ApproveRefundDTO,
  RejectRefundDTO,
  MarkManualRefundCompleteDTO,
  RefundListParams,
  CreateRefundCommentRequest,
  UploadRefundDocumentDTO,
} from '../types/refund.types';

// ============================================================================
// GUEST ENDPOINTS
// ============================================================================

/**
 * Create a new refund request
 * POST /api/bookings/:bookingId/refunds
 */
export const createRefundRequest = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const input: CreateRefundRequestDTO = {
      requested_amount: parseFloat(req.body.requested_amount),
      reason: req.body.reason,
    };

    // Validate input
    if (!input.requested_amount || input.requested_amount <= 0) {
      throw new AppError('VALIDATION_ERROR', 'Valid requested amount is required');
    }

    if (!input.reason || input.reason.trim().length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Refund reason is required');
    }

    const refundRequest = await refundService.createRefundRequest(bookingId, userId, input);

    res.status(201).json({
      success: true,
      data: refundRequest,
      message: 'Refund request created successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error creating refund request:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get refund requests for a booking
 * GET /api/bookings/:bookingId/refunds
 */
export const getBookingRefunds = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    const refunds = await refundService.listRefundRequests(
      { booking_id: bookingId },
      userId
    );

    res.json({
      success: true,
      data: refunds.refunds,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching booking refunds:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get refund request details
 * GET /api/refunds/:id
 */
export const getRefundDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const refundRequest = await refundService.getRefundRequestById(id, userId);

    res.json({
      success: true,
      data: refundRequest,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching refund details:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get refund status for a booking
 * GET /api/refunds/booking/:bookingId/status
 */
export const getRefundStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const status = await refundService.getRefundStatus(bookingId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching refund status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Calculate suggested refund amount
 * GET /api/bookings/:bookingId/refunds/calculate
 */
export const calculateSuggestedRefund = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const calculation = await refundService.calculateSuggestedRefund(bookingId);

    res.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error calculating suggested refund:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * List user's own refund requests
 * GET /api/refunds
 */
export const listMyRefunds = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const params: RefundListParams = {
      status: req.query.status as any,
      sortBy: (req.query.sortBy as any) || 'created_at',
      sortOrder: (req.query.sortOrder as any) || 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    // User endpoint - filter by userId to show only their refunds
    const result = await refundService.listRefundRequests(params, userId);

    res.json({
      success: true,
      data: result.refunds,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error);
      logger.error('Error listing user refunds', {
        error: errorMessage,
        stack: errorDetails,
        userId
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: errorMessage,
      });
    }
  }
};

/**
 * Withdraw a refund request
 * POST /api/refunds/:id/withdraw
 */
export const withdrawRefundRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const updatedRefund = await refundService.withdrawRefundRequest(id, userId);

    res.json({
      success: true,
      data: updatedRefund,
      message: 'Refund request withdrawn successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error withdrawing refund request:', error);
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
 * List all refund requests (admin)
 * GET /api/admin/refunds
 */
export const listRefunds = async (req: Request, res: Response) => {
  try {
    const params: RefundListParams = {
      status: req.query.status as any,
      property_id: req.query.property_id as string,
      booking_id: req.query.booking_id as string,
      from_date: req.query.from_date as string,
      to_date: req.query.to_date as string,
      min_amount: req.query.min_amount ? parseFloat(req.query.min_amount as string) : undefined,
      max_amount: req.query.max_amount ? parseFloat(req.query.max_amount as string) : undefined,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as any) || 'created_at',
      sortOrder: (req.query.sortOrder as any) || 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    // Admin endpoint - don't filter by userId, show all refunds
    const result = await refundService.listRefundRequests(params);

    res.json({
      success: true,
      data: result.refunds,
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
      logger.error('Error listing refunds:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get refund request details (admin)
 * GET /api/admin/refunds/:id
 */
export const getAdminRefundDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const refundRequest = await refundService.getRefundRequestById(id);

    res.json({
      success: true,
      data: refundRequest,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching admin refund details:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Approve a refund request
 * POST /api/admin/refunds/:id/approve
 */
export const approveRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const input: ApproveRefundDTO = {
      approved_amount: req.body.approved_amount
        ? parseFloat(req.body.approved_amount)
        : undefined,
      internal_notes: req.body.internal_notes,
      customer_notes: req.body.customer_notes,
    };

    const refundRequest = await refundService.approveRefund(id, userId, input);

    res.json({
      success: true,
      data: refundRequest,
      message: 'Refund request approved successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error approving refund:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Reject a refund request
 * POST /api/admin/refunds/:id/reject
 */
export const rejectRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const input: RejectRefundDTO = {
      customer_notes: req.body.customer_notes,
      internal_notes: req.body.internal_notes,
    };

    if (!input.customer_notes || input.customer_notes.trim().length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Customer notes are required for rejection');
    }

    const refundRequest = await refundService.rejectRefund(id, userId, input);

    res.json({
      success: true,
      data: refundRequest,
      message: 'Refund request rejected',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error rejecting refund:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Process a refund (automatic)
 * POST /api/admin/refunds/:id/process
 */
export const processRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const result = await refundService.processRefund(id, userId);

    res.json({
      success: result.success,
      data: result,
      message: result.message || 'Refund processing initiated',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Mark manual refund as complete
 * POST /api/admin/refunds/:id/mark-complete
 */
export const markManualRefundComplete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const input: MarkManualRefundCompleteDTO = {
      refund_reference: req.body.refund_reference,
      notes: req.body.notes,
    };

    if (!input.refund_reference || input.refund_reference.trim().length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Refund reference is required');
    }

    const refundRequest = await refundService.markManualRefundComplete(id, userId, input);

    res.json({
      success: true,
      data: refundRequest,
      message: 'Manual refund marked as complete',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error marking manual refund complete:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Retry failed refund
 * POST /api/admin/refunds/:id/retry
 */
export const retryFailedRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    // Re-process the refund
    const result = await refundService.processRefund(id, userId);

    res.json({
      success: result.success,
      data: result,
      message: result.message || 'Refund retry initiated',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error retrying refund:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// ============================================================================
// COMMENT SYSTEM ENDPOINTS
// ============================================================================

/**
 * Add a comment to a refund request
 * POST /api/refunds/:id/comments
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const data: CreateRefundCommentRequest = {
      comment_text: req.body.comment_text,
      is_internal: req.body.is_internal,
    };

    // Validate comment text
    if (!data.comment_text || data.comment_text.trim().length < 1) {
      throw new AppError('VALIDATION_ERROR', 'Comment text is required');
    }

    // Validate character limit (2000 chars max)
    if (data.comment_text.length > 2000) {
      throw new AppError('VALIDATION_ERROR', 'Comment exceeds maximum length of 2000 characters');
    }

    const comment = await refundService.addRefundComment(id, userId, data);

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error adding refund comment:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get all comments for a refund request
 * GET /api/refunds/:id/comments
 */
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const comments = await refundService.getRefundComments(id, userId);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching refund comments:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get activity feed (comments + status changes) for a refund
 * GET /api/refunds/:id/activity
 */
export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const activities = await refundService.getRefundActivityFeed(id, userId);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching refund activity feed:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get status history for a refund
 * GET /api/refunds/:id/history
 */
export const getStatusHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const history = await refundService.getRefundStatusHistory(id, userId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching refund status history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// ============================================================================
// DOCUMENT MANAGEMENT ENDPOINTS (Migration 046)
// ============================================================================

/**
 * Upload a document for a refund request
 * POST /api/refunds/:id/documents
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const file = req.file;
    if (!file) {
      throw new AppError('VALIDATION_ERROR', 'No file provided');
    }

    const data: UploadRefundDocumentDTO = {
      document_type: req.body.document_type,
      description: req.body.description,
    };

    // Validate document type
    const validTypes = ['receipt', 'proof_of_cancellation', 'bank_statement', 'other'];
    if (!data.document_type || !validTypes.includes(data.document_type)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid document type');
    }

    const document = await refundService.uploadRefundDocument(id, userId, file, data);

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get documents for a refund request
 * GET /api/refunds/:id/documents
 */
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const documents = await refundService.getRefundDocuments(id, userId);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error fetching documents:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Delete a document
 * DELETE /api/refunds/:id/documents/:docId
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    await refundService.deleteRefundDocument(docId, userId);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Verify a document (Admin only)
 * POST /api/admin/refunds/:id/documents/:docId/verify
 */
export const verifyDocument = async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const document = await refundService.verifyRefundDocument(docId, adminId);

    res.json({
      success: true,
      data: document,
      message: 'Document verified successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error verifying document:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Get download URL for a document
 * GET /api/refunds/:id/documents/:docId/download
 */
export const getDocumentDownloadUrl = async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const downloadUrl = await refundService.getDocumentDownloadUrl(docId, userId);

    // Redirect to signed URL
    res.redirect(downloadUrl);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Error getting download URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};
