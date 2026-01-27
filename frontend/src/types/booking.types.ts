// ============================================================================
// Booking Types
// ============================================================================

import { AddonPricingType, NightlyRate, PricingMode } from './room.types';

// Enums matching database
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'pending_modification' // Admin made changes, awaiting guest approval
  | 'checked_in'
  | 'checked_out'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PaymentStatus =
  | 'pending'
  | 'failed_checkout' // Checkout abandoned/failed (90-day retention)
  | 'verification_pending' // EFT payment needs verification
  | 'partial'
  | 'paid'
  | 'refunded'
  | 'partially_refunded' // Partial refund issued
  | 'failed';

export type PaymentMethod =
  | 'paystack'
  | 'paypal'
  | 'stripe'
  | 'eft'
  | 'cash'
  | 'card_on_arrival'
  | 'manual'
  | 'other';

export type BookingSource =
  | 'vilo'
  | 'website'
  | 'manual'
  | 'airbnb'
  | 'booking_com'
  | 'lekkerslaap'
  | 'expedia'
  | 'tripadvisor'
  | 'vrbo'
  | 'other'
  | 'block';

export type RefundStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'withdrawn';

// ============================================================================
// Booking Room
// ============================================================================

export interface BookingRoom {
  id: string;
  booking_id: string;
  room_id: string;
  room_name: string;
  room_code: string | null;
  adults: number;
  children: number;
  children_ages: number[];
  pricing_mode: PricingMode;
  nightly_rates: NightlyRate[];
  room_subtotal: number;
  currency: string;
  unit_number: number;
  featured_image?: string | null; // Room thumbnail from rooms table
  created_at: string;
  updated_at: string;
}

export interface CreateBookingRoomRequest {
  room_id: string;
  adults: number;
  children?: number;
  children_ages?: number[];
  unit_number?: number;
}

// ============================================================================
// Booking Add-On
// ============================================================================

export interface BookingAddon {
  id: string;
  booking_id: string;
  addon_id: string;
  addon_name: string;
  pricing_type: AddonPricingType;
  unit_price: number;
  quantity: number;
  addon_total: number;
  currency: string;
  image_url?: string | null; // Addon image from add_ons table
  created_at: string;
  updated_at: string;
}

export interface CreateBookingAddonRequest {
  addon_id: string;
  quantity: number;
}

// ============================================================================
// Booking Guest
// ============================================================================

export interface BookingGuest {
  id: string;
  booking_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  is_adult: boolean;
  age: number | null;
  id_type: string | null;
  id_number: string | null;
  nationality: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingGuestRequest {
  full_name: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  is_adult?: boolean;
  age?: number;
  id_type?: string;
  id_number?: string;
  nationality?: string;
}

// ============================================================================
// Booking Status History
// ============================================================================

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}

// ============================================================================
// Booking Payment
// ============================================================================

export interface BookingPayment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  gateway_reference: string | null;
  gateway_response: Record<string, unknown> | null;
  status: string;
  paid_at: string | null;
  proof_url: string | null;
  proof_verified_by: string | null;
  proof_verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateBookingPaymentRequest {
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  gateway_reference?: string;
  gateway_response?: Record<string, unknown>;
  status?: string;
  paid_at?: string;
  proof_url?: string;
  notes?: string;
}

export interface VerifyPaymentProofRequest {
  verified: boolean;
  notes?: string;
}

// ============================================================================
// Refund Request
// ============================================================================

export interface RefundRequest {
  id: string;
  booking_id: string;
  requested_amount: number;
  approved_amount: number | null;
  refunded_amount: number;
  currency: string;
  status: RefundStatus;
  reason: string;
  requested_by: string | null;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  gateway_refund_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRefundRequestRequest {
  requested_amount: number;
  reason: string;
}

export interface ReviewRefundRequest {
  status: 'approved' | 'rejected';
  approved_amount?: number;
  review_notes?: string;
}

export interface ProcessRefundRequest {
  gateway_refund_id?: string;
}

// ============================================================================
// Checkout Data (for recovery)
// ============================================================================

export interface CheckoutData {
  property_id: string;
  property_slug: string;
  check_in: string;
  check_out: string;
  rooms: Array<{
    room_id: string;
    adults: number;
    children: number;
    children_ages: number[];
  }>;
  addons: Array<{
    addon_id: string;
    quantity: number;
  }>;
  guest_info: {
    name: string;
    email: string;
    phone?: string;
  };
  special_requests?: string;
  coupon_code?: string;
  pricing_snapshot: {
    room_total: number;
    addons_total: number;
    discount_amount: number;
    total_amount: number;
    currency: string;
  };
  step: number;
  created_at: string;
}

// ============================================================================
// Booking (Main Entity)
// ============================================================================

export interface Booking {
  id: string;
  property_id: string;
  booking_reference: string;

  // Guest Information
  guest_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;

  // Stay Details
  check_in_date: string;
  check_out_date: string;
  total_nights: number;

  // Guest Count
  adults: number;
  children: number;
  children_ages: number[];
  infants: number;

  // Pricing Summary
  room_total: number;
  addons_total: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;

  // Coupon/Discount Applied
  coupon_code: string | null;
  coupon_id: string | null;
  coupon_discount_type: string | null;
  coupon_discount_value: number | null;

  // Booking Status
  booking_status: BookingStatus;
  status_changed_at: string | null;
  status_changed_by: string | null;

  // Payment Information
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  payment_gateway_id: string | null;
  amount_paid: number;
  payment_received_at: string | null;
  balance_due?: number; // Outstanding balance to be paid

  // Payment Proof (EFT verification)
  payment_proof_url?: string | null; // URL to uploaded payment proof file
  payment_proof_uploaded_at?: string | null; // When guest uploaded proof
  payment_verified_at?: string | null; // When payment was verified
  payment_verified_by?: string | null; // User ID who verified
  payment_rejection_reason?: string | null; // Reason if proof rejected

  // Refund Information
  refund_status?: 'none' | 'partial' | 'full';
  total_refunded?: number;

  // Failed Checkout Tracking
  failed_checkout_at?: string | null; // When checkout was abandoned
  abandoned_cart_reminder_sent?: boolean; // Reminder email sent flag

  // Abandoned Cart Recovery
  recovery_email_sent?: boolean; // Recovery email sent for abandoned cart
  recovery_email_sent_at?: string | null; // When recovery email was sent
  recovered_from_abandoned_cart_id?: string | null; // Original abandoned booking ID

  // Modification Tracking
  has_pending_modification?: boolean; // Pending modification awaiting guest approval

  // Source/Channel
  source: BookingSource;
  external_id: string | null;
  external_url: string | null;
  synced_at: string | null;

  // Guest Notes & Requests
  special_requests: string | null;
  internal_notes: string | null;

  // Checkout Recovery Data
  checkout_data: CheckoutData | null;

  // Check-in/Check-out Tracking
  checked_in_at: string | null;
  checked_in_by: string | null;
  checked_out_at: string | null;
  checked_out_by: string | null;

  // Cancellation
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;

  // Invoice
  invoice_id: string | null;
  invoice_generated_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BookingWithDetails extends Booking {
  rooms: BookingRoom[];
  addons: BookingAddon[];
  guests: BookingGuest[];
  payments: BookingPayment[];
  status_history: BookingStatusHistory[];
  property_name?: string;
  property_slug?: string;
  refund_requests?: RefundRequest[];
}

// ============================================================================
// Create/Update DTOs
// ============================================================================

export interface CreateBookingRequest {
  property_id: string;

  // Guest Information
  guest_id?: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;

  // Stay Details
  check_in_date: string;
  check_out_date: string;

  // Guest Count (summary)
  adults: number;
  children?: number;
  children_ages?: number[];
  infants?: number;

  // Rooms
  rooms: CreateBookingRoomRequest[];

  // Add-ons
  addons?: CreateBookingAddonRequest[];

  // Coupon
  coupon_code?: string;

  // Source
  source?: BookingSource;
  external_id?: string;
  external_url?: string;

  // Notes
  special_requests?: string;
  internal_notes?: string;

  // Checkout data for recovery
  checkout_data?: CheckoutData;

  // Optional status overrides (for admin/manual bookings)
  booking_status?: BookingStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
}

export interface UpdateBookingRequest {
  // Guest Information
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;

  // Stay Details (be careful - may require recalculation)
  check_in_date?: string;
  check_out_date?: string;

  // Guest Count
  adults?: number;
  children?: number;
  children_ages?: number[];
  infants?: number;

  // Source
  source?: BookingSource;
  external_id?: string;
  external_url?: string;

  // Notes
  special_requests?: string;
  internal_notes?: string;

  // Payment
  payment_method?: PaymentMethod;
  payment_reference?: string;
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  reason?: string;
}

export interface UpdatePaymentStatusRequest {
  status: PaymentStatus;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  amount_paid?: number;
}

export interface CheckInRequest {
  notes?: string;
}

export interface CheckOutRequest {
  notes?: string;
}

export interface CancelBookingRequest {
  reason: string;
  notify_guest?: boolean;
}

// ============================================================================
// List/Filter Params
// ============================================================================

export interface BookingListParams {
  property_id?: string;
  guest_id?: string;
  guest_email?: string;
  booking_status?: BookingStatus | BookingStatus[];
  payment_status?: PaymentStatus | PaymentStatus[];
  source?: BookingSource | BookingSource[];
  check_in_from?: string;
  check_in_to?: string;
  check_out_from?: string;
  check_out_to?: string;
  created_from?: string;
  created_to?: string;
  search?: string;
  sortBy?: 'check_in_date' | 'check_out_date' | 'created_at' | 'total_amount' | 'booking_reference';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  // Filter by booking type relative to user
  // 'received' = bookings at properties I own (default)
  // 'made' = bookings I made as a guest at other properties
  // 'all' = both types combined
  bookingType?: 'received' | 'made' | 'all';
}

export interface BookingListResponse {
  bookings: BookingWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Conflict Check
// ============================================================================

export interface ConflictCheckRequest {
  property_id: string;
  check_in: string;
  check_out: string;
  rooms: Array<{
    room_id: string;
    unit_number?: number;
  }>;
  exclude_booking_id?: string;
}

export interface ConflictCheckResponse {
  has_conflicts: boolean;
  conflicts: Array<{
    room_id: string;
    room_name: string;
    conflicting_bookings: Array<{
      booking_id: string;
      booking_reference: string;
      guest_name: string;
      check_in: string;
      check_out: string;
      status: BookingStatus;
    }>;
  }>;
}

// ============================================================================
// Booking Summary/Stats
// ============================================================================

export interface BookingStats {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  checked_in_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  pending_payments: number;
  currency: string;
}

export interface BookingCalendarEntry {
  booking_id: string;
  booking_reference: string;
  room_id: string;
  room_name: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  source: BookingSource;
  total_amount: number;
  unit_number: number;
}

// ============================================================================
// Guest Checkout Flow
// ============================================================================

export interface InitiateCheckoutRequest {
  property_id: string;
  check_in: string;
  check_out: string;
  rooms: Array<{
    room_id: string;
    adults: number;
    children: number;
    children_ages?: number[];
  }>;
  addons?: Array<{
    addon_id: string;
    quantity: number;
  }>;
  guest_info: {
    name: string;
    email: string;
    phone?: string;
  };
  special_requests?: string;
  coupon_code?: string;
}

export interface CheckoutPricingResponse {
  rooms: Array<{
    room_id: string;
    room_name: string;
    nightly_rates: NightlyRate[];
    room_subtotal: number;
  }>;
  addons: Array<{
    addon_id: string;
    addon_name: string;
    unit_price: number;
    quantity: number;
    addon_total: number;
  }>;
  room_total: number;
  addons_total: number;
  subtotal: number;
  discount: {
    code: string | null;
    type: string | null;
    value: number | null;
    amount: number;
  };
  tax_amount: number;
  total_amount: number;
  currency: string;
}

export interface CompleteCheckoutRequest {
  booking_id: string;
  payment_method: PaymentMethod;
  payment_reference?: string;
  gateway_response?: Record<string, unknown>;
}

export interface CompleteCheckoutResponse {
  booking_id: string;
  booking_reference: string;
  payment_status: PaymentStatus;
  redirect_url?: string;
}

// ============================================================================
// Coupon Validation
// ============================================================================

export interface ValidateCouponRequest {
  code: string;
  property_id: string;
  room_ids?: string[];
  booking_amount: number;
  nights: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  promotion?: {
    id: string;
    code: string;
    name: string;
    discount_type: string;
    discount_value: number;
    calculated_discount: number;
  };
  error?: string;
}

// ============================================================================
// UI Labels
// ============================================================================

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', dot: 'bg-yellow-500' },
  confirmed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200', dot: 'bg-emerald-500' },
  checked_in: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', dot: 'bg-blue-500' },
  checked_out: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', dot: 'bg-purple-500' },
  completed: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200', dot: 'bg-gray-500' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', dot: 'bg-red-500' },
  no_show: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', dot: 'bg-orange-500' },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  refunded: 'Refunded',
  failed: 'Failed',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', dot: 'bg-yellow-500' },
  partial: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', dot: 'bg-orange-500' },
  paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200', dot: 'bg-emerald-500' },
  refunded: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', dot: 'bg-purple-500' },
  failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', dot: 'bg-red-500' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  paystack: 'Paystack',
  paypal: 'PayPal',
  stripe: 'Stripe',
  eft: 'EFT / Bank Transfer',
  cash: 'Cash',
  card_on_arrival: 'Card on Arrival',
  manual: 'Manual',
  other: 'Other',
};

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  vilo: 'Vilo',
  website: 'Website',
  manual: 'Manual',
  airbnb: 'Airbnb',
  booking_com: 'Booking.com',
  lekkerslaap: 'LekkeSlaap',
  expedia: 'Expedia',
  tripadvisor: 'TripAdvisor',
  vrbo: 'VRBO',
  other: 'Other',
  block: 'Block',
};

export const BOOKING_SOURCE_COLORS: Record<BookingSource, string> = {
  vilo: 'text-emerald-600 dark:text-emerald-400',
  website: 'text-blue-600 dark:text-blue-400',
  manual: 'text-gray-600 dark:text-gray-400',
  airbnb: 'text-pink-600 dark:text-pink-400',
  booking_com: 'text-blue-700 dark:text-blue-300',
  lekkerslaap: 'text-orange-600 dark:text-orange-400',
  expedia: 'text-yellow-600 dark:text-yellow-400',
  tripadvisor: 'text-green-600 dark:text-green-400',
  vrbo: 'text-indigo-600 dark:text-indigo-400',
  other: 'text-gray-500 dark:text-gray-400',
  block: 'text-red-600 dark:text-red-400',
};

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  requested: 'Requested',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  withdrawn: 'Withdrawn',
};

// ============================================================================
// Helper Functions
// ============================================================================

export function formatBookingReference(ref: string): string {
  return `#${ref}`;
}

export function getBookingDuration(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
  };

  const startStr = start.toLocaleDateString('en-ZA', options);
  const endStr = end.toLocaleDateString('en-ZA', { ...options, year: 'numeric' });

  return `${startStr} - ${endStr}`;
}

export function getGuestCount(adults: number, children: number, infants: number): string {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} adult${adults !== 1 ? 's' : ''}`);
  if (children > 0) parts.push(`${children} child${children !== 1 ? 'ren' : ''}`);
  if (infants > 0) parts.push(`${infants} infant${infants !== 1 ? 's' : ''}`);
  return parts.join(', ') || 'No guests';
}

export function isBookingModifiable(status: BookingStatus): boolean {
  return ['pending', 'confirmed'].includes(status);
}

export function isBookingCancellable(status: BookingStatus): boolean {
  return ['pending', 'confirmed'].includes(status);
}

export function canCheckIn(status: BookingStatus): boolean {
  return status === 'confirmed';
}

export function canCheckOut(status: BookingStatus): boolean {
  return status === 'checked_in';
}

export function getNextStatusOptions(status: BookingStatus): BookingStatus[] {
  const transitions: Record<BookingStatus, BookingStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['checked_in', 'cancelled', 'no_show'],
    checked_in: ['checked_out'],
    checked_out: ['completed'],
    completed: [],
    cancelled: [],
    no_show: [],
  };
  return transitions[status] || [];
}

// ============================================================================
// Booking History & Timeline
// ============================================================================

export interface TimelineEvent {
  id: string;
  type: 'status_change' | 'payment' | 'refund' | 'checkin' | 'checkout' | 'cancellation' | 'note' | 'invoice' | 'created';
  timestamp: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  old_value?: any;
  new_value?: any;
}

// ============================================================================
// Booking Lock Status
// ============================================================================

export interface BookingLockStatus {
  locked: boolean;
  reason?: string;
  active_refunds?: Array<{
    id: string;
    status: RefundStatus;
    requested_amount: number;
    requested_at: string;
  }>;
}

// ============================================================================
// Payment Proof Upload (EFT verification)
// ============================================================================

export interface UploadPaymentProofRequest {
  file_url: string; // URL to uploaded file in storage
  file_name: string; // Original filename
  file_size: number; // File size in bytes
  mime_type: string; // MIME type (e.g., 'application/pdf', 'image/jpeg')
}

export interface VerifyEFTPaymentRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string; // Required if action is 'reject'
  notes?: string;
}

export interface PaymentProofResponse {
  booking_id: string;
  payment_proof_url: string;
  payment_proof_uploaded_at: string;
  payment_status: PaymentStatus;
  message: string;
}
