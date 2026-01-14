/**
 * Review Routes
 * API routes for property review management
 */

import express from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate, loadUserProfile } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES (NO AUTH REQUIRED)
// ============================================================================

// Get published reviews for a property
router.get('/property/:propertyId', reviewController.getPropertyReviews);

// Get review statistics for a property
router.get('/property/:propertyId/stats', reviewController.getPropertyStats);

// Get a single review
router.get('/:id', reviewController.getReview);

// ============================================================================
// AUTHENTICATED ROUTES (ALL ROUTES BELOW REQUIRE AUTH)
// ============================================================================

router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// GUEST ROUTES
// ============================================================================

// Get guest's own reviews
router.get('/my-reviews', reviewController.getMyReviews);

// Get bookings eligible for review
router.get('/eligible-bookings', reviewController.getEligibleBookings);

// Create a new review
router.post('/', reviewController.createReview);

// Update review (within 24h)
router.put('/:id', reviewController.updateReview);

// Guest withdraws their own review
router.post('/:id/withdraw', reviewController.withdrawOwnReview);

// Upload review photo
router.post('/:id/photos', reviewController.uploadPhoto);

// Delete review photo
router.delete('/:id/photos/:photoId', reviewController.deletePhoto);

// ============================================================================
// PROPERTY OWNER ROUTES (OWNERSHIP VERIFIED IN CONTROLLER)
// ============================================================================

// Get all reviews for a property (including hidden/withdrawn)
router.get('/property/:propertyId/all', reviewController.getAllPropertyReviews);

// Hide offensive content
router.post('/:id/hide-content', reviewController.hideContent);

// Request withdrawal
router.post('/:id/request-withdrawal', reviewController.requestWithdrawal);

// Add owner response
router.post('/:id/response', reviewController.addOwnerResponse);

// Update owner response
router.put('/:id/response', reviewController.updateOwnerResponse);

// Delete owner response
router.delete('/:id/response', reviewController.deleteOwnerResponse);

// Send manual review request
router.post('/send-request/:bookingId', reviewController.sendReviewRequest);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Get pending withdrawal requests
router.get(
  '/admin/pending-withdrawals',
  requireRole(['super_admin', 'property_admin']),
  reviewController.getPendingWithdrawals
);

// Approve withdrawal request
router.post(
  '/admin/:id/approve-withdrawal',
  requireRole(['super_admin', 'property_admin']),
  reviewController.approveWithdrawal
);

// Reject withdrawal request
router.post(
  '/admin/:id/reject-withdrawal',
  requireRole(['super_admin', 'property_admin']),
  reviewController.rejectWithdrawal
);

// Hard delete review (extreme cases)
router.delete(
  '/admin/:id',
  requireRole(['super_admin']),
  reviewController.deleteReview
);

export default router;
