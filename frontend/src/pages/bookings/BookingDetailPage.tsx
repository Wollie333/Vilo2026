/**
 * BookingDetailPage Component
 *
 * Comprehensive booking detail view with tabs for managing all aspects of a booking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import {
  Button,
  Spinner,
  Alert,
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Modal,
  Input,
  Select,
  Textarea,
  StatCard,
  Badge,
  EmptyState,
} from '@/components/ui';
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  BookingSourceBadge,
  GuestInfoDisplay,
  StayInfoDisplay,
  BookingPricingDisplay,
  PaymentScheduleDisplay,
  PaymentHistoryTable,
  RefundRequestForm,
  RefundStatusDisplay,
  RefundTimeline,
  BookingHistoryTimeline,
  BookingLockBanner,
  PaymentProofViewer,
  PaymentProofActions,
  PaymentStatusBanner,
  BookingDetailSidebar,
  BookingJourneyProgress,
  BookingSummaryPanel,
  EnhancedRoomCard,
  EnhancedAddonCard,
} from '@/components/features';
import {
  RefundApprovalForm,
  RefundProcessingPanel,
  RefundCommentThread,
  DocumentList,
} from '@/components/features/Refund';
import { RefundStatusPill } from '@/components/ui';
import { bookingService, paymentScheduleService, refundService, invoiceService, reviewService } from '@/services';
import type {
  BookingWithDetails,
  BookingStatus,
  PaymentMethod,
  CreateBookingPaymentRequest,
  CancelBookingRequest,
  TimelineEvent,
} from '@/types/booking.types';
import type { RefundRequest } from '@/types';
import {
  formatBookingReference,
  formatCurrency,
  formatDateRange,
  getNextStatusOptions,
  BOOKING_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  isBookingCancellable,
  canCheckIn,
  canCheckOut,
} from '@/types/booking.types';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineDocumentText,
  HiOutlineMail,
  HiOutlineCash,
  HiOutlineXCircle,
  HiOutlineCheck,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineCreditCard,
  HiOutlineGlobe,
  HiOutlineCurrencyDollar,
  HiOutlineLockClosed,
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineStar,
  HiChevronUp,
  HiChevronDown,
  HiOutlineInformationCircle,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

// ============================================================================
// Component
// ============================================================================

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();

  // Data state
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);

  // Inline form states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);

  // Refund data
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);

  // Refund admin workflow states
  const [showApprovalForm, setShowApprovalForm] = useState<string | null>(null);
  const [showRejectionForm, setShowRejectionForm] = useState<string | null>(null);
  const [showProcessingPanel, setShowProcessingPanel] = useState<string | null>(null);
  const [expandedRefundDetails, setExpandedRefundDetails] = useState<string | null>(null);
  const [processingMethodId, setProcessingMethodId] = useState<string | null>(null);

  // Refund comments and documents
  const [refundComments, setRefundComments] = useState<Record<string, any[]>>({});
  const [refundDocuments, setRefundDocuments] = useState<Record<string, any[]>>({});

  // Booking history
  const [history, setHistory] = useState<TimelineEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('eft');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Cancel form
  const [cancelReason, setCancelReason] = useState('');

  // Status form
  const [newStatus, setNewStatus] = useState<BookingStatus | ''>('');
  const [statusReason, setStatusReason] = useState('');

  // Notes form
  const [internalNotes, setInternalNotes] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Payment schedule
  const [paymentSchedule, setPaymentSchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Payment banner visibility
  const [paymentBannerVisible, setPaymentBannerVisible] = useState(true);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchBooking = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getBooking(id);
      setBooking(data);
      setInternalNotes(data.internal_notes || '');
    } catch (err) {
      setError('Failed to load booking');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPaymentSchedule = useCallback(async () => {
    if (!id) return;

    try {
      setScheduleLoading(true);
      const schedule = await paymentScheduleService.getBookingPaymentSchedule(id);
      setPaymentSchedule(schedule);
    } catch (err) {
      // Silent fail - schedule might not exist for all bookings
      console.log('No payment schedule found');
      setPaymentSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  }, [id]);

  const fetchRefunds = useCallback(async () => {
    if (!id) return;

    try {
      setRefundsLoading(true);
      const result = await refundService.getBookingRefunds(id);
      setRefunds(result);
    } catch (err) {
      // Silent fail - booking might not have any refunds
      console.log('No refunds found');
      setRefunds([]);
    } finally {
      setRefundsLoading(false);
    }
  }, [id]);

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
    fetchPaymentSchedule();
    fetchRefunds();
    fetchHistory();
  }, [fetchBooking, fetchPaymentSchedule, fetchRefunds, fetchHistory]);

  // Check if edit mode from URL
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setActiveTab('overview');
    }
  }, [searchParams]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRecordPayment = async () => {
    if (!booking || !paymentAmount) return;

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
      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setSuccess('Payment recorded successfully');
      fetchBooking();
      fetchPaymentSchedule(); // Reload payment schedule
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !cancelReason) return;

    try {
      setActionLoading('cancel');
      const data: CancelBookingRequest = {
        reason: cancelReason,
        notify_guest: true,
      };

      await bookingService.cancelBooking(booking.id, data);
      setCancelModalOpen(false);
      setCancelReason('');
      setSuccess('Booking cancelled successfully');
      fetchBooking();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel booking';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async () => {
    if (!booking || !newStatus) return;

    try {
      setActionLoading('status');
      await bookingService.updateBookingStatus(booking.id, {
        status: newStatus,
        reason: statusReason || undefined,
      });
      setStatusModalOpen(false);
      setNewStatus('');
      setStatusReason('');
      setSuccess('Status updated successfully');
      fetchBooking();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async () => {
    if (!booking) return;

    try {
      setActionLoading('checkin');
      await bookingService.checkIn(booking.id);
      setSuccess('Guest checked in successfully');
      fetchBooking();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async () => {
    if (!booking) return;

    try {
      setActionLoading('checkout');
      await bookingService.checkOut(booking.id);
      setSuccess('Guest checked out successfully');
      fetchBooking();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check out';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!booking) return;

    try {
      setActionLoading('notes');
      await bookingService.updateInternalNotes(booking.id, internalNotes);
      setSuccess('Notes updated successfully');
      fetchBooking();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notes';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendConfirmation = async () => {
    if (!booking) return;

    try {
      setActionLoading('email');
      await bookingService.sendConfirmationEmail(booking.id);
      setSuccess('Confirmation email sent successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendReviewRequest = async () => {
    if (!booking) return;

    try {
      setActionLoading('review');
      await reviewService.sendReviewRequest(booking.id);
      setSuccess('Review request sent successfully to guest');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send review request';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!booking) return;

    try {
      setActionLoading('invoice');
      const result = await bookingService.generateInvoice(booking.id);
      // Open invoice in new tab
      window.open(result.invoice_url, '_blank');
      setSuccess('Invoice generated successfully');
      fetchBooking();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate invoice';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefundSubmit = async (data: any) => {
    if (!booking) return;

    try {
      await refundService.createRefundRequest(booking.id, data);
      setShowRefundForm(false);
      setSuccess('Refund request submitted successfully');
      fetchRefunds();
      fetchBooking(); // Refresh booking to get updated refund status
      fetchHistory(); // Refresh history to show the new refund request
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit refund request';
      setError(errorMessage);
      throw error; // Re-throw so the form can handle it
    }
  };

  const handleWithdraw = async (refundId: string) => {
    try {
      setActionLoading(`withdraw-${refundId}`);
      await refundService.withdrawRefund(refundId);
      setSuccess('Refund request withdrawn successfully');
      fetchRefunds(); // Refresh refund list
      fetchBooking(); // Refresh booking to update refund status
      fetchHistory(); // Refresh history to show withdrawal
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to withdraw refund request';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Refund Admin Handlers
  const handleApproveRefund = async (refundId: string, data: any) => {
    try {
      setActionLoading(`approve-${refundId}`);
      await refundService.approveRefund(refundId, {
        approved_amount: data.approvedAmount,
        internal_notes: data.internalNotes,
        customer_notes: data.customerNotes,
      });
      setSuccess('Refund approved successfully');
      setShowApprovalForm(null);
      fetchRefunds();
      fetchBooking();
      fetchHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve refund';
      setError(errorMessage);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRefund = async (refundId: string, data: any) => {
    try {
      setActionLoading(`reject-${refundId}`);
      await refundService.rejectRefund(refundId, {
        customer_notes: data.rejectionReason || data.customerNotes || 'Request rejected',
        internal_notes: data.internalNotes,
      });
      setSuccess('Refund rejected');
      setShowRejectionForm(null);
      fetchRefunds();
      fetchBooking();
      fetchHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject refund';
      setError(errorMessage);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessRefund = async (refundId: string, methodId: string) => {
    try {
      setProcessingMethodId(methodId);
      await refundService.processRefundForMethod(refundId, methodId);
      setSuccess('Refund processed successfully');
      fetchRefunds();
      fetchBooking();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process refund';
      setError(errorMessage);
    } finally {
      setProcessingMethodId(null);
    }
  };

  const handleAddComment = async (refundId: string, text: string, isInternal: boolean) => {
    try {
      const comment = await refundService.addComment(refundId, {
        comment_text: text,
        is_internal: isInternal,
      });
      // Update local state
      setRefundComments((prev) => ({
        ...prev,
        [refundId]: [...(prev[refundId] || []), comment],
      }));
      setSuccess('Comment added');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      setError(errorMessage);
    }
  };

  const handleVerifyDocument = async (refundId: string, docId: string) => {
    try {
      setActionLoading(`verify-doc-${docId}`);
      await refundService.verifyDocument(refundId, docId);
      // Refresh documents
      const docs = await refundService.getDocuments(refundId);
      setRefundDocuments((prev) => ({ ...prev, [refundId]: docs }));
      setSuccess('Document verified');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify document';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDocument = async (refundId: string, docId: string) => {
    const reason = prompt('Please provide a reason for rejecting this document:');
    if (!reason) return;

    try {
      setActionLoading(`reject-doc-${docId}`);
      await refundService.rejectDocument(refundId, docId, reason);
      // Refresh documents
      const docs = await refundService.getDocuments(refundId);
      setRefundDocuments((prev) => ({ ...prev, [refundId]: docs }));
      setSuccess('Document rejected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject document';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDocument = async (refundId: string, docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setActionLoading(`delete-doc-${docId}`);
      await refundService.deleteDocument(refundId, docId);
      // Refresh documents
      const docs = await refundService.getDocuments(refundId);
      setRefundDocuments((prev) => ({ ...prev, [refundId]: docs }));
      setSuccess('Document deleted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch comments and documents for a refund
  const fetchRefundCommentsAndDocuments = async (refundId: string) => {
    try {
      const [comments, documents] = await Promise.all([
        refundService.getComments(refundId),
        refundService.getDocuments(refundId),
      ]);
      setRefundComments((prev) => ({ ...prev, [refundId]: comments }));
      setRefundDocuments((prev) => ({ ...prev, [refundId]: documents }));
    } catch (error) {
      console.error('Failed to fetch refund comments/documents:', error);
    }
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

  const handleDownloadInvoice = async () => {
    if (!booking?.invoice_id) return;

    try {
      setActionLoading('download-invoice');
      await invoiceService.downloadInvoice(booking.invoice_id);
      setSuccess('Invoice opened in new tab');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download invoice';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  // Check if there are any active refunds that would lock the booking
  const hasActiveRefunds = refunds.some((r) =>
    ['requested', 'under_review', 'approved', 'processing'].includes(r.status)
  );

  const activeRefunds = refunds.filter((r) =>
    ['requested', 'under_review', 'approved', 'processing'].includes(r.status)
  );

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

  if (!booking) {
    return (
      <AuthenticatedLayout title="Booking Not Found">
        <Card>
          <Card.Body className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Booking not found</p>
            <Button onClick={() => navigate('/bookings')} className="mt-4">
              Back to Bookings
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
  const statusOptions = getNextStatusOptions(booking.booking_status);
  const totalGuests = booking.adults + (booking.children || 0) + (booking.infants || 0);

  // Payment method options
  const paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthenticatedLayout
      title={formatBookingReference(booking.booking_reference)}
      subtitle={`${booking.guest_name} - ${formatDateRange(booking.check_in_date, booking.check_out_date)}`}
      noPadding
    >
      <div className="flex flex-col min-h-full">
        {/* Dark Top Bar (Always Visible) */}
        <BookingDetailSidebar
          booking={booking}
          onRecordPayment={() => {
            setActiveTab('payments');
            setShowPaymentForm(true);
          }}
          onSendConfirmation={handleSendConfirmation}
          onNavigateBack={() => navigate(-1)}
        />

        {/* Main Content + Sticky Summary Wrapper */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
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

        {/* Booking Lock Banner */}
        {hasActiveRefunds && (
          <BookingLockBanner
            activeRefunds={activeRefunds}
            onViewRefunds={() => setActiveTab('refunds')}
          />
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
          isVisible={paymentBannerVisible}
          onToggleVisibility={() => setPaymentBannerVisible(!paymentBannerVisible)}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="underline">
            <TabsTrigger value="overview" variant="underline" className="inline-flex items-center whitespace-nowrap">
              <HiOutlineHome className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="guests" variant="underline" className="inline-flex items-center whitespace-nowrap">
              <HiOutlineUserGroup className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Guests ({(booking?.adults || 0) + (booking?.children || 0) + (booking?.infants || 0)})</span>
            </TabsTrigger>
            <TabsTrigger value="payments" variant="underline" className="inline-flex items-center whitespace-nowrap">
              <HiOutlineCreditCard className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Payments ({booking?.payments?.length || 0})</span>
            </TabsTrigger>
            {(paymentSchedule?.length || 0) > 0 && (
              <TabsTrigger value="schedule" variant="underline" className="inline-flex items-center whitespace-nowrap">
                <HiOutlineCalendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Payment Schedule ({paymentSchedule?.length || 0})</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="refunds" variant="underline" className="inline-flex items-center whitespace-nowrap">
              <HiOutlineCurrencyDollar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Refunds ({refunds?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="notes" variant="underline" className="inline-flex items-center whitespace-nowrap">
              <HiOutlineDocumentText className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Notes</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" variant="underline" className="inline-flex items-center whitespace-nowrap">
              <HiOutlineDocumentText className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="history" variant="underline" className="inline-flex items-center whitespace-nowrap">
              <HiOutlineClock className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>History ({history?.length || 0})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
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

              {/* Rooms Breakdown */}
              {booking.rooms && booking.rooms.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <HiOutlineCube className="w-5 h-5" />
                    Rooms & Rates
                  </h3>
                  {(booking.rooms || []).map((room) => (
                    <EnhancedRoomCard
                      key={room.id}
                      room={{
                        id: room.id,
                        room_name: room.room_name,
                        room_code: room.room_code,
                        featured_image: room.featured_image || (room as any).image_url || (room as any).room_image || booking.property?.featured_image_url,
                        adults: room.adults,
                        children: room.children || 0,
                        room_subtotal: room.room_subtotal,
                      }}
                      currency={booking.currency}
                    />
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
                    <EnhancedAddonCard
                      key={addon.id}
                      addon={{
                        id: addon.id,
                        addon_name: addon.addon_name,
                        image_url: addon.image_url,
                        unit_price: addon.unit_price,
                        quantity: addon.quantity,
                        addon_total: addon.addon_total,
                      }}
                      currency={booking.currency}
                    />
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
          </div>
        )}

        {activeTab === 'guests' && (
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <HiOutlineUserGroup className="w-5 h-5" />
                <span>Guest List</span>
              </div>
            </Card.Header>
            <Card.Body>
              {booking.guests && booking.guests.length > 0 ? (
                <div className="space-y-4">
                  {(booking.guests || []).map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {guest.full_name}
                          </p>
                          {guest.is_primary && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 rounded-full">
                              Primary
                            </span>
                          )}
                          {!guest.is_adult && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-full">
                              {guest.age ? `Age ${guest.age}` : 'Child'}
                            </span>
                          )}
                        </div>
                        {guest.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{guest.email}</p>
                        )}
                        {guest.phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{guest.phone}</p>
                        )}
                        {guest.nationality && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Nationality: {guest.nationality}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show primary guest from booking */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {booking.guest_name}
                        </p>
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 rounded-full">
                          Primary Guest
                        </span>
                      </div>
                      {booking.guest_email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{booking.guest_email}</p>
                      )}
                      {booking.guest_phone && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{booking.guest_phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Guest summary */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <HiOutlineUsers className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Guest Summary</h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                          <p><strong>{booking.adults || 0}</strong> Adult{(booking.adults || 0) !== 1 ? 's' : ''}</p>
                          {(booking.children || 0) > 0 && (
                            <p><strong>{booking.children}</strong> Child{booking.children !== 1 ? 'ren' : ''}</p>
                          )}
                          {(booking.infants || 0) > 0 && (
                            <p><strong>{booking.infants}</strong> Infant{booking.infants !== 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Additional guest details can be added through the booking management system.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Record Payment Form - Inline */}
            {balance > 0 && (
              <Card variant={showPaymentForm ? 'highlight' : 'default'}>
                <Card.Header className="flex items-center justify-between">
                  <span className="font-semibold">Record Payment</span>
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
                        Add Payment
                      </>
                    )}
                  </Button>
                </Card.Header>
                {showPaymentForm && (
                  <Card.Body className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder={`e.g., ${balance.toFixed(2)}`}
                            step="0.01"
                            min="0"
                            max={balance}
                            error={paymentAmount && parseFloat(paymentAmount) > balance ? 'Exceeds balance' : undefined}
                            fullWidth
                          />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Outstanding: <span className="font-semibold">{formatCurrency(balance, booking.currency)}</span>
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payment Method <span className="text-red-500">*</span>
                          </label>
                          <Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            options={paymentMethodOptions}
                            fullWidth
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Payment Reference
                        </label>
                        <Input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="e.g., Transaction ID, Check Number, etc."
                          fullWidth
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Optional reference number or transaction ID
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes
                        </label>
                        <Textarea
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="Optional notes about this payment..."
                          rows={2}
                          fullWidth
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
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={async () => {
                            await handleRecordPayment();
                            setShowPaymentForm(false);
                          }}
                          isLoading={actionLoading === 'payment'}
                          disabled={
                            !paymentAmount ||
                            parseFloat(paymentAmount) <= 0 ||
                            parseFloat(paymentAmount) > balance
                          }
                        >
                          <HiOutlineCash className="w-4 h-4 mr-2" />
                          Record Payment
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                )}
              </Card>
            )}

            {/* Payment History */}
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
          </div>
        )}

        {activeTab === 'schedule' && (
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <HiOutlineCalendar className="w-5 h-5" />
                <span>Payment Schedule</span>
              </div>
            </Card.Header>
            <Card.Body>
              {scheduleLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : (
                <PaymentScheduleDisplay
                  schedule={paymentSchedule}
                  currency={booking.currency}
                  totalAmount={booking.total_amount}
                  amountPaid={booking.amount_paid || 0}
                />
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'refunds' && (
          <div className="space-y-6">
            {/* Admin Pending Approvals Section */}
            {refunds.filter((r) => r.status === 'requested' || r.status === 'under_review').length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Approvals</h3>
                {refunds
                  .filter((r) => r.status === 'requested' || r.status === 'under_review')
                  .map((refund) => (
                    <Card
                      key={refund.id}
                      variant={
                        showApprovalForm === refund.id || showRejectionForm === refund.id
                          ? 'highlight'
                          : 'default'
                      }
                    >
                      <Card.Header>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold">
                              Refund Request #{refund.id.slice(0, 8)}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {formatCurrency(refund.requested_amount, refund.currency)} requested
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => {
                                setShowApprovalForm(refund.id);
                                setShowRejectionForm(null);
                              }}
                              disabled={showRejectionForm === refund.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setShowRejectionForm(refund.id);
                                setShowApprovalForm(null);
                              }}
                              disabled={showApprovalForm === refund.id}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card.Header>

                      {showApprovalForm === refund.id && (
                        <Card.Body>
                          <RefundApprovalForm
                            refund={refund}
                            booking={booking}
                            mode="approve"
                            onSubmit={(data) => handleApproveRefund(refund.id, data)}
                            onCancel={() => setShowApprovalForm(null)}
                          />
                        </Card.Body>
                      )}

                      {showRejectionForm === refund.id && (
                        <Card.Body>
                          <RefundApprovalForm
                            refund={refund}
                            booking={booking}
                            mode="reject"
                            onSubmit={(data) => handleRejectRefund(refund.id, data)}
                            onCancel={() => setShowRejectionForm(null)}
                          />
                        </Card.Body>
                      )}
                    </Card>
                  ))}
              </div>
            )}

            {/* Approved Refunds - Processing Section */}
            {refunds.filter((r) => r.status === 'approved').length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Approved Refunds</h3>
                {refunds
                  .filter((r) => r.status === 'approved')
                  .map((refund) => (
                    <Card key={refund.id}>
                      <Card.Header>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold">Refund #{refund.id.slice(0, 8)}</span>
                            <Badge variant="success" className="ml-2">
                              Approved
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              setShowProcessingPanel(
                                refund.id === showProcessingPanel ? null : refund.id
                              )
                            }
                          >
                            {showProcessingPanel === refund.id ? 'Hide' : 'Process Refund'}
                          </Button>
                        </div>
                      </Card.Header>

                      {showProcessingPanel === refund.id && (
                        <Card.Body>
                          <RefundProcessingPanel
                            refund={refund}
                            paymentMethods={booking.payments || []}
                            onProcess={(methodId) => handleProcessRefund(refund.id, methodId)}
                            processingMethodId={processingMethodId}
                          />
                        </Card.Body>
                      )}
                    </Card>
                  ))}
              </div>
            )}

            {/* Request Refund Form - Inline (only if eligible) */}
            {booking.amount_paid > 0 && booking.refund_status !== 'full' && (
              <Card variant={showRefundForm ? 'highlight' : 'default'}>
                <Card.Header className="flex items-center justify-between">
                  <span className="font-semibold">Request Refund</span>
                  <Button
                    size="sm"
                    variant={showRefundForm ? 'outline' : 'primary'}
                    onClick={() => setShowRefundForm(!showRefundForm)}
                  >
                    {showRefundForm ? 'Cancel' : (
                      <>
                        <HiOutlineCurrencyDollar className="w-4 h-4 mr-2" />
                        New Refund Request
                      </>
                    )}
                  </Button>
                </Card.Header>
                {showRefundForm && (
                  <Card.Body className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                    <RefundRequestForm
                      booking={booking}
                      onSubmit={handleRefundSubmit}
                      onCancel={() => setShowRefundForm(false)}
                    />
                  </Card.Body>
                )}
              </Card>
            )}

            {/* Refund Status Summary */}
            {booking.refund_status && booking.refund_status !== 'none' && (
              <Alert variant={booking.refund_status === 'full' ? 'success' : 'warning'}>
                <div className="flex items-center justify-between">
                  <span>
                    {booking.refund_status === 'full'
                      ? 'This booking has been fully refunded'
                      : 'This booking has been partially refunded'}
                  </span>
                  {booking.total_refunded && (
                    <span className="font-semibold">
                      {formatCurrency(booking.total_refunded, booking.currency)} refunded
                    </span>
                  )}
                </div>
              </Alert>
            )}

            {/* All Refund Requests - Expandable with Tabs */}
            {refunds && refunds.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Refund Requests</h3>
                {refunds.map((refund) => (
                  <Card key={refund.id}>
                    {/* Refund Header - Expandable */}
                    <Card.Header
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        const newExpanded = expandedRefundDetails === refund.id ? null : refund.id;
                        setExpandedRefundDetails(newExpanded);
                        if (newExpanded) {
                          fetchRefundCommentsAndDocuments(refund.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <RefundStatusDisplay refundRequest={refund} />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              #{refund.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Requested on{' '}
                            {new Date(refund.requested_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Requested</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(refund.requested_amount, refund.currency)}
                          </p>
                          {refund.approved_amount && refund.status !== 'rejected' && (
                            <>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">Approved</p>
                              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(refund.approved_amount, refund.currency)}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="ml-4">
                          <Button variant="ghost" size="sm">
                            {expandedRefundDetails === refund.id ? (
                              <HiChevronUp className="w-5 h-5" />
                            ) : (
                              <HiChevronDown className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card.Header>

                    {/* Refund Details - Expandable Content with Tabs */}
                    {expandedRefundDetails === refund.id && (
                      <Card.Body>
                        <Tabs defaultValue="details">
                          <TabsList>
                            <TabsTrigger value="details">
                              <HiOutlineInformationCircle className="w-4 h-4 mr-2" />
                              Details
                            </TabsTrigger>
                            <TabsTrigger value="comments">
                              <HiOutlineChatAlt2 className="w-4 h-4 mr-2" />
                              Comments
                              {refundComments[refund.id]?.length > 0 && (
                                <Badge variant="primary" className="ml-2">
                                  {refundComments[refund.id].length}
                                </Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="documents">
                              <HiOutlineDocumentText className="w-4 h-4 mr-2" />
                              Documents
                              {refundDocuments[refund.id]?.length > 0 && (
                                <Badge variant="primary" className="ml-2">
                                  {refundDocuments[refund.id].length}
                                </Badge>
                              )}
                            </TabsTrigger>
                          </TabsList>

                          {/* Details Tab */}
                          <TabsContent value="details">
                            {/* Reason and Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1">Reason</p>
                                <p className="text-gray-900 dark:text-white font-medium">{refund.reason}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 dark:text-gray-400 mb-1">Requested By</p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                  {refund.requested_by_name || 'Guest'}
                                </p>
                              </div>
                              {refund.reviewed_at && (
                                <>
                                  <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Reviewed On</p>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                      {new Date(refund.reviewed_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                  {refund.reviewed_by_name && (
                                    <div>
                                      <p className="text-gray-500 dark:text-gray-400 mb-1">Reviewed By</p>
                                      <p className="text-gray-900 dark:text-white font-medium">
                                        {refund.reviewed_by_name}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                              {refund.review_notes && (
                                <div className="md:col-span-2">
                                  <p className="text-gray-500 dark:text-gray-400 mb-1">Admin Notes</p>
                                  <p className="text-gray-900 dark:text-white font-medium">{refund.review_notes}</p>
                                </div>
                              )}
                            </div>

                            {/* Timeline */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Timeline</h5>
                              <RefundTimeline refundRequest={refund} />
                            </div>

                            {/* Actions */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-3">
                              {['requested', 'under_review', 'approved'].includes(refund.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWithdraw(refund.id)}
                                  isLoading={actionLoading === `withdraw-${refund.id}`}
                                  disabled={actionLoading === `withdraw-${refund.id}`}
                                  className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-900/20"
                                >
                                  <HiOutlineXCircle className="w-4 h-4 mr-2" />
                                  Withdraw Request
                                </Button>
                              )}

                              {refund.credit_memo_id && refund.status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/credit-memos/${refund.credit_memo_id}`)}
                                >
                                  <HiOutlineDocumentText className="w-4 h-4 mr-2" />
                                  View Credit Memo
                                </Button>
                              )}
                            </div>
                          </TabsContent>

                          {/* Comments Tab */}
                          <TabsContent value="comments">
                            {refundComments[refund.id] ? (
                              <RefundCommentThread
                                refund={refund}
                                comments={refundComments[refund.id]}
                                currentUser={{
                                  id: currentUser?.id || '',
                                  name: currentUser?.full_name || '',
                                  role: currentUser?.user_type || 'guest',
                                }}
                                onAddComment={(text, isInternal) => handleAddComment(refund.id, text, isInternal)}
                              />
                            ) : (
                              <div className="flex items-center justify-center py-8">
                                <Spinner size="md" />
                              </div>
                            )}
                          </TabsContent>

                          {/* Documents Tab */}
                          <TabsContent value="documents">
                            {refundDocuments[refund.id] ? (
                              <DocumentList
                                refund={refund}
                                documents={refundDocuments[refund.id]}
                                isAdmin={currentUser?.user_type === 'property_manager' || currentUser?.user_type === 'super_admin'}
                                onVerify={(docId) => handleVerifyDocument(refund.id, docId)}
                                onReject={(docId, reason) => handleRejectDocument(refund.id, docId, reason)}
                                onDelete={(docId) => handleDeleteDocument(refund.id, docId)}
                              />
                            ) : (
                              <div className="flex items-center justify-center py-8">
                                <Spinner size="md" />
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </Card.Body>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State - No Refunds */}
            {!refundsLoading && (!refunds || refunds.length === 0) && (
              <Card>
                <Card.Body>
                  <EmptyState
                    icon={HiOutlineCurrencyDollar}
                    title="No refund requests"
                    description={
                      booking.amount_paid > 0
                        ? "No refund requests have been submitted for this booking yet."
                        : "Refunds can only be requested for bookings with payments."
                    }
                    action={
                      booking.amount_paid > 0 && booking.refund_status !== 'full' ? (
                        <Button
                          variant="primary"
                          onClick={() => setShowRefundForm(true)}
                        >
                          <HiOutlineCurrencyDollar className="w-4 h-4 mr-2" />
                          Request Refund
                        </Button>
                      ) : undefined
                    }
                  />
                </Card.Body>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <Card>
            <Card.Header className="flex items-center justify-between">
              <span>Internal Notes</span>
              {!isEditingNotes && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingNotes(true)}
                >
                  <HiOutlinePencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {isEditingNotes ? (
                <div className="space-y-4">
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Add internal notes about this booking..."
                    rows={8}
                    fullWidth
                  />
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingNotes(false);
                        setInternalNotes(booking.internal_notes || '');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={async () => {
                        await handleSaveNotes();
                        setIsEditingNotes(false);
                      }}
                      isLoading={actionLoading === 'notes'}
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {booking.internal_notes ? (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {booking.internal_notes}
                    </p>
                  ) : (
                    <EmptyState
                      icon={HiOutlineDocumentText}
                      title="No notes yet"
                      description="Click Edit to add internal notes about this booking."
                    />
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'invoices' && (
          <Card>
            <Card.Header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-5 h-5" />
                <span>Invoices</span>
              </div>
              {booking.invoice_id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewInvoice}
                  isLoading={actionLoading === 'view-invoice'}
                  disabled={!!actionLoading}
                >
                  <HiOutlineDocumentText className="w-4 h-4 mr-2" />
                  View Invoice
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {booking.invoice_id ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Invoice #{booking.invoice_id.substring(0, 8).toUpperCase()}
                        </h4>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Booking Reference:</span>{' '}
                          {formatBookingReference(booking.booking_reference)}
                        </p>
                        {booking.invoice_generated_at && (
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Generated:</span>{' '}
                            {new Date(booking.invoice_generated_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Total Amount:</span>{' '}
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(booking.total_amount, booking.currency)}
                          </span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Amount Paid:</span>{' '}
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(booking.amount_paid || 0, booking.currency)}
                          </span>
                        </p>
                        {balance > 0 && (
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Outstanding Balance:</span>{' '}
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatCurrency(balance, booking.currency)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleViewInvoice}
                        isLoading={actionLoading === 'view-invoice'}
                        disabled={!!actionLoading}
                      >
                        View Invoice
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadInvoice}
                        isLoading={actionLoading === 'download-invoice'}
                        disabled={!!actionLoading}
                      >
                        Download PDF
                      </Button>
                    </div>
                  </div>

                  {/* Payment Status Summary */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Payment Summary
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(booking.total_amount, booking.currency)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Paid</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(booking.amount_paid || 0, booking.currency)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance</p>
                        <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(balance, booking.currency)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                        <div className="flex justify-center">
                          <PaymentStatusBadge status={booking.payment_status} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <HiOutlineDocumentText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  {(booking.amount_paid || 0) >= booking.total_amount ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        No invoice has been generated yet.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                        <HiOutlineClock className="w-4 h-4" />
                        <span>Invoice will be generated automatically when payment is processed</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      Invoice will be automatically generated once the booking is fully paid.
                    </p>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card>
            <Card.Header className="flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5" />
              <span>Complete Booking History</span>
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
                  description="History will appear here as actions are taken on this booking"
                />
              )}
            </Card.Body>
          </Card>
        )}

        {/* Record Payment Modal */}
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title="Record Payment"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`e.g., ${balance.toFixed(2)}`}
                step="0.01"
                min="0"
                max={balance}
                className={
                  paymentAmount && parseFloat(paymentAmount) > balance
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Outstanding balance: <span className="font-semibold">{formatCurrency(balance, booking.currency)}</span>
                </p>
                {paymentAmount && parseFloat(paymentAmount) > balance && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Exceeds balance
                  </p>
                )}
              </div>
              {paymentAmount && parseFloat(paymentAmount) > balance && (
                <Alert variant="error" className="mt-2">
                  Payment amount cannot exceed the outstanding balance of {formatCurrency(balance, booking.currency)}
                </Alert>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Method
              </label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                options={paymentMethodOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Reference
              </label>
              <Input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., Transaction ID, Check Number, etc."
                fullWidth
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Optional reference number or transaction ID
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes about this payment..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                isLoading={actionLoading === 'payment'}
                disabled={
                  !paymentAmount ||
                  parseFloat(paymentAmount) <= 0 ||
                  parseFloat(paymentAmount) > balance
                }
              >
                Record Payment
              </Button>
            </div>
          </div>
        </Modal>

        {/* Cancel Booking Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Booking"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to cancel this booking? The guest will be notified.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for the cancellation..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                Keep Booking
              </Button>
              <Button
                onClick={handleCancelBooking}
                isLoading={actionLoading === 'cancel'}
                disabled={!cancelReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </Modal>

        {/* Update Status Modal */}
        <Modal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          title="Update Booking Status"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Status
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
                options={statusOptions.map((s) => ({
                  value: s,
                  label: BOOKING_STATUS_LABELS[s],
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (optional)
              </label>
              <Textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for status change..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                isLoading={actionLoading === 'status'}
                disabled={!newStatus}
              >
                Update Status
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Notes Modal */}
        <Modal
          isOpen={notesModalOpen}
          onClose={() => setNotesModalOpen(false)}
          title="Edit Internal Notes"
          size="md"
        >
          <div className="space-y-4">
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes about this booking..."
              rows={6}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setNotesModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveNotes}
                isLoading={actionLoading === 'notes'}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </Modal>
          </div>
        {/* End of max-w-7xl mx-auto p-6 space-y-6 */}
        </div>
        {/* End of flex-1 overflow-y-auto (Main Content Area) */}

        {/* Sticky Summary Panel - Right Side */}
        <div className="hidden xl:block xl:w-[280px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto p-3">
            <BookingSummaryPanel
              booking={booking}
              onRecordPayment={() => {
                setActiveTab('payments');
                setShowPaymentForm(true);
              }}
            />
          </div>
        </div>
      </div>
      {/* End of flex-1 flex xl:flex-row (Content + Summary Wrapper) */}
      </div>
      {/* End of flex flex-col min-h-full */}
    </AuthenticatedLayout>
  );
};
