/**
 * PortalBookingDetailPage
 *
 * Guest portal page showing detailed booking information and actions.
 * Routes: /portal/bookings/:id
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Spinner,
  Alert,
  Modal,
  Textarea,
} from '@/components/ui';
import { AuthenticatedLayout } from '@/components/layout';
import {
  RefundRequestForm,
  RefundStatusDisplay,
  RefundTimeline,
  CreditMemoViewer,
} from '@/components/features';
import { bookingService, refundService, creditMemoService } from '@/services';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  formatCurrency,
  isBookingCancellable,
} from '@/types/booking.types';
import type { BookingWithDetails } from '@/types/booking.types';
import type { RefundStatusResponse, CreateRefundRequestDTO } from '@/types/refund.types';
import type { CreditMemo } from '@/types/credit-memo.types';

// ============================================================================
// Icons
// ============================================================================

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
    />
  </svg>
);

const MessageIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

const formatFullDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getDaysUntil = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// Main Component
// ============================================================================

export const PortalBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Refund state
  const [refundStatus, setRefundStatus] = useState<RefundStatusResponse | null>(null);
  const [creditMemo, setCreditMemo] = useState<CreditMemo | null>(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Load booking
  useEffect(() => {
    const loadBooking = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const bookingData = await bookingService.getBooking(id);
        setBooking(bookingData);

        // Load refund status
        try {
          const refundData = await refundService.getRefundStatus(id);
          setRefundStatus(refundData);

          // Load credit memo if available
          if (refundData.active_request?.credit_memo_id) {
            try {
              const memo = await creditMemoService.getCreditMemo(refundData.active_request.credit_memo_id);
              setCreditMemo(memo);
            } catch (err) {
              console.error('Failed to load credit memo:', err);
            }
          }
        } catch (err) {
          // Silent fail - refund status might not exist
          console.log('No refund status found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setIsLoading(false);
      }
    };

    loadBooking();
  }, [id]);

  // Computed values
  const canCancel = useMemo(() => {
    if (!booking) return false;
    return isBookingCancellable(booking.booking_status);
  }, [booking]);

  const daysUntilCheckIn = useMemo(() => {
    if (!booking) return 0;
    return getDaysUntil(booking.check_in_date);
  }, [booking]);

  const isUpcoming = daysUntilCheckIn >= 0 && booking?.booking_status !== 'cancelled';

  const canRequestRefund = useMemo(() => {
    if (!booking || !refundStatus) return false;
    return refundStatus.can_request_refund && !refundStatus.has_active_request;
  }, [booking, refundStatus]);

  // Handle refund submission
  const handleSubmitRefund = async (data: CreateRefundRequestDTO) => {
    if (!booking) return;

    setIsSubmittingRefund(true);
    try {
      await refundService.createRefundRequest(booking.id, data);
      setShowRefundForm(false);
      // Reload refund status
      const refundData = await refundService.getRefundStatus(booking.id);
      setRefundStatus(refundData);
      // Show success message
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit refund request');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!booking) return;

    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(booking.id, { reason: cancelReason });
      // Reload booking
      const updatedBooking = await bookingService.getBooking(booking.id);
      setBooking(updatedBooking);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download
  const handleDownload = async () => {
    if (!booking) return;
    try {
      await bookingService.generateInvoice(booking.id);
    } catch (err) {
      console.error('Failed to generate invoice:', err);
    }
  };

  // Handle message host
  const handleMessageHost = () => {
    if (!booking?.property_id) return;
    navigate(`/manage/chat/conversations?property=${booking.property_id}&booking=${booking.id}`);
  };

  // Render loading
  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // Render error
  if (error || !booking) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto">
          <Alert variant="error" className="mb-4">
            {error || 'Booking not found'}
          </Alert>
          <Button variant="outline" onClick={() => navigate('/portal/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portal/bookings')}
              leftIcon={<ArrowLeftIcon />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Booking Details
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {booking.booking_reference}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<PrintIcon />}>
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} leftIcon={<DownloadIcon />}>
              Download
            </Button>
          </div>
        </div>

        {/* Status banner */}
        {isUpcoming && daysUntilCheckIn <= 7 && (
          <Alert variant="info" className="mb-6">
            <span className="font-semibold">
              {daysUntilCheckIn === 0
                ? 'Check-in is today!'
                : daysUntilCheckIn === 1
                  ? 'Check-in is tomorrow!'
                  : `Your stay is in ${daysUntilCheckIn} days`}
            </span>
          </Alert>
        )}

        {booking.booking_status === 'cancelled' && (
          <Alert variant="error" className="mb-6">
            This booking has been cancelled.
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Card */}
            <Card>
              <Card.Body>
                <div className="flex gap-4">
                  {/* Property image placeholder */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-border flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <HomeIcon />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.property_name || 'Property'}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={handleMessageHost}
                      leftIcon={<MessageIcon />}
                    >
                      Message Host
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Stay Details */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-gray-900 dark:text-white">Stay Details</h3>
              </Card.Header>
              <Card.Body className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CalendarIcon />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Check-in</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatFullDate(booking.check_in_date)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">From 2:00 PM</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarIcon />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Check-out</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatFullDate(booking.check_out_date)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Before 10:00 AM</div>
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-start gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <UserIcon />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Guests</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                      {booking.children > 0 && `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}`}
                    </div>
                  </div>
                </div>

                {/* Rooms */}
                {booking.rooms && booking.rooms.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Rooms</h4>
                    {booking.rooms.map((room, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="text-gray-600 dark:text-gray-400">
                          {room.room_name || 'Room'}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(room.room_subtotal || 0, booking.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add-ons */}
                {booking.addons && booking.addons.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add-ons</h4>
                    {booking.addons.map((addon, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="text-gray-600 dark:text-gray-400">
                          {addon.quantity > 1 && `${addon.quantity}x `}
                          {addon.addon_name || 'Add-on'}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(addon.addon_total || 0, booking.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Special requests */}
                {booking.special_requests && (
                  <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Special Requests
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.special_requests}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Guest Details */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold text-gray-900 dark:text-white">Guest Details</h3>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <UserIcon />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {booking.guest_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <EmailIcon />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {booking.guest_email}
                      </div>
                    </div>
                  </div>
                  {booking.guest_phone && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon />
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {booking.guest_phone}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Payment Summary */}
              <Card>
                <Card.Header>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Payment Summary</h3>
                </Card.Header>
                <Card.Body className="space-y-4">
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[booking.booking_status].bg} ${BOOKING_STATUS_COLORS[booking.booking_status].text}`}
                    >
                      {BOOKING_STATUS_LABELS[booking.booking_status]}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[booking.payment_status]?.bg || 'bg-gray-100'} ${PAYMENT_STATUS_COLORS[booking.payment_status]?.text || 'text-gray-800'}`}
                    >
                      {PAYMENT_STATUS_LABELS[booking.payment_status]}
                    </span>
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(booking.subtotal, booking.currency)}
                      </span>
                    </div>
                    {booking.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span>-{formatCurrency(booking.discount_amount, booking.currency)}</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between border-t border-gray-200 dark:border-dark-border pt-4">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(booking.total_amount, booking.currency)}
                    </span>
                  </div>

                  {/* Payment details */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <div>Method: {booking.payment_method ? (PAYMENT_METHOD_LABELS[booking.payment_method] || booking.payment_method) : 'Not specified'}</div>
                    {booking.payment_reference && (
                      <div>Reference: {booking.payment_reference}</div>
                    )}
                  </div>
                </Card.Body>
              </Card>

              {/* Refund Section */}
              {(refundStatus?.has_active_request || canRequestRefund) && (
                <Card>
                  <Card.Header>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Refund</h3>
                  </Card.Header>
                  <Card.Body className="space-y-4">
                    {/* Show refund form if user clicks request refund */}
                    {showRefundForm && booking && (
                      <div>
                        <RefundRequestForm
                          booking={booking}
                          onSubmit={handleSubmitRefund}
                          onCancel={() => setShowRefundForm(false)}
                        />
                      </div>
                    )}

                    {/* Show request refund button if eligible */}
                    {!showRefundForm && canRequestRefund && (
                      <div>
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={() => setShowRefundForm(true)}
                        >
                          Request Refund
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Review our cancellation policy before requesting a refund.
                        </p>
                      </div>
                    )}

                    {/* Show refund status if exists */}
                    {!showRefundForm && refundStatus?.active_request && (
                      <div className="space-y-4">
                        <RefundStatusDisplay
                          refundRequest={refundStatus.active_request}
                          currency={booking?.currency}
                        />
                        <RefundTimeline refundRequest={refundStatus.active_request} />
                        {creditMemo && <CreditMemoViewer creditMemo={creditMemo} />}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Actions */}
              {canCancel && (
                <Card>
                  <Card.Body>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Actions</h4>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setShowCancelModal(true)}
                      leftIcon={<XIcon />}
                    >
                      Cancel Booking
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Cancellation policy may apply. Check with the property for details.
                    </p>
                  </Card.Body>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          size="md"
        >
          <Modal.Header>
            <h3 className="font-semibold text-gray-900 dark:text-white">Cancel Booking</h3>
          </Modal.Header>
          <Modal.Body>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to cancel this booking? This action may be subject to the
              property&apos;s cancellation policy.
            </p>
            <Textarea
              label="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let us know why you're cancelling..."
              rows={3}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Keep Booking
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              isLoading={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              Cancel Booking
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
};

export default PortalBookingDetailPage;
