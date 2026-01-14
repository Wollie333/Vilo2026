import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import {
  requirePermission,
  requireAdmin,
  requireSuperAdmin,
} from '../middleware/permissions.middleware';
import * as refundController from '../controllers/refund.controller';

const router = express.Router();

// ============================================================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ============================================================================

const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for upload to Supabase
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed'));
    }
  },
});

// ============================================================================
// GUEST ENDPOINTS
// ============================================================================

// Calculate suggested refund amount
router.get(
  '/bookings/:bookingId/refunds/calculate',
  authenticate,
  refundController.calculateSuggestedRefund
);

// Create refund request
router.post(
  '/bookings/:bookingId/refunds',
  authenticate,
  refundController.createRefundRequest
);

// Get refund requests for a booking
router.get(
  '/bookings/:bookingId/refunds',
  authenticate,
  refundController.getBookingRefunds
);

// List user's own refund requests (MUST come before /refunds/:id)
router.get(
  '/refunds',
  authenticate,
  refundController.listMyRefunds
);

// Get refund status for a booking (MUST come before /refunds/:id)
router.get(
  '/refunds/booking/:bookingId/status',
  authenticate,
  refundController.getRefundStatus
);

// Get refund request details (MUST come last - catches /refunds/:id)
router.get(
  '/refunds/:id',
  authenticate,
  refundController.getRefundDetails
);

// Withdraw refund request (guest can withdraw their own)
router.post(
  '/refunds/:id/withdraw',
  authenticate,
  refundController.withdrawRefundRequest
);

// ============================================================================
// COMMENT SYSTEM ENDPOINTS (Guest)
// ============================================================================

// Add comment to refund
router.post(
  '/refunds/:id/comments',
  authenticate,
  refundController.addComment
);

// Get comments for refund
router.get(
  '/refunds/:id/comments',
  authenticate,
  refundController.getComments
);

// Get activity feed for refund
router.get(
  '/refunds/:id/activity',
  authenticate,
  refundController.getActivityFeed
);

// Get status history for refund
router.get(
  '/refunds/:id/history',
  authenticate,
  refundController.getStatusHistory
);

// ============================================================================
// DOCUMENT MANAGEMENT ENDPOINTS (Guest)
// ============================================================================

// Upload document for refund
router.post(
  '/refunds/:id/documents',
  authenticate,
  upload.single('file'),
  refundController.uploadDocument
);

// Get documents for refund
router.get(
  '/refunds/:id/documents',
  authenticate,
  refundController.getDocuments
);

// Download document
router.get(
  '/refunds/:id/documents/:docId/download',
  authenticate,
  refundController.getDocumentDownloadUrl
);

// Delete document
router.delete(
  '/refunds/:id/documents/:docId',
  authenticate,
  refundController.deleteDocument
);

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// List all refund requests (admin)
router.get(
  '/admin/refunds',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'read'),
  refundController.listRefunds
);

// Get refund request details (admin)
router.get(
  '/admin/refunds/:id',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'read'),
  refundController.getAdminRefundDetails
);

// Approve refund request
router.post(
  '/admin/refunds/:id/approve',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'manage'),
  refundController.approveRefund
);

// Reject refund request
router.post(
  '/admin/refunds/:id/reject',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'manage'),
  refundController.rejectRefund
);

// Process refund (automatic)
router.post(
  '/admin/refunds/:id/process',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'manage'),
  refundController.processRefund
);

// Mark manual refund as complete
router.post(
  '/admin/refunds/:id/mark-complete',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'manage'),
  refundController.markManualRefundComplete
);

// Retry failed refund
router.post(
  '/admin/refunds/:id/retry',
  authenticate,
  requireSuperAdmin,
  refundController.retryFailedRefund
);

// ============================================================================
// COMMENT SYSTEM ENDPOINTS (Admin)
// ============================================================================

// Add comment to refund (admin can add internal notes)
router.post(
  '/admin/refunds/:id/comments',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'manage'),
  refundController.addComment
);

// Get comments for refund (admin sees all, including internal)
router.get(
  '/admin/refunds/:id/comments',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'read'),
  refundController.getComments
);

// Get activity feed for refund (admin sees all activities)
router.get(
  '/admin/refunds/:id/activity',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'read'),
  refundController.getActivityFeed
);

// Get status history for refund
router.get(
  '/admin/refunds/:id/history',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'read'),
  refundController.getStatusHistory
);

// ============================================================================
// DOCUMENT MANAGEMENT ENDPOINTS (Admin)
// ============================================================================

// Upload document for refund (admin can upload on behalf of guest)
router.post(
  '/admin/refunds/:id/documents',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'manage'),
  upload.single('file'),
  refundController.uploadDocument
);

// Get documents for refund (admin sees all)
router.get(
  '/admin/refunds/:id/documents',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'read'),
  refundController.getDocuments
);

// Verify document (admin only)
router.post(
  '/admin/refunds/:id/documents/:docId/verify',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'manage'),
  refundController.verifyDocument
);

// Download document (admin can download any)
router.get(
  '/admin/refunds/:id/documents/:docId/download',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'read'),
  refundController.getDocumentDownloadUrl
);

// Delete document (admin can delete any)
router.delete(
  '/admin/refunds/:id/documents/:docId',
  authenticate,
  requireAdmin,
  requirePermission('refunds', 'manage'),
  refundController.deleteDocument
);

export default router;
