/**
 * Review Controller
 * HTTP handlers for review endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as reviewService from '../services/review.service';
import { AppError } from '../utils/errors';
import { hasRole, isSuperAdmin } from '../middleware/rbac.middleware';
import { getAdminClient } from '../config/supabase';

const supabaseAdmin = getAdminClient();

// ============================================================================
// PUBLIC ENDPOINTS (NO AUTH REQUIRED)
// ============================================================================

/**
 * GET /api/reviews/property/:propertyId
 * Get all published reviews for a property
 */
export const getPropertyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const filters = {
      status: 'published' as const,
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      maxRating: req.query.maxRating ? Number(req.query.maxRating) : undefined,
      sortBy: (req.query.sortBy as any) || 'date',
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };

    const result = await reviewService.getPropertyReviews(propertyId, filters);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/:id
 * Get a single review by ID (published only for public)
 */
export const getReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReview(id);

    // Public can only view published reviews
    if (!req.user && review.status !== 'published') {
      throw new AppError('NOT_FOUND', 'Review not found');
    }

    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/property/:propertyId/stats
 * Get review statistics for a property
 */
export const getPropertyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const stats = await reviewService.getPropertyReviewStats(propertyId);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GUEST ENDPOINTS (AUTHENTICATED)
// ============================================================================

/**
 * GET /api/reviews/my-reviews
 * Get all reviews by the authenticated guest
 */
export const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const reviews = await reviewService.getGuestReviews(userId);
    sendSuccess(res, reviews);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/eligible-bookings
 * Get all bookings the guest can review
 */
export const getEligibleBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const bookings = await reviewService.getEligibleBookingsForReview(userId);
    sendSuccess(res, bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews
 * Create a new review
 */
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = req.body;

    const review = await reviewService.createReview(userId, data);
    sendSuccess(res, review, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reviews/:id
 * Update a review (guest can only update their own, within 24h)
 */
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const data = req.body;

    const review = await reviewService.updateReview(id, userId, data);
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews/:id/withdraw
 * Guest withdraws their own review
 */
export const withdrawOwnReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    const review = await reviewService.withdrawReview(id, userId, reason, false);
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews/:id/photos
 * Upload a photo to a review
 */
export const uploadPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // TODO: Handle file upload using multer or similar
    // For now, just accept photo URL in body
    const { photoUrl } = req.body;

    sendSuccess(res, { url: photoUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reviews/:id/photos/:photoId
 * Delete a photo from a review
 */
export const deletePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, photoId } = req.params;
    const userId = req.user!.id;
    const { photoUrl } = req.body;

    await reviewService.deleteReviewPhoto(id, userId, photoUrl);
    sendSuccess(res, { message: 'Photo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PROPERTY OWNER ENDPOINTS (OWNERSHIP VERIFIED)
// ============================================================================

/**
 * GET /api/reviews/property/:propertyId/all
 * Get all reviews for a property (including hidden/withdrawn) - owner only
 */
export const getAllPropertyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const userId = req.user!.id;

    // Verify property ownership or admin
    const isAdmin = hasRole(req, 'property_admin') || isSuperAdmin(req);

    if (!isAdmin) {
      const { data: property, error } = await supabaseAdmin
        .from('properties')
        .select('owner_id')
        .eq('id', propertyId)
        .single();

      if (error || !property || property.owner_id !== userId) {
        throw new AppError('FORBIDDEN', 'You can only view reviews for your own properties');
      }
    }

    // Get all reviews (no status filter, no pagination)
    const filters = {
      page: 1,
      limit: 1000, // Get all reviews
      status: undefined, // Don't filter by status - get all
    };

    const result = await reviewService.getPropertyReviews(propertyId, filters);
    // Return just the reviews array, not the paginated object
    sendSuccess(res, result.reviews);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews/:id/hide-content
 * Hide offensive review content
 */
export const hideContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { hide_text, hide_photos, reason } = req.body;

    const review = await reviewService.hideReviewContent(
      id,
      userId,
      hide_text,
      hide_photos,
      reason
    );
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews/:id/request-withdrawal
 * Request withdrawal of a review (requires admin approval)
 */
export const requestWithdrawal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    const review = await reviewService.requestWithdrawal(id, userId, reason);
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews/:id/response
 * Add owner response to a review
 */
export const addOwnerResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { response } = req.body;

    const review = await reviewService.addOwnerResponse(id, userId, response);
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reviews/:id/response
 * Update owner response
 */
export const updateOwnerResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { response } = req.body;

    const review = await reviewService.updateOwnerResponse(id, userId, response);
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reviews/:id/response
 * Delete owner response
 */
export const deleteOwnerResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const review = await reviewService.deleteOwnerResponse(id, userId);
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews/send-request/:bookingId
 * Manually send review request for a completed booking
 */
export const sendReviewRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user!.id;

    await reviewService.sendManualReviewRequest(bookingId, userId);
    sendSuccess(res, { message: 'Review request sent successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/reviews/pending-withdrawals
 * Get all pending withdrawal requests (admin only)
 */
export const getPendingWithdrawals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requests = await reviewService.getPendingWithdrawalRequests();
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/reviews/:id/approve-withdrawal
 * Approve a withdrawal request (admin only)
 */
export const approveWithdrawal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    const review = await reviewService.withdrawReview(id, userId, reason, true);
    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/reviews/:id/reject-withdrawal
 * Reject a withdrawal request (admin only)
 */
export const rejectWithdrawal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Clear withdrawal request fields
    const { data: review, error } = await supabaseAdmin
      .from('property_reviews')
      .update({
        withdrawal_requested_by: null,
        withdrawal_requested_at: null,
        withdrawal_reason: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError('DATABASE_ERROR', `Failed to reject withdrawal: ${error.message}`);
    }

    sendSuccess(res, review);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/reviews/:id
 * Hard delete a review (admin only, extreme cases)
 */
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await reviewService.deleteReview(id);
    sendSuccess(res, { message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
