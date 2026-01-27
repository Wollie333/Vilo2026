/**
 * Review Service
 * Handles all review-related API calls
 */

import { api } from './api.service';
import type {
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewStats,
  EligibleBooking,
  ReviewEligibility,
  PaginatedReviews,
  ReviewFilters,
  HideContentRequest,
  WithdrawalRequest,
  OwnerResponseRequest,
} from '@/types/review.types';

class ReviewService {
  // ============================================================================
  // PUBLIC ENDPOINTS (No Auth Required)
  // ============================================================================

  /**
   * Get reviews for a property (public view)
   */
  async getPropertyReviews(
    propertyId: string,
    page = 1,
    limit = 10,
    filters?: ReviewFilters
  ): Promise<PaginatedReviews> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.minRating) params.append('minRating', filters.minRating.toString());
    if (filters?.maxRating) params.append('maxRating', filters.maxRating.toString());
    if (filters?.hasPhotos !== undefined) params.append('hasPhotos', filters.hasPhotos.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    return api.get(`/reviews/property/${propertyId}?${params.toString()}`);
  }

  /**
   * Get a single review by ID
   */
  async getReview(reviewId: string): Promise<Review> {
    return api.get(`/reviews/${reviewId}`);
  }

  /**
   * Get review statistics for a property
   */
  async getPropertyStats(propertyId: string): Promise<ReviewStats> {
    return api.get(`/reviews/property/${propertyId}/stats`);
  }

  // ============================================================================
  // GUEST ENDPOINTS (Authenticated)
  // ============================================================================

  /**
   * Get current user's reviews
   */
  async getMyReviews(): Promise<Review[]> {
    return api.get('/reviews/my-reviews');
  }

  /**
   * Get bookings eligible for review
   */
  async getEligibleBookings(): Promise<EligibleBooking[]> {
    return api.get('/reviews/eligible-bookings');
  }

  /**
   * Check if a specific booking is eligible for review
   */
  async checkEligibility(bookingId: string): Promise<ReviewEligibility> {
    return api.get(`/reviews/check-eligibility/${bookingId}`);
  }

  /**
   * Get review status for a booking (for BookingDetailPage integration)
   */
  async getBookingReviewStatus(bookingId: string): Promise<{
    eligible: boolean;
    hasReview: boolean;
    review: Review | null;
    daysRemaining: number;
    reason?: string;
  }> {
    return api.get(`/reviews/booking/${bookingId}/status`);
  }

  /**
   * Create a new review
   */
  async createReview(data: CreateReviewInput): Promise<Review> {
    return api.post('/reviews', data);
  }

  /**
   * Update an existing review (within 24h)
   */
  async updateReview(reviewId: string, data: UpdateReviewInput): Promise<Review> {
    return api.put(`/reviews/${reviewId}`, data);
  }

  /**
   * Withdraw own review (guest action)
   */
  async withdrawReview(reviewId: string, reason: string): Promise<Review> {
    return api.post(`/reviews/${reviewId}/withdraw`, { reason });
  }

  /**
   * Upload a photo for a review
   */
  async uploadPhoto(reviewId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await api.post(`/reviews/${reviewId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.url;
  }

  /**
   * Delete a photo from a review
   */
  async deletePhoto(reviewId: string, photoUrl: string): Promise<void> {
    return api.delete(`/reviews/${reviewId}/photos`, {
      data: { photoUrl },
    });
  }

  // ============================================================================
  // PROPERTY OWNER ENDPOINTS (Ownership Verified)
  // ============================================================================

  /**
   * Get all reviews for owner's property (including hidden/withdrawn)
   */
  async getAllPropertyReviews(
    propertyId: string,
    filters?: ReviewFilters
  ): Promise<Review[]> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.pendingWithdrawal !== undefined) {
      params.append('pendingWithdrawal', filters.pendingWithdrawal.toString());
    }
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const url = `/reviews/property/${propertyId}/all${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
  }

  /**
   * Hide offensive content (text/photos) in a review
   */
  async hideContent(reviewId: string, request: HideContentRequest): Promise<Review> {
    return api.post(`/reviews/${reviewId}/hide-content`, request);
  }

  /**
   * Request withdrawal of a review (requires admin approval)
   */
  async requestWithdrawal(reviewId: string, request: WithdrawalRequest): Promise<Review> {
    return api.post(`/reviews/${reviewId}/request-withdrawal`, request);
  }

  /**
   * Add owner response to a review
   */
  async addOwnerResponse(reviewId: string, request: OwnerResponseRequest): Promise<Review> {
    return api.post(`/reviews/${reviewId}/response`, request);
  }

  /**
   * Update owner response
   */
  async updateOwnerResponse(reviewId: string, request: OwnerResponseRequest): Promise<Review> {
    return api.put(`/reviews/${reviewId}/response`, request);
  }

  /**
   * Delete owner response
   */
  async deleteOwnerResponse(reviewId: string): Promise<Review> {
    return api.delete(`/reviews/${reviewId}/response`);
  }

  /**
   * Send manual review request to guest
   */
  async sendReviewRequest(bookingId: string): Promise<void> {
    return api.post(`/reviews/send-request/${bookingId}`);
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  /**
   * Get all pending withdrawal requests
   */
  async getPendingWithdrawals(): Promise<Review[]> {
    return api.get('/reviews/admin/pending-withdrawals');
  }

  /**
   * Approve a withdrawal request
   */
  async approveWithdrawal(reviewId: string, reason: string): Promise<Review> {
    return api.post(`/reviews/admin/${reviewId}/approve-withdrawal`, { reason });
  }

  /**
   * Reject a withdrawal request
   */
  async rejectWithdrawal(reviewId: string, reason: string): Promise<Review> {
    return api.post(`/reviews/admin/${reviewId}/reject-withdrawal`, { reason });
  }

  /**
   * Force withdraw a review (admin override)
   */
  async forceWithdraw(reviewId: string, reason: string): Promise<Review> {
    return api.post(`/reviews/admin/${reviewId}/force-withdraw`, { reason });
  }

  /**
   * Hard delete a review (extreme cases only)
   */
  async deleteReview(reviewId: string): Promise<void> {
    return api.delete(`/reviews/admin/${reviewId}`);
  }

  /**
   * Get all reviews for a specific user (super admin only)
   * Includes reviews written by user + reviews for user's properties
   */
  async getUserReviews(
    userId: string,
    params?: { status?: string; rating?: number; property_id?: string }
  ): Promise<Review[]> {
    return api.get(`/users/${userId}/reviews`, { params });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if review can be edited (within 24 hours)
   */
  canEditReview(review: Review): boolean {
    const createdAt = new Date(review.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    return hoursSinceCreation < 24;
  }

  /**
   * Check if user can withdraw review
   */
  canWithdrawReview(review: Review, userId: string): boolean {
    return review.guest_id === userId && !review.withdrawn_at;
  }

  /**
   * Check if review has pending withdrawal request
   */
  hasPendingWithdrawal(review: Review): boolean {
    return !!review.withdrawal_requested_at && !review.withdrawn_at;
  }

  /**
   * Get days remaining to submit review
   */
  getDaysRemainingForReview(checkedOutAt: string): number {
    const checkoutDate = new Date(checkedOutAt);
    const expiryDate = new Date(checkoutDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return Math.max(0, daysRemaining);
  }

  /**
   * Validate review ratings
   */
  validateRatings(ratings: {
    safety: number;
    cleanliness: number;
    location: number;
    comfort: number;
    scenery: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    Object.entries(ratings).forEach(([category, value]) => {
      if (value < 1 || value > 5) {
        errors.push(`${category} rating must be between 1 and 5`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate review text length
   */
  validateReviewText(text: string): { valid: boolean; error?: string } {
    if (text.length < 10) {
      return { valid: false, error: 'Review must be at least 10 characters' };
    }

    if (text.length > 5000) {
      return { valid: false, error: 'Review must be less than 5000 characters' };
    }

    return { valid: true };
  }

  /**
   * Validate photo count
   */
  validatePhotoCount(photoCount: number): { valid: boolean; error?: string } {
    if (photoCount > 5) {
      return { valid: false, error: 'Maximum 5 photos allowed per review' };
    }

    return { valid: true };
  }

  /**
   * Format review for display
   */
  formatReviewForDisplay(review: Review): Review {
    // If text is hidden, replace with placeholder
    if (review.is_text_hidden) {
      return {
        ...review,
        review_text: '[Content hidden by property owner due to policy violation]',
      };
    }

    // If photos are hidden, remove them
    if (review.is_photos_hidden) {
      return {
        ...review,
        photos: [],
      };
    }

    return review;
  }
}

export const reviewService = new ReviewService();
