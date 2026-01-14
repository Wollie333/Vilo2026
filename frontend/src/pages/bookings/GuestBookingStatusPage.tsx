/**
 * GuestBookingStatusPage Component
 *
 * Guest-facing booking status view for tracking payments and booking details.
 * Accessible at /guest/bookings/:id or /portal/bookings/:id
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Spinner,
  Alert,
  Card,
  StatCard,
  Badge,
  EmptyState,
  Input,
  Select,
} from '@/components/ui';
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  BookingSourceBadge,
  GuestInfoDisplay,
  StayInfoDisplay,
  BookingPricingDisplay,
  PaymentHistoryTable,
  BookingHistoryTimeline,
  PaymentProofViewer,
  PaymentStatusBanner,
} from '@/components/features';
import { bookingService, invoiceService } from '@/services';
import type {
  BookingWithDetails,
  TimelineEvent,
  CreateBookingPaymentRequest,
  PaymentMethod,
} from '@/types/booking.types';
import {
  formatBookingReference,
  formatCurrency,
  formatDateRange,
  isBookingCancellable,
  BOOKING_STATUS_LABELS,
} from '@/types/booking.types';
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineCash,
  HiOutlineXCircle,
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineUpload,
  HiOutlineDownload,
} from 'react-icons/hi';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// Component
// ============================================================================

export const GuestBookingStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Booking history
  const [history, setHistory] = useState<TimelineEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('eft');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchBooking = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getBooking(id);

      // Access control: Check if current user is the guest for this booking
      if (user && data.guest_id !== user.id) {
        setError('You do not have permission to view this booking');
        return;
      }

      setBooking(data);
    } catch (err) {
      setError('Failed to load booking');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  const fetchHistory = useCallback(async () => {
    if (!id) return;

    try {
      setHistoryLoading(true);
      const data = await bookingService.getBookingHistory(id);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load booking history:', err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
    fetchHistory();
  }, [fetchBooking, fetchHistory]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleUploadPaymentProof = () => {
    if (!booking) return;
    navigate(`/bookings/${booking.id}/upload-proof`);
  };

  const handleViewInvoice = async () => {
    if (!booking?.invoice_id) return;

    try {
      setActionLoading('view-invoice');
      await invoiceService.downloadInvoice(booking.invoice_id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open invoice';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    // Redirect to a cancellation request page or show a modal
    // For now, we'll just alert the user
    setError('To cancel your booking, please contact the property directly');
  };

  const handleRecordPayment = async () => {
    if (!booking || !paymentAmount) return;

    const balance = booking.total_amount - booking.amount_paid;

    // Validate payment amount
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    if (amount > balance) {
      setError(`Payment amount cannot exceed outstanding balance of ${formatCurrency(balance, booking.currency)}`);
      return;
    }

    try {
      setActionLoading('payment');
      setError(null);

      const data: CreateBookingPaymentRequest = {
        amount,
        currency: booking.currency,
        payment_method: paymentMethod,
        payment_reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
        status: 'completed',
        paid_at: new Date().toISOString(),
      };

      await bookingService.recordPayment(booking.id, data);

      // Reset form
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setPaymentMethod('eft');

      // Refresh booking data
      await fetchBooking();

      setSuccess('Payment recorded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading) {
    return (
      <AuthenticatedLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error && !booking) {
    return (
      <AuthenticatedLayout title="Booking Not Found">
        <Card>
          <Card.Body className="text-center py-12">
            <Alert variant="error">{error}</Alert>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </AuthenticatedLayout>
    );
  }

  if (!booking) {
    return (
      <AuthenticatedLayout title="Booking Not Found">
        <Card>
          <Card.Body className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Booking not found</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </AuthenticatedLayout>
    );
  }

  // ============================================================================
  // Computed Values
  // ============================================================================

  const balance = booking.total_amount - booking.amount_paid;
  const totalGuests = booking.adults + (booking.children || 0) + (booking.infants || 0);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthenticatedLayout
      title="My Booking"
      subtitle={formatBookingReference(booking.booking_reference)}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex-shrink-0"
          >
            <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Header - Booking Overview Card */}
        <Card variant="gradient" className="overflow-hidden">
          <Card.Body className="p-6">
            <div className="flex flex-col gap-6">
              {/* Top Row: Booking Reference, Status Badges, Property */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                      {formatBookingReference(booking.booking_reference)}
                    </h1>
                    {booking.property_name && (
                      <Badge variant="info" size="md">
                        <HiOutlineHome className="w-4 h-4 mr-1" />
                        {booking.property_name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <BookingStatusBadge status={booking.booking_status} size="md" />
                    <PaymentStatusBadge status={booking.payment_status} size="md" />
                    <BookingSourceBadge source={booking.source} size="md" />
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Booked on {new Date(booking.created_at).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:w-auto w-full">
                  <StatCard
                    title="Total Amount"
                    variant="primary"
                    size="sm"
                    value={formatCurrency(booking.total_amount, booking.currency)}
                    icon={<HiOutlineCash />}
                  />
                  <StatCard
                    title="Nights"
                    variant="success"
                    size="sm"
                    value={booking.total_nights.toString()}
                    icon={<HiOutlineCalendar />}
                  />
                  <StatCard
                    title="Guests"
                    variant="info"
                    size="sm"
                    value={totalGuests.toString()}
                    icon={<HiOutlineUserGroup />}
                  />
                  <StatCard
                    title="Balance"
                    variant={balance > 0 ? 'warning' : 'success'}
                    size="sm"
                    value={formatCurrency(balance, booking.currency)}
                    icon={<HiOutlineCash />}
                  />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Balance Due Alert */}
        {balance > 0 && (
          <Alert variant="warning">
            <div className="flex items-center justify-between">
              <span>
                Outstanding balance: <strong>{formatCurrency(balance, booking.currency)}</strong>
              </span>
              {booking.payment_method === 'eft' && !booking.payment_proof_url && (
                <Button size="sm" onClick={handleUploadPaymentProof}>
                  <HiOutlineUpload className="w-4 h-4 mr-2" />
                  Upload Payment Proof
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* Payment Status Banner */}
        <PaymentStatusBanner
          paymentStatus={booking.payment_status}
          paymentMethod={booking.payment_method}
          bookingId={booking.id}
          balanceRemaining={balance}
          currency={booking.currency}
          hasUploadedProof={!!booking.payment_proof_url}
          rejectionReason={booking.payment_rejection_reason}
          failedCheckoutAt={booking.failed_checkout_at}
          showActions={true}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stay Details */}
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <HiOutlineCalendar className="w-5 h-5" />
                  <span>Stay Details</span>
                </div>
              </Card.Header>
              <Card.Body>
                <StayInfoDisplay
                  checkIn={booking.check_in_date}
                  checkOut={booking.check_out_date}
                  nights={booking.total_nights}
                  propertyName={booking.property_name}
                  rooms={booking.rooms?.map(r => ({
                    room_name: r.room_name,
                    room_code: r.room_code,
                    adults: r.adults,
                    children: r.children,
                  }))}
                />
              </Card.Body>
            </Card>

            {/* Guest Information */}
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <HiOutlineUser className="w-5 h-5" />
                  <span>Guest Information</span>
                </div>
              </Card.Header>
              <Card.Body>
                <GuestInfoDisplay
                  name={booking.guest_name}
                  email={booking.guest_email}
                  phone={booking.guest_phone}
                  adults={booking.adults}
                  children={booking.children}
                  infants={booking.infants}
                />
              </Card.Body>
            </Card>

            {/* Rooms Breakdown */}
            {booking.rooms && booking.rooms.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <HiOutlineCube className="w-5 h-5" />
                  Your Rooms
                </h3>
                {(booking.rooms || []).map((room) => (
                  <Card
                    key={room.id}
                    variant="elevated"
                    className="transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg"
                  >
                    <Card.Body className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Room Image or Placeholder */}
                        <div className="relative flex-shrink-0 w-full sm:w-28 h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {room.featured_image ? (
                            <img
                              src={room.featured_image}
                              alt={room.room_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HiOutlineCube className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Room Details */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                {room.room_name}
                              </h4>
                              {room.room_code && (
                                <Badge variant="secondary" size="sm">
                                  {room.room_code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <HiOutlineUserGroup className="w-4 h-4" />
                                <span>{room.adults} adult{room.adults !== 1 ? 's' : ''}</span>
                              </div>
                              {room.children > 0 && (
                                <div className="flex items-center gap-1">
                                  <HiOutlineUser className="w-4 h-4" />
                                  <span>{room.children} child{room.children !== 1 ? 'ren' : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Room Price */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Room Rate</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(room.room_subtotal, room.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}

            {/* Add-ons */}
            {booking.addons && booking.addons.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <HiOutlineTag className="w-5 h-5" />
                  Add-ons
                </h3>
                {(booking.addons || []).map((addon) => (
                  <Card
                    key={addon.id}
                    variant="elevated"
                    className="transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg"
                  >
                    <Card.Body className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {/* Add-on Image or Placeholder */}
                        <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {addon.image_url ? (
                            <img
                              src={addon.image_url}
                              alt={addon.addon_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HiOutlineTag className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Add-on Details */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                              {addon.addon_name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(addon.unit_price, addon.currency)} × {addon.quantity} unit{addon.quantity !== 1 ? 's' : ''}
                            </p>
                          </div>

                          {/* Add-on Price */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subtotal</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(addon.addon_total, addon.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}

            {/* Special Requests */}
            {booking.special_requests && (
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <HiOutlineDocumentText className="w-5 h-5" />
                    <span>Special Requests</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {booking.special_requests}
                  </p>
                </Card.Body>
              </Card>
            )}

            {/* Make Payment Form */}
            {balance > 0 && booking.booking_status !== 'cancelled' && (
              <Card variant={showPaymentForm ? 'highlight' : 'default'}>
                <Card.Header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HiOutlineCash className="w-5 h-5" />
                    <span className="font-semibold">Make a Payment</span>
                  </div>
                  <Button
                    size="sm"
                    variant={showPaymentForm ? 'outline' : 'primary'}
                    onClick={() => {
                      setShowPaymentForm(!showPaymentForm);
                      if (!showPaymentForm) {
                        // Reset form when opening
                        setPaymentAmount('');
                        setPaymentMethod('eft');
                        setPaymentReference('');
                        setPaymentNotes('');
                      }
                    }}
                  >
                    {showPaymentForm ? 'Cancel' : (
                      <>
                        <HiOutlineCash className="w-4 h-4 mr-2" />
                        Make Payment
                      </>
                    )}
                  </Button>
                </Card.Header>
                {showPaymentForm && (
                  <Card.Body className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <div className="space-y-4">
                      {/* Info Banner */}
                      <Alert variant="info">
                        <div className="flex items-start gap-2">
                          <HiOutlineCash className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium mb-1">Making a Partial Payment</p>
                            <p className="text-sm">
                              You can pay any amount up to your outstanding balance of{' '}
                              <strong>{formatCurrency(balance, booking.currency)}</strong>.
                              Multiple payments are supported until your balance reaches zero.
                            </p>
                          </div>
                        </div>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payment Amount <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            min="0"
                            step="0.01"
                            max={balance.toString()}
                            className="w-full"
                            error={
                              paymentAmount && parseFloat(paymentAmount) > balance
                                ? 'Amount exceeds balance'
                                : undefined
                            }
                          />
                          {paymentAmount && (
                            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Remaining after this payment:{' '}
                                <strong className="text-gray-900 dark:text-white">
                                  {formatCurrency(
                                    balance - (parseFloat(paymentAmount) || 0),
                                    booking.currency
                                  )}
                                </strong>
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payment Method <span className="text-red-500">*</span>
                          </label>
                          <Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            className="w-full"
                          >
                            <option value="eft">EFT / Bank Transfer</option>
                            <option value="card">Card Payment</option>
                            <option value="cash">Cash</option>
                            <option value="payfast">PayFast</option>
                            <option value="other">Other</option>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Payment Reference (Optional)
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., Transaction ID, Confirmation number"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes (Optional)
                        </label>
                        <Input
                          type="text"
                          placeholder="Any additional information"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowPaymentForm(false);
                            setPaymentAmount('');
                            setPaymentMethod('eft');
                            setPaymentReference('');
                            setPaymentNotes('');
                          }}
                          disabled={actionLoading === 'payment'}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleRecordPayment}
                          isLoading={actionLoading === 'payment'}
                          disabled={
                            !paymentAmount ||
                            parseFloat(paymentAmount) <= 0 ||
                            parseFloat(paymentAmount) > balance
                          }
                        >
                          <HiOutlineCheckCircle className="w-4 h-4 mr-2" />
                          Submit Payment
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                )}
              </Card>
            )}

            {/* Payment History */}
            {booking.payments && booking.payments.length > 0 && (
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <HiOutlineCash className="w-5 h-5" />
                    <span>Payment History</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <PaymentHistoryTable
                    payments={booking?.payments || []}
                    bookingId={booking.id}
                    onDownloadReceipt={async (paymentId) => {
                      return await bookingService.downloadPaymentReceipt(booking.id, paymentId);
                    }}
                  />
                </Card.Body>
              </Card>
            )}

            {/* Booking Timeline */}
            <Card>
              <Card.Header className="flex items-center gap-2">
                <HiOutlineClock className="w-5 h-5" />
                <span>Booking Timeline</span>
              </Card.Header>
              <Card.Body>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="md" />
                  </div>
                ) : history && history.length > 0 ? (
                  <BookingHistoryTimeline events={history} />
                ) : (
                  <EmptyState
                    icon={HiOutlineClock}
                    title="No History Available"
                    description="Your booking timeline will appear here as updates occur"
                  />
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Right Column - Payment & Actions */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <HiOutlineCash className="w-5 h-5" />
                  <span>Payment Summary</span>
                </div>
              </Card.Header>
              <Card.Body>
                <BookingPricingDisplay
                  roomTotal={booking.room_total}
                  addonsTotal={booking.addons_total}
                  discountAmount={booking.discount_amount}
                  taxAmount={booking.tax_amount}
                  totalAmount={booking.total_amount}
                  amountPaid={booking.amount_paid}
                  currency={booking.currency}
                />
              </Card.Body>
            </Card>

            {/* Payment Proof Section (for EFT payments) */}
            {booking.payment_method === 'eft' && booking.payment_proof_url && (
              <Card id="payment-proof-section">
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <HiOutlineDocumentText className="w-5 h-5" />
                    <span>Payment Proof</span>
                  </div>
                </Card.Header>
                <Card.Body className="space-y-4">
                  <PaymentProofViewer
                    proofUrl={booking.payment_proof_url}
                    fileName={booking.payment_proof_url.split('/').pop()}
                    uploadedAt={booking.payment_proof_uploaded_at}
                    isVerified={booking.payment_status === 'paid' && !!booking.payment_verified_at}
                    verifiedAt={booking.payment_verified_at}
                    rejectionReason={booking.payment_rejection_reason}
                    allowFullScreen={true}
                  />

                  {/* Re-upload if rejected */}
                  {booking.payment_rejection_reason && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        className="w-full"
                        onClick={handleUploadPaymentProof}
                        variant="primary"
                      >
                        <HiOutlineUpload className="w-5 h-5 mr-2" />
                        Upload New Payment Proof
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Upload Payment Proof Button (for EFT payments pending proof) */}
            {booking.payment_method === 'eft' &&
             !booking.payment_proof_url &&
             booking.payment_status === 'pending' && (
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <HiOutlineDocumentText className="w-5 h-5" />
                    <span>Payment Proof Required</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Please upload proof of your bank transfer to confirm your payment.
                    </p>
                    <Button
                      className="w-full"
                      onClick={handleUploadPaymentProof}
                    >
                      <HiOutlineUpload className="w-5 h-5 mr-2" />
                      Upload Payment Proof
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Invoice */}
            {booking.invoice_id && (
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <HiOutlineDocumentText className="w-5 h-5" />
                    <span>Invoice</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />
                      <span>Invoice generated</span>
                    </div>
                    {booking.invoice_generated_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Generated on {new Date(booking.invoice_generated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleViewInvoice}
                      isLoading={actionLoading === 'view-invoice'}
                    >
                      <HiOutlineDownload className="w-5 h-5 mr-2" />
                      Download Invoice
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Coupon Info */}
            {booking.coupon_code && (
              <Card>
                <Card.Header>Discount Applied</Card.Header>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {booking.coupon_code}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(booking.discount_amount, booking.currency)}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <Card.Header>Actions</Card.Header>
              <Card.Body className="space-y-2">
                {booking.invoice_id && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleViewInvoice}
                    isLoading={actionLoading === 'view-invoice'}
                  >
                    <HiOutlineDocumentText className="w-4 h-4 mr-2" />
                    View Invoice
                  </Button>
                )}
                {isBookingCancellable(booking.booking_status) && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleCancelBooking}
                  >
                    <HiOutlineXCircle className="w-4 h-4 mr-2" />
                    Request Cancellation
                  </Button>
                )}
                {booking.external_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(booking.external_url!, '_blank')}
                  >
                    View External Booking
                  </Button>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};
