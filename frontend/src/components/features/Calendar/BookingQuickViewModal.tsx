/**
 * BookingQuickViewModal
 *
 * Compact quick view modal for displaying booking information from calendar.
 */

import React, { useEffect } from 'react';
import { Modal, Button, PaymentProofBadge } from '@/components/ui';
import type { PaymentProofStatus } from '@/components/ui';
import type { CalendarEntry } from './Calendar.types';
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, formatCurrency } from '@/types/booking.types';

// ============================================================================
// Icons
// ============================================================================

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

export interface BookingQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: CalendarEntry[];
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onViewFullBooking: (entry: CalendarEntry) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatAmount = (amount: number | undefined, currency: string = 'ZAR'): string => {
  if (amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(amount);
};

const getPaymentProofStatus = (entry: CalendarEntry): PaymentProofStatus => {
  if (!entry.payment_proof_url) return 'none';
  if (entry.payment_verified_at) return 'verified';
  if (entry.payment_rejection_reason) return 'rejected';
  return 'pending';
};

// ============================================================================
// Badge Components
// ============================================================================

const BookingStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed':
        return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'no_show':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status)}`}>
      {BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] || status}
    </span>
  );
};

const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = PAYMENT_STATUS_COLORS[status as keyof typeof PAYMENT_STATUS_COLORS] || {
    bg: 'bg-gray-100 dark:bg-gray-900/20',
    text: 'text-gray-800 dark:text-gray-400',
    dot: 'bg-gray-500',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
      {PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] || status}
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const BookingQuickViewModal: React.FC<BookingQuickViewModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentIndex,
  onNavigate,
  onViewFullBooking,
}) => {
  // Get current entry
  const currentEntry = entries[currentIndex];
  const hasMultiple = entries.length > 1;
  const isFirstEntry = currentIndex === 0;
  const isLastEntry = currentIndex === entries.length - 1;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !isFirstEntry) {
        e.preventDefault();
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && !isLastEntry) {
        e.preventDefault();
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFirstEntry, isLastEntry, onNavigate]);

  if (!currentEntry) return null;

  const nights = calculateNights(currentEntry.start_date, currentEntry.end_date);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <Modal.Header onClose={onClose}>
        <div className="flex items-center justify-between w-full pr-8">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {currentEntry.booking_reference || currentEntry.booking_id || 'Booking Details'}
            </h3>
            {hasMultiple && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {currentIndex + 1} of {entries.length} bookings
              </p>
            )}
          </div>

          {/* Navigation arrows */}
          {hasMultiple && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onNavigate('prev')}
                disabled={isFirstEntry}
                className={`p-1.5 rounded transition-colors ${
                  isFirstEntry
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                }`}
                aria-label="Previous booking"
              >
                <ChevronLeftIcon />
              </button>
              <button
                onClick={() => onNavigate('next')}
                disabled={isLastEntry}
                className={`p-1.5 rounded transition-colors ${
                  isLastEntry
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border'
                }`}
                aria-label="Next booking"
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}
        </div>
      </Modal.Header>

      <Modal.Body className="p-4">
        <div className="space-y-4">
          {/* Room Image & Name */}
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-border">
            {currentEntry.room_thumbnail ? (
              <>
                <img
                  src={currentEntry.room_thumbnail}
                  alt={currentEntry.room_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', currentEntry.room_thumbnail);
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      e.currentTarget.style.display = 'none';
                      const fallback = parent.querySelector('.fallback-icon');
                      if (fallback) {
                        (fallback as HTMLElement).style.display = 'flex';
                      }
                    }
                  }}
                />
                <div className="fallback-icon w-full h-full absolute inset-0 flex-col items-center justify-center text-gray-400 dark:text-gray-600" style={{ display: 'none' }}>
                  <HomeIcon />
                  <p className="text-xs mt-2">Image not available</p>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                <HomeIcon />
                <p className="text-xs mt-2">No image</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white font-semibold text-sm truncate">
                {currentEntry.room_name}
              </p>
              {currentEntry.property_name && (
                <p className="text-white/90 text-xs truncate">
                  {currentEntry.property_name}
                </p>
              )}
            </div>
          </div>

          {/* Status & Payment Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentEntry.booking_status && (
              <BookingStatusBadge status={currentEntry.booking_status} />
            )}
            {currentEntry.payment_status && (
              <PaymentStatusBadge status={currentEntry.payment_status} />
            )}
            {currentEntry.total_amount !== undefined && (
              <span className="ml-auto text-lg font-bold text-primary">
                {formatAmount(currentEntry.total_amount, currentEntry.currency)}
              </span>
            )}
          </div>

          {/* Pending Modification Banner */}
          {currentEntry.has_pending_modification && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 text-lg">⚠️</span>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                    Modification Pending
                  </h5>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                    This booking has changes pending guest approval
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Proof Section */}
          {(() => {
            const paymentProofStatus = getPaymentProofStatus(currentEntry);
            return paymentProofStatus !== 'none' && (
              <div className="bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-3">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Payment Proof
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <PaymentProofBadge
                      status={paymentProofStatus}
                      uploadedAt={currentEntry.payment_proof_uploaded_at}
                      verifiedAt={currentEntry.payment_verified_at}
                    />
                  </div>
                  {currentEntry.payment_proof_uploaded_at && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Uploaded: {formatDate(currentEntry.payment_proof_uploaded_at)}
                    </div>
                  )}
                  {currentEntry.payment_verified_at && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Verified: {formatDate(currentEntry.payment_verified_at)}
                    </div>
                  )}
                  {currentEntry.payment_rejection_reason && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      <span className="font-semibold">Rejection reason: </span>
                      {currentEntry.payment_rejection_reason}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {currentEntry.payment_proof_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(currentEntry.payment_proof_url!, '_blank')}
                      >
                        View Proof →
                      </Button>
                    )}
                    {paymentProofStatus === 'pending' && currentEntry.booking_id && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          // Navigate to booking detail verification section
                          window.location.href = `/bookings/${currentEntry.booking_id}#verify-payment`;
                        }}
                      >
                        Verify Payment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Refund Information */}
          {currentEntry.refund_status && currentEntry.refund_status !== 'none' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2 uppercase tracking-wide">
                Refund Information
              </h5>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 dark:text-purple-400">Status</span>
                  <span className="font-medium text-purple-900 dark:text-purple-300">
                    {currentEntry.refund_status === 'full' ? 'Fully Refunded' : 'Partially Refunded'}
                  </span>
                </div>
                {currentEntry.total_refunded !== undefined && currentEntry.total_refunded > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 dark:text-purple-400">Refunded Amount</span>
                    <span className="font-semibold text-purple-900 dark:text-purple-300">
                      {formatCurrency(currentEntry.total_refunded, currentEntry.currency || 'ZAR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guest Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Guest Information
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {currentEntry.guest_name || 'Guest'}
                </span>
              </div>
              {currentEntry.guest_email && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email</span>
                  <a
                    href={`mailto:${currentEntry.guest_email}`}
                    className="text-primary hover:underline text-xs truncate max-w-[200px]"
                  >
                    {currentEntry.guest_email}
                  </a>
                </div>
              )}
              {currentEntry.guest_phone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Phone</span>
                  <a
                    href={`tel:${currentEntry.guest_phone}`}
                    className="text-primary hover:underline"
                  >
                    {currentEntry.guest_phone}
                  </a>
                </div>
              )}
              {(currentEntry.adults !== undefined || currentEntry.children !== undefined) && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Guests</span>
                  <span className="text-gray-900 dark:text-white">
                    {currentEntry.adults || 0} {currentEntry.adults === 1 ? 'adult' : 'adults'}
                    {currentEntry.children ? `, ${currentEntry.children} ${currentEntry.children === 1 ? 'child' : 'children'}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stay Details */}
          <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-dark-border">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Stay Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Check-in</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatDate(currentEntry.start_date)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Check-out</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatDate(currentEntry.end_date)}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-dark-bg rounded px-3 py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{nights}</span> {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={() => onViewFullBooking(currentEntry)}>
            View Full Booking
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default BookingQuickViewModal;
