import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const bookingStatusEnum = z.enum([
  'pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show'
]);

export const paymentStatusEnum = z.enum([
  'pending', 'partial', 'paid', 'refunded', 'failed'
]);

export const paymentMethodEnum = z.enum([
  'paystack', 'paypal', 'stripe', 'eft', 'cash', 'card_on_arrival', 'manual', 'other'
]);

export const bookingSourceEnum = z.enum([
  'vilo', 'website', 'manual', 'airbnb', 'booking_com', 'lekkerslaap',
  'expedia', 'tripadvisor', 'vrbo', 'other', 'block'
]);

export const refundStatusEnum = z.enum([
  'requested', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'failed'
]);

// ============================================================================
// Param Schemas
// ============================================================================

export const bookingIdParamSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
});

export const bookingReferenceParamSchema = z.object({
  reference: z.string().min(1, 'Booking reference is required'),
});

export const refundIdParamSchema = z.object({
  id: z.string().uuid('Invalid refund request ID'),
});

export const propertyIdParamSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
});

export const paymentReceiptParamSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  paymentId: z.string().uuid('Invalid payment ID'),
});

// ============================================================================
// Booking Room Schemas
// ============================================================================

const createBookingRoomSchema = z.object({
  room_id: z.string().uuid('Invalid room ID'),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).optional(),
  children_ages: z.array(z.number().int().min(0).max(17)).optional(),
  unit_number: z.number().int().min(1).optional(),
});

// ============================================================================
// Booking Add-On Schemas
// ============================================================================

const createBookingAddonSchema = z.object({
  addon_id: z.string().uuid('Invalid add-on ID'),
  quantity: z.number().int().min(1),
});

// ============================================================================
// Booking Schemas
// ============================================================================

export const createBookingSchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),

  // Guest Info
  guest_id: z.string().uuid().optional(),
  guest_name: z.string().min(1, 'Guest name is required').max(255),
  guest_email: z.string().email('Invalid email address').max(255),
  guest_phone: z.string().max(50).optional(),

  // Stay Details
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),

  // Guest Count
  adults: z.number().int().min(1),
  children: z.number().int().min(0).optional(),
  children_ages: z.array(z.number().int().min(0).max(17)).optional(),
  infants: z.number().int().min(0).optional(),

  // Rooms
  rooms: z.array(createBookingRoomSchema).min(1, 'At least one room is required'),

  // Add-ons
  addons: z.array(createBookingAddonSchema).optional(),

  // Coupon
  coupon_code: z.string().max(50).optional(),

  // Source
  source: bookingSourceEnum.optional(),
  external_id: z.string().max(255).optional(),
  external_url: z.string().url().optional(),

  // Notes
  special_requests: z.string().max(2000).optional(),
  internal_notes: z.string().max(2000).optional(),

  // Optional status overrides (for admin)
  booking_status: bookingStatusEnum.optional(),
  payment_status: paymentStatusEnum.optional(),
  payment_method: paymentMethodEnum.optional(),
}).refine(
  (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
  { message: 'Check-out date must be after check-in date' }
);

export const updateBookingSchema = z.object({
  guest_name: z.string().min(1).max(255).optional(),
  guest_email: z.string().email().max(255).optional(),
  guest_phone: z.string().max(50).optional().nullable(),
  adults: z.number().int().min(1).optional(),
  children: z.number().int().min(0).optional(),
  children_ages: z.array(z.number().int().min(0).max(17)).optional(),
  infants: z.number().int().min(0).optional(),
  source: bookingSourceEnum.optional(),
  external_id: z.string().max(255).optional().nullable(),
  external_url: z.string().url().optional().nullable(),
  special_requests: z.string().max(2000).optional().nullable(),
  internal_notes: z.string().max(2000).optional().nullable(),
  payment_method: paymentMethodEnum.optional(),
  payment_reference: z.string().max(255).optional(),
});

// ============================================================================
// Status Update Schemas
// ============================================================================

export const updateBookingStatusSchema = z.object({
  status: bookingStatusEnum,
  reason: z.string().max(500).optional(),
});

export const updatePaymentStatusSchema = z.object({
  status: paymentStatusEnum,
  payment_method: paymentMethodEnum.optional(),
  payment_reference: z.string().max(255).optional(),
  amount_paid: z.number().min(0).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
  notify_guest: z.boolean().optional(),
});

export const updateInternalNotesSchema = z.object({
  notes: z.string().max(5000, 'Notes must not exceed 5000 characters'),
});

// ============================================================================
// Payment Schemas
// ============================================================================

export const createPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().length(3).optional(),
  payment_method: paymentMethodEnum,
  gateway_reference: z.string().max(255).optional(),
  gateway_response: z.record(z.unknown()).optional(),
  status: z.string().max(50).optional(),
  paid_at: z.string().datetime().optional(),
  proof_url: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// Refund Schemas
// ============================================================================

export const createRefundRequestSchema = z.object({
  requested_amount: z.number().min(0.01, 'Refund amount must be greater than 0'),
  reason: z.string().min(1, 'Refund reason is required').max(1000),
});

export const reviewRefundSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  approved_amount: z.number().min(0).optional(),
  review_notes: z.string().max(1000).optional(),
});

// ============================================================================
// Conflict Check Schema
// ============================================================================

export const conflictCheckSchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  rooms: z.array(z.object({
    room_id: z.string().uuid(),
    unit_number: z.number().int().min(1).optional(),
  })).min(1),
  exclude_booking_id: z.string().uuid().optional(),
}).refine(
  (data) => new Date(data.check_out) > new Date(data.check_in),
  { message: 'Check-out must be after check-in' }
);

// ============================================================================
// Coupon Validation Schema
// ============================================================================

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50),
  property_id: z.string().uuid('Invalid property ID'),
  room_ids: z.array(z.string().uuid()).optional(),
  booking_amount: z.number().min(0),
  nights: z.number().int().min(1),
});

// ============================================================================
// Calendar Query Schema
// ============================================================================

export const calendarQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be on or after start date' }
);
