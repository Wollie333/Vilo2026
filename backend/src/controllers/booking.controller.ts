/**
 * Booking Controller
 * HTTP request handlers for booking management endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as bookingService from '../services/booking.service';
import {
  CreateBookingRequest,
  UpdateBookingRequest,
  UpdateBookingStatusRequest,
  UpdatePaymentStatusRequest,
  CancelBookingRequest,
  BookingListParams,
  CreateBookingPaymentRequest,
  CreateRefundRequestRequest,
  ReviewRefundRequest,
  ConflictCheckRequest,
  ValidateCouponRequest,
  UploadPaymentProofRequest,
  VerifyEFTPaymentRequest,
  BookingStatus,
  PaymentStatus,
  BookingSource,
} from '../types/booking.types';

// ============================================================================
// BOOKINGS CRUD
// ============================================================================

/**
 * GET /api/bookings
 * List all bookings for the current user's properties
 */
export const listBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: BookingListParams = {
      property_id: req.query.property_id as string | undefined,
      guest_id: req.query.guest_id as string | undefined,
      guest_email: req.query.guest_email as string | undefined,
      booking_status: parseArrayParam(req.query.booking_status) as BookingStatus | BookingStatus[] | undefined,
      payment_status: parseArrayParam(req.query.payment_status) as PaymentStatus | PaymentStatus[] | undefined,
      source: parseArrayParam(req.query.source) as BookingSource | BookingSource[] | undefined,
      check_in_from: req.query.check_in_from as string | undefined,
      check_in_to: req.query.check_in_to as string | undefined,
      check_out_from: req.query.check_out_from as string | undefined,
      check_out_to: req.query.check_out_to as string | undefined,
      created_from: req.query.created_from as string | undefined,
      created_to: req.query.created_to as string | undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as BookingListParams['sortBy'],
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await bookingService.listBookings(req.user!.id, params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id
 * Get a single booking by ID
 */
export const getBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id, req.user!.id);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/reference/:reference
 * Get a booking by reference (public)
 */
export const getBookingByReference = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reference } = req.params;
    const booking = await bookingService.getBookingByReference(reference);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings
 * Create a new booking
 */
export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: CreateBookingRequest = req.body;
    const booking = await bookingService.createBooking(req.user?.id || null, input);
    sendSuccess(res, booking, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id
 * Update a booking
 */
export const updateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: UpdateBookingRequest = req.body;
    const booking = await bookingService.updateBooking(id, req.user!.id, input);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/bookings/:id
 * Delete a booking
 */
export const deleteBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await bookingService.deleteBooking(id, req.user!.id);
    sendSuccess(res, { message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/bookings/:id/notes
 * Update internal notes for a booking
 */
export const updateInternalNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const booking = await bookingService.updateInternalNotes(id, req.user!.id, notes);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

/**
 * POST /api/bookings/:id/status
 * Update booking status
 */
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: UpdateBookingStatusRequest = req.body;
    const booking = await bookingService.updateBookingStatus(id, req.user!.id, input);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/payment-status
 * Update payment status
 */
export const updatePaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: UpdatePaymentStatusRequest = req.body;
    const booking = await bookingService.updatePaymentStatus(id, req.user!.id, input);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/check-in
 * Check in a guest
 */
export const checkIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await bookingService.checkInBooking(id, req.user!.id);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/check-out
 * Check out a guest
 */
export const checkOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await bookingService.checkOutBooking(id, req.user!.id);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking
 */
export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: CancelBookingRequest = req.body;
    const booking = await bookingService.cancelBooking(id, req.user!.id, input);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// BOOKING DETAILS MANAGEMENT (Dates, Rooms, Add-ons)
// ============================================================================

/**
 * PUT /api/bookings/:id/dates
 * Update booking dates with price recalculation
 */
export const updateBookingDates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { check_in_date, check_out_date } = req.body;
    const booking = await bookingService.updateBookingDates(
      id,
      req.user!.id,
      check_in_date,
      check_out_date
    );
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/rooms
 * Add a room to booking
 */
export const addBookingRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await bookingService.addBookingRoom(id, req.user!.id, req.body);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id/rooms/:roomId
 * Update a room in booking
 */
export const updateBookingRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, roomId } = req.params;
    const booking = await bookingService.updateBookingRoom(id, roomId, req.user!.id, req.body);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/bookings/:id/rooms/:roomId
 * Remove a room from booking
 */
export const removeBookingRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, roomId } = req.params;
    const booking = await bookingService.removeBookingRoom(id, roomId, req.user!.id);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/addons
 * Add an addon to booking
 */
export const addBookingAddon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await bookingService.addBookingAddon(id, req.user!.id, req.body);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id/addons/:addonId
 * Update an addon in booking
 */
export const updateBookingAddon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, addonId } = req.params;
    const booking = await bookingService.updateBookingAddon(id, addonId, req.user!.id, req.body);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/bookings/:id/addons/:addonId
 * Remove an addon from booking
 */
export const removeBookingAddon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, addonId } = req.params;
    const booking = await bookingService.removeBookingAddon(id, addonId, req.user!.id);
    sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PAYMENTS
// ============================================================================

/**
 * POST /api/bookings/:id/payments
 * Add a payment to a booking
 */
export const addPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: CreateBookingPaymentRequest = req.body;
    const payment = await bookingService.addBookingPayment(id, req.user!.id, input);
    sendSuccess(res, payment, 201);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// REFUNDS
// ============================================================================

/**
 * POST /api/bookings/:id/refund
 * Request a refund
 */
export const requestRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: CreateRefundRequestRequest = req.body;
    const refund = await bookingService.requestRefund(id, req.user!.id, input);
    sendSuccess(res, refund, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/refunds/:id/review
 * Review a refund request
 */
export const reviewRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: ReviewRefundRequest = req.body;
    const refund = await bookingService.reviewRefundRequest(id, req.user!.id, input);
    sendSuccess(res, refund);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CONFLICT CHECKING
// ============================================================================

/**
 * POST /api/bookings/check-conflicts
 * Check for booking conflicts
 */
export const checkConflicts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: ConflictCheckRequest = req.body;
    const result = await bookingService.checkConflicts(input);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// COUPON VALIDATION
// ============================================================================

/**
 * POST /api/bookings/validate-coupon
 * Validate a coupon code
 */
export const validateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: ValidateCouponRequest = req.body;
    const result = await bookingService.validateCoupon(input);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// STATS & CALENDAR
// ============================================================================

/**
 * GET /api/properties/:propertyId/booking-stats
 * Get booking stats for a property
 */
export const getBookingStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const stats = await bookingService.getBookingStats(propertyId, req.user!.id);
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/properties/:propertyId/calendar
 * Get calendar entries for a property
 * Query params:
 *   - start_date: string (required) - Start date (YYYY-MM-DD)
 *   - end_date: string (required) - End date (YYYY-MM-DD)
 *   - include_cancelled: boolean (optional) - Include cancelled bookings (default: false)
 */
export const getCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const includeCancelled = req.query.include_cancelled === 'true';

    if (!startDate || !endDate) {
      throw new Error('start_date and end_date are required');
    }

    const entries = await bookingService.getCalendarEntries(
      propertyId,
      req.user!.id,
      startDate,
      endDate,
      includeCancelled
    );
    sendSuccess(res, entries);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/properties/:propertyId/bookings
 * List bookings for a specific property
 */
export const listPropertyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const params: BookingListParams = {
      property_id: propertyId,
      booking_status: parseArrayParam(req.query.booking_status) as BookingStatus | BookingStatus[] | undefined,
      payment_status: parseArrayParam(req.query.payment_status) as PaymentStatus | PaymentStatus[] | undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as BookingListParams['sortBy'],
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await bookingService.listBookings(req.user!.id, params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// INVOICE ROUTES
// ============================================================================

/**
 * GET /api/bookings/:id/invoice
 * Get or generate invoice for a booking
 */
export const getBookingInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get the booking first to verify ownership
    const booking = await bookingService.getBookingById(id, req.user!.id);

    // Import invoice service dynamically to avoid circular dependencies
    const { generateBookingInvoice } = await import('../services/invoice.service');

    // Get or generate the invoice
    const invoice = await generateBookingInvoice(booking, req.user!.id);

    sendSuccess(res, invoice);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id/invoice/download
 * Download invoice PDF for a booking
 */
export const downloadBookingInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get the booking first to verify ownership
    const booking = await bookingService.getBookingById(id, req.user!.id);

    // Import invoice service dynamically to avoid circular dependencies
    const { generateBookingInvoice, getInvoiceDownloadUrl } = await import('../services/invoice.service');

    // Get or generate the invoice
    const invoice = await generateBookingInvoice(booking, req.user!.id);

    // Get download URL
    const downloadUrl = await getInvoiceDownloadUrl(invoice.id, req.user!.id);

    sendSuccess(res, { download_url: downloadUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id/payments/:paymentId/receipt
 * Download receipt for a specific payment
 */
export const downloadPaymentReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: bookingId, paymentId } = req.params;

    // Verify booking ownership
    const booking = await bookingService.getBookingById(bookingId, req.user!.id);

    // Get payment
    const payment = booking.payments?.find((p: any) => p.id === paymentId);
    if (!payment) {
      throw new AppError('NOT_FOUND', 'Payment not found');
    }

    // Note: Payment receipt generation is not yet implemented
    // The receipt_url field needs to be added to the booking_payments table
    throw new AppError('NOT_IMPLEMENTED', 'Payment receipt generation is not yet implemented');
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking history/timeline
 * GET /api/bookings/:id/history
 */
export const getBookingHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const history = await bookingService.getBookingHistory(id, userId);

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
      logger.error('Error fetching booking history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse query parameter that could be a single value or comma-separated array
 */
function parseArrayParam(param: unknown): string | string[] | undefined {
  if (!param) return undefined;
  if (typeof param === 'string') {
    if (param.includes(',')) {
      return param.split(',').map((s) => s.trim());
    }
    return param;
  }
  if (Array.isArray(param)) {
    return param as string[];
  }
  return undefined;
}

// ============================================================================
// PAYMENT PROOF UPLOAD & VERIFICATION
// ============================================================================

/**
 * POST /api/bookings/:id/payment-proof
 * Upload payment proof for EFT booking (Guest)
 */
export const uploadPaymentProof = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bookingId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const uploadData: UploadPaymentProofRequest = req.body;

    // Validate required fields
    if (!uploadData.file_url) {
      throw AppError.badRequest('file_url is required');
    }
    if (!uploadData.file_name) {
      throw AppError.badRequest('file_name is required');
    }
    if (!uploadData.file_size) {
      throw AppError.badRequest('file_size is required');
    }
    if (!uploadData.mime_type) {
      throw AppError.badRequest('mime_type is required');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (uploadData.file_size > maxSize) {
      throw AppError.badRequest('File size must not exceed 5MB');
    }

    // Validate MIME type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedTypes.includes(uploadData.mime_type)) {
      throw AppError.badRequest('Invalid file type. Only PDF, JPEG, PNG, and WebP are allowed');
    }

    const result = await bookingService.uploadPaymentProof(bookingId, uploadData, userId);

    logger.info('Payment proof uploaded', {
      bookingId,
      userId,
      fileUrl: result.payment_proof_url,
    });

    sendSuccess(res, result, 'Payment proof uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id/verify-payment
 * Verify EFT payment proof (Property Owner)
 */
export const verifyEFTPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bookingId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const verifyData: VerifyEFTPaymentRequest = req.body;

    // Validate required fields
    if (!verifyData.action) {
      throw AppError.badRequest('action is required (approve or reject)');
    }

    if (!['approve', 'reject'].includes(verifyData.action)) {
      throw AppError.badRequest('action must be either "approve" or "reject"');
    }

    if (verifyData.action === 'reject' && !verifyData.rejection_reason) {
      throw AppError.badRequest('rejection_reason is required when rejecting payment proof');
    }

    const result = await bookingService.verifyEFTPayment(bookingId, verifyData, userId);

    logger.info('EFT payment verified', {
      bookingId,
      userId,
      action: verifyData.action,
      success: result.success,
    });

    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};
