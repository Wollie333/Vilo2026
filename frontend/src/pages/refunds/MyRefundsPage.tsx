import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Button,
  Badge,
  Alert,
  Skeleton,
  RefundStatusBadge,
  AmountDisplay,
} from '@/components/ui';
import {
  RefundTimeline,
  CreditMemoViewer,
} from '@/components/features';
import { refundService } from '@/services';
import type { RefundRequest } from '@/types/refund.types';
import type { CreditMemo } from '@/types/credit-memo.types';

const BookingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

interface RefundWithDetails extends RefundRequest {
  booking?: {
    id: string;
    booking_reference?: string;
    property_name?: string;
    check_in_date?: string;
    check_out_date?: string;
    property?: {
      id: string;
      name: string;
      featured_image_url?: string;
    };
    booking_rooms?: Array<{
      room: {
        id: string;
        name: string;
        room_code?: string;
        gallery_images?: Array<{ url: string; caption?: string; order?: number }>;
      };
    }>;
  };
  credit_memo?: CreditMemo;
}

export const MyRefundsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [refunds, setRefunds] = useState<RefundWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await refundService.listMyRefunds({});
      setRefunds(response.refunds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refunds');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleViewBooking = (bookingId: string) => {
    navigate(`/bookings/${bookingId}`);
  };

  const getStatusMessage = (refund: RefundRequest): string => {
    switch (refund.status) {
      case 'requested':
        return 'Your refund request has been received and is waiting for review.';
      case 'under_review':
        return 'Your refund request is currently being reviewed by our team.';
      case 'approved':
        return `Your refund of ${refund.approved_amount} has been approved and will be processed soon.`;
      case 'processing':
        return 'Your refund is currently being processed. This may take 5-10 business days.';
      case 'completed':
        return 'Your refund has been completed successfully.';
      case 'rejected':
        return 'Your refund request was not approved.';
      case 'failed':
        return 'There was an issue processing your refund. Our team has been notified.';
      case 'withdrawn':
        return 'You have withdrawn this refund request.';
      default:
        return 'Refund status is being updated. Please check back shortly.'; // ✅ FIX: No more empty string
    }
  };

  return (
    <AuthenticatedLayout
      title="My Refunds"
      subtitle="Track and manage your refund requests"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View the status of all your refund requests
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/booking-management')}
          >
            View My Bookings
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="bordered">
                <Card.Body>
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : refunds.length === 0 ? (
          /* Empty State */
          <Card variant="bordered">
            <Card.Body className="py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-card mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Refund Requests
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  You haven't requested any refunds yet.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/booking-management')}
                >
                  View My Bookings
                </Button>
              </div>
            </Card.Body>
          </Card>
        ) : (
          /* Refunds List */
          <div className="space-y-6">
            {refunds.map((refund) => (
                <Card key={refund.id} variant="bordered" className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Card.Body className="p-0">
                    {/* Main Content - Two Column Layout */}
                    <div className="flex flex-col md:flex-row">
                      {/* Left Side - Property Thumbnail & Quick Info */}
                      <div className="md:w-64 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-6 flex flex-col justify-between">
                        {/* Room/Property Thumbnail */}
                        <div className="aspect-video w-full bg-gray-200 dark:bg-dark-hover rounded-lg mb-2 overflow-hidden">
                          {(() => {
                            // Prioritize room images over property images
                            const firstRoom = refund.booking?.booking_rooms?.[0]?.room;
                            const roomImage = firstRoom?.gallery_images?.[0]?.url;
                            const propertyImage = refund.booking?.property?.featured_image_url;
                            const imageUrl = roomImage || propertyImage;
                            const altText = firstRoom?.name || refund.booking?.property?.name || 'Property';

                            return imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={altText}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to placeholder if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center">
                                        <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Room Name */}
                        {refund.booking?.booking_rooms?.[0]?.room && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {refund.booking.booking_rooms[0].room.name}
                            </p>
                            {refund.booking.booking_rooms[0].room.room_code && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Room {refund.booking.booking_rooms[0].room.room_code}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Booking Reference */}
                        {refund.booking && (
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Booking Reference
                              </p>
                              <p className="text-sm font-bold text-primary dark:text-primary-light">
                                #{refund.booking.booking_reference || `VILO-${refund.booking.id.slice(0, 6).toUpperCase()}`}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewBooking(refund.booking!.id)}
                                className="w-full"
                              >
                                View Booking
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side - Refund Details */}
                      <div className="flex-1 p-6">
                        {/* Header with Status */}
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Refund Request
                              </h3>
                              <RefundStatusBadge status={refund.status} size="lg" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Requested on {new Date(refund.requested_at || refund.created_at).toLocaleDateString('en-ZA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/refunds/${refund.id}`)}
                            className="flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </Button>
                        </div>

                        {/* Key Information Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          {/* Requested Amount */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                              Requested Amount
                            </p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                              {refund.currency} {refund.requested_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </p>
                          </div>

                          {/* Approved Amount (if exists) */}
                          {refund.approved_amount && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                                Approved Amount
                              </p>
                              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {refund.currency} {refund.approved_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}

                          {/* Booking Dates */}
                          {refund.booking && (
                            <>
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                                <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">
                                  Check-in Date
                                </p>
                                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                  {new Date(refund.booking.check_in_date!).toLocaleDateString('en-ZA', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>

                              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800">
                                <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                                  Check-out Date
                                </p>
                                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                                  {new Date(refund.booking.check_out_date!).toLocaleDateString('en-ZA', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Status Message */}
                        <Alert
                          variant={
                            refund.status === 'completed'
                              ? 'success'
                              : refund.status === 'rejected' || refund.status === 'failed'
                              ? 'error'
                              : refund.status === 'withdrawn'
                              ? 'warning'
                              : 'info'
                          }
                          className="mb-4"
                        >
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="font-medium">{getStatusMessage(refund)}</p>
                            </div>
                          </div>
                        </Alert>

                        {/* Reason */}
                        {refund.reason && (
                          <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border mb-4">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                              Refund Reason
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                              {refund.reason}
                            </p>
                          </div>
                        )}

                        {/* Review Notes (if rejected) */}
                        {refund.status === 'rejected' && refund.review_notes && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 dark:border-red-700 rounded-r-lg mb-4">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 uppercase tracking-wide">
                              Admin Response
                            </p>
                            <p className="text-sm text-red-900 dark:text-red-300 leading-relaxed">
                              {refund.review_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      {/* End Right Side - Refund Details */}
                    </div>
                    {/* End Two Column Layout */}
                  </Card.Body>
                </Card>
              ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};
