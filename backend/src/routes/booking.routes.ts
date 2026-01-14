/**
 * Booking Routes
 * Route definitions for booking management endpoints.
 */

import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import * as paymentScheduleController from '../controllers/payment-schedule.controller';
import {
  authenticate,
  loadUserProfile,
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware';
import {
  bookingIdParamSchema,
  bookingReferenceParamSchema,
  refundIdParamSchema,
  propertyIdParamSchema,
  paymentReceiptParamSchema,
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  updatePaymentStatusSchema,
  cancelBookingSchema,
  updateInternalNotesSchema,
  createPaymentSchema,
  createRefundRequestSchema,
  reviewRefundSchema,
  conflictCheckSchema,
  validateCouponSchema,
  calendarQuerySchema,
} from '../validators/booking.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// Utility Routes (must be before :id routes)
// ============================================================================

/**
 * POST /api/bookings/check-conflicts
 * Check for booking conflicts
 */
router.post(
  '/check-conflicts',
  validateBody(conflictCheckSchema),
  bookingController.checkConflicts
);

/**
 * POST /api/bookings/validate-coupon
 * Validate a coupon code
 */
router.post(
  '/validate-coupon',
  validateBody(validateCouponSchema),
  bookingController.validateCoupon
);

/**
 * GET /api/bookings/reference/:reference
 * Get booking by reference (for guest lookup)
 */
router.get(
  '/reference/:reference',
  validateParams(bookingReferenceParamSchema),
  bookingController.getBookingByReference
);

// ============================================================================
// Booking CRUD Routes
// ============================================================================

/**
 * GET /api/bookings
 * List all bookings for current user's properties
 */
router.get('/', bookingController.listBookings);

/**
 * GET /api/bookings/:id
 * Get a single booking by ID
 */
router.get(
  '/:id',
  validateParams(bookingIdParamSchema),
  bookingController.getBooking
);

/**
 * GET /api/bookings/:id/payment-schedule
 * Get payment schedule for a booking
 */
router.get(
  '/:id/payment-schedule',
  validateParams(bookingIdParamSchema),
  paymentScheduleController.getBookingSchedule
);

/**
 * GET /api/bookings/:id/history
 * Get comprehensive timeline of all booking events
 */
router.get(
  '/:id/history',
  validateParams(bookingIdParamSchema),
  bookingController.getBookingHistory
);

/**
 * POST /api/bookings
 * Create a new booking
 */
router.post(
  '/',
  validateBody(createBookingSchema),
  bookingController.createBooking
);

/**
 * PUT /api/bookings/:id
 * Update a booking
 */
router.put(
  '/:id',
  validateParams(bookingIdParamSchema),
  validateBody(updateBookingSchema),
  bookingController.updateBooking
);

/**
 * DELETE /api/bookings/:id
 * Delete a booking
 */
router.delete(
  '/:id',
  validateParams(bookingIdParamSchema),
  bookingController.deleteBooking
);

/**
 * PATCH /api/bookings/:id/notes
 * Update internal notes for a booking
 */
router.patch(
  '/:id/notes',
  validateParams(bookingIdParamSchema),
  validateBody(updateInternalNotesSchema),
  bookingController.updateInternalNotes
);

// ============================================================================
// Status Management Routes
// ============================================================================

/**
 * POST /api/bookings/:id/status
 * Update booking status
 */
router.post(
  '/:id/status',
  validateParams(bookingIdParamSchema),
  validateBody(updateBookingStatusSchema),
  bookingController.updateStatus
);

/**
 * POST /api/bookings/:id/payment-status
 * Update payment status
 */
router.post(
  '/:id/payment-status',
  validateParams(bookingIdParamSchema),
  validateBody(updatePaymentStatusSchema),
  bookingController.updatePaymentStatus
);

/**
 * POST /api/bookings/:id/check-in
 * Check in a guest
 */
router.post(
  '/:id/check-in',
  validateParams(bookingIdParamSchema),
  bookingController.checkIn
);

/**
 * POST /api/bookings/:id/check-out
 * Check out a guest
 */
router.post(
  '/:id/check-out',
  validateParams(bookingIdParamSchema),
  bookingController.checkOut
);

/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking
 */
router.post(
  '/:id/cancel',
  validateParams(bookingIdParamSchema),
  validateBody(cancelBookingSchema),
  bookingController.cancelBooking
);

// ============================================================================
// Booking Details Management Routes (Dates, Rooms, Add-ons)
// ============================================================================

/**
 * PUT /api/bookings/:id/dates
 * Update booking dates with price recalculation
 */
router.put(
  '/:id/dates',
  validateParams(bookingIdParamSchema),
  bookingController.updateBookingDates
);

/**
 * POST /api/bookings/:id/rooms
 * Add a room to booking
 */
router.post(
  '/:id/rooms',
  validateParams(bookingIdParamSchema),
  bookingController.addBookingRoom
);

/**
 * PUT /api/bookings/:id/rooms/:roomId
 * Update a room in booking
 */
router.put(
  '/:id/rooms/:roomId',
  validateParams(bookingIdParamSchema),
  bookingController.updateBookingRoom
);

/**
 * DELETE /api/bookings/:id/rooms/:roomId
 * Remove a room from booking
 */
router.delete(
  '/:id/rooms/:roomId',
  validateParams(bookingIdParamSchema),
  bookingController.removeBookingRoom
);

/**
 * POST /api/bookings/:id/addons
 * Add an addon to booking
 */
router.post(
  '/:id/addons',
  validateParams(bookingIdParamSchema),
  bookingController.addBookingAddon
);

/**
 * PUT /api/bookings/:id/addons/:addonId
 * Update an addon in booking
 */
router.put(
  '/:id/addons/:addonId',
  validateParams(bookingIdParamSchema),
  bookingController.updateBookingAddon
);

/**
 * DELETE /api/bookings/:id/addons/:addonId
 * Remove an addon from booking
 */
router.delete(
  '/:id/addons/:addonId',
  validateParams(bookingIdParamSchema),
  bookingController.removeBookingAddon
);

// ============================================================================
// Payment Routes
// ============================================================================

/**
 * POST /api/bookings/:id/payments
 * Add a payment to a booking
 */
router.post(
  '/:id/payments',
  validateParams(bookingIdParamSchema),
  validateBody(createPaymentSchema),
  bookingController.addPayment
);

/**
 * POST /api/bookings/:id/payment-proof
 * Upload payment proof for EFT booking (Guest)
 */
router.post(
  '/:id/payment-proof',
  validateParams(bookingIdParamSchema),
  bookingController.uploadPaymentProof
);

/**
 * PUT /api/bookings/:id/verify-payment
 * Verify EFT payment proof (Property Owner)
 */
router.put(
  '/:id/verify-payment',
  validateParams(bookingIdParamSchema),
  bookingController.verifyEFTPayment
);

/**
 * GET /api/bookings/:id/payments/:paymentId/receipt
 * Download receipt for a payment
 */
router.get(
  '/:id/payments/:paymentId/receipt',
  validateParams(paymentReceiptParamSchema),
  bookingController.downloadPaymentReceipt
);

// ============================================================================
// Refund Routes
// ============================================================================

/**
 * POST /api/bookings/:id/refund
 * Request a refund
 */
router.post(
  '/:id/refund',
  validateParams(bookingIdParamSchema),
  validateBody(createRefundRequestSchema),
  bookingController.requestRefund
);

// ============================================================================
// Invoice Routes
// ============================================================================

/**
 * GET /api/bookings/:id/invoice
 * Get or generate invoice for a booking
 */
router.get(
  '/:id/invoice',
  validateParams(bookingIdParamSchema),
  bookingController.getBookingInvoice
);

/**
 * GET /api/bookings/:id/invoice/download
 * Download invoice PDF for a booking
 */
router.get(
  '/:id/invoice/download',
  validateParams(bookingIdParamSchema),
  bookingController.downloadBookingInvoice
);

export default router;

// ============================================================================
// Refund Review Routes (separate router for /api/refunds)
// ============================================================================

export const refundRoutes = Router();

refundRoutes.use(authenticate);
refundRoutes.use(loadUserProfile);

/**
 * POST /api/refunds/:id/review
 * Review a refund request
 */
refundRoutes.post(
  '/:id/review',
  validateParams(refundIdParamSchema),
  validateBody(reviewRefundSchema),
  bookingController.reviewRefund
);

// ============================================================================
// Property-scoped Routes (to be added to property routes)
// ============================================================================

/**
 * These routes are property-scoped and should be mounted under /api/properties/:propertyId
 */

export const propertyBookingRoutes = Router({ mergeParams: true });

propertyBookingRoutes.use(authenticate);
propertyBookingRoutes.use(loadUserProfile);

/**
 * GET /api/properties/:propertyId/bookings
 * List bookings for a property
 */
propertyBookingRoutes.get('/bookings', bookingController.listPropertyBookings);

/**
 * GET /api/properties/:propertyId/booking-stats
 * Get booking stats for a property
 */
propertyBookingRoutes.get('/booking-stats', bookingController.getBookingStats);

/**
 * GET /api/properties/:propertyId/calendar
 * Get calendar entries for a property
 */
propertyBookingRoutes.get(
  '/calendar',
  validateQuery(calendarQuerySchema),
  bookingController.getCalendar
);
