/**
 * Booking Status Transition Service
 * Centralizes status validation and transition logic
 */

import { BookingStatus, PaymentStatus } from '../types/booking.types';

// ============================================================================
// STATUS TRANSITION MAPS
// ============================================================================

/**
 * Valid booking status transitions
 * Based on enterprise booking management plan Phase 1
 */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['pending_modification', 'checked_in', 'cancelled', 'no_show'],
  'pending_modification': ['confirmed', 'cancelled'],
  'checked_in': ['checked_out', 'completed'],
  'checked_out': ['completed'],
  'completed': [], // Terminal state
  'cancelled': [], // Terminal state
  'no_show': [], // Terminal state
};

/**
 * Valid payment status transitions
 * Based on enterprise booking management plan Phase 1
 */
export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  'pending': ['verification_pending', 'partial', 'paid', 'failed_checkout', 'failed'],
  'verification_pending': ['paid', 'failed_checkout'],
  'partial': ['paid', 'refunded', 'partially_refunded'],
  'paid': ['refunded', 'partially_refunded'],
  'refunded': [], // Terminal
  'partially_refunded': ['refunded'], // Can complete refund
  'failed_checkout': ['pending', 'verification_pending', 'partial', 'paid'], // Can recover
  'failed': ['pending', 'verification_pending'], // Can retry
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a booking status transition is valid
 */
export function isValidBookingStatusTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus
): boolean {
  // Allow same status (no change)
  if (currentStatus === newStatus) {
    return true;
  }

  const allowedTransitions = BOOKING_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Check if a payment status transition is valid
 */
export function isValidPaymentStatusTransition(
  currentStatus: PaymentStatus,
  newStatus: PaymentStatus
): boolean {
  // Allow same status (no change)
  if (currentStatus === newStatus) {
    return true;
  }

  const allowedTransitions = PAYMENT_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get allowed booking status transitions from current status
 */
export function getAllowedBookingStatusTransitions(
  currentStatus: BookingStatus
): BookingStatus[] {
  return BOOKING_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Get allowed payment status transitions from current status
 */
export function getAllowedPaymentStatusTransitions(
  currentStatus: PaymentStatus
): PaymentStatus[] {
  return PAYMENT_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a booking status is terminal (no further transitions)
 */
export function isTerminalBookingStatus(status: BookingStatus): boolean {
  return BOOKING_STATUS_TRANSITIONS[status]?.length === 0;
}

/**
 * Check if a payment status is terminal (no further transitions)
 */
export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return PAYMENT_STATUS_TRANSITIONS[status]?.length === 0;
}

// ============================================================================
// ROOM AVAILABILITY LOGIC
// ============================================================================

/**
 * Booking statuses that block room availability
 * Room is UNAVAILABLE when booking_status is in this list
 */
export const ROOM_BLOCKING_STATUSES: BookingStatus[] = [
  'confirmed',
  'pending_modification',
  'checked_in',
  'checked_out',
];

/**
 * Check if a booking status blocks room availability
 * Based on Option A: Room blocks when booking_status = 'confirmed' (regardless of payment)
 */
export function doesStatusBlockRoom(status: BookingStatus): boolean {
  return ROOM_BLOCKING_STATUSES.includes(status);
}

/**
 * Get human-readable status description
 */
export function getBookingStatusDescription(status: BookingStatus): string {
  const descriptions: Record<BookingStatus, string> = {
    'pending': 'Awaiting confirmation',
    'confirmed': 'Confirmed - room blocked',
    'pending_modification': 'Changes pending guest approval',
    'checked_in': 'Guest has checked in',
    'checked_out': 'Guest has checked out',
    'completed': 'Stay completed',
    'cancelled': 'Booking cancelled',
    'no_show': 'Guest did not arrive',
  };

  return descriptions[status] || status;
}

/**
 * Get human-readable payment status description
 */
export function getPaymentStatusDescription(status: PaymentStatus): string {
  const descriptions: Record<PaymentStatus, string> = {
    'pending': 'Payment pending',
    'verification_pending': 'Awaiting payment verification',
    'partial': 'Partially paid',
    'paid': 'Fully paid',
    'refunded': 'Fully refunded',
    'partially_refunded': 'Partially refunded',
    'failed_checkout': 'Checkout abandoned',
    'failed': 'Payment failed',
  };

  return descriptions[status] || status;
}

// ============================================================================
// STATUS TRANSITION EXPLANATIONS
// ============================================================================

/**
 * Get explanation for why a transition is not allowed
 */
export function getTransitionErrorMessage(
  currentStatus: BookingStatus | PaymentStatus,
  requestedStatus: BookingStatus | PaymentStatus,
  type: 'booking' | 'payment'
): string {
  const isBooking = type === 'booking';
  const transitions = isBooking ? BOOKING_STATUS_TRANSITIONS : PAYMENT_STATUS_TRANSITIONS;
  const allowed = transitions[currentStatus as BookingStatus] || [];

  if (allowed.length === 0) {
    return `Cannot change ${type} status from ${currentStatus}. This status is terminal and cannot be modified.`;
  }

  return `Cannot change ${type} status from ${currentStatus} to ${requestedStatus}. Valid transitions are: ${allowed.join(', ')}`;
}
