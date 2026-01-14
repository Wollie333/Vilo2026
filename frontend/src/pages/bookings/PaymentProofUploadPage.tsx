/**
 * PaymentProofUploadPage
 *
 * Page for guests to upload payment proof for EFT bookings
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { PaymentProofUpload } from '@/components/features';
import { bookingService } from '@/services';
import type { Booking } from '@/types/booking.types';

export const PaymentProofUploadPage: React.FC = () => {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('Booking ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await bookingService.getBooking(bookingId);
        setBooking(data);

        // Validate that this is an EFT booking
        if (data.payment_method !== 'eft') {
          setError('Payment proof upload is only available for EFT payments');
        }

        // Check if payment is already verified
        if (data.payment_status === 'paid' && data.payment_verified_at) {
          setError('Payment has already been verified');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleUploadSuccess = () => {
    // Redirect to booking detail page after successful upload
    setTimeout(() => {
      navigate(`/bookings/${bookingId}`);
    }, 2000);
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthenticatedLayout title="Upload Payment Proof" subtitle="Loading booking details...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <AuthenticatedLayout title="Upload Payment Proof">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                  Unable to upload payment proof
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error || 'Booking not found'}
                </p>
                <button
                  onClick={() => navigate('/bookings')}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Back to Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency helper
  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <AuthenticatedLayout
      title="Upload Payment Proof"
      subtitle={`Booking #${booking.booking_reference || booking.id.substring(0, 8)}`}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Booking Summary Card */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Booking Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Property
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {booking.property?.name || 'Property Name'}
              </p>
            </div>

            {/* Room */}
            {booking.room && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Room
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {booking.room.name}
                </p>
              </div>
            )}

            {/* Check-in */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Check-in
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatDate(booking.check_in_date)}
              </p>
            </div>

            {/* Check-out */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Check-out
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatDate(booking.check_out_date)}
              </p>
            </div>

            {/* Guests */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Guests
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {booking.number_of_guests} {booking.number_of_guests === 1 ? 'guest' : 'guests'}
              </p>
            </div>

            {/* Total Amount */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Total Amount
              </p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(booking.total_amount, booking.currency)}
              </p>
            </div>
          </div>

          {/* Payment Status */}
          {booking.payment_rejection_reason && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Previous upload was rejected
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {booking.payment_rejection_reason}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Component */}
        <PaymentProofUpload
          bookingId={booking.id}
          onUploadSuccess={handleUploadSuccess}
          showInstructions={true}
        />

        {/* Cancel Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/bookings/${booking.id}`)}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};
