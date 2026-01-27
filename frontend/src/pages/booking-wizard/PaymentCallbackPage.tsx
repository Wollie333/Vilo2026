/**
 * Payment Callback Page
 *
 * Handles the callback from Paystack after payment completion
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner, Alert } from '@/components/ui';
import { bookingWizardService } from '@/services';

export const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your payment...');
  const [bookingReference, setBookingReference] = useState<string>('');

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    try {
      // Get payment reference from URL
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      const paymentReference = reference || trxref;

      if (!paymentReference) {
        throw new Error('Payment reference not found');
      }

      // Get pending booking data from session storage
      const pendingBookingData = sessionStorage.getItem('pendingBooking');
      if (!pendingBookingData) {
        throw new Error('Booking data not found. Please start a new booking.');
      }

      const pendingBooking = JSON.parse(pendingBookingData);

      // Step 1: Verify payment with backend
      setMessage('Verifying payment...');
      const paymentVerification = await bookingWizardService.verifyPayment({
        reference: paymentReference,
        booking_id: pendingBooking.booking_id,
        property_id: pendingBooking.property_id,
      });

      if (!paymentVerification.is_valid) {
        throw new Error('Payment verification failed. Please contact support.');
      }

      // Note: Guest account was already created by backend during booking initiation
      // with an auto-generated password. Guest will receive email to set their password.

      // Step 2: Confirm booking
      setMessage('Confirming your booking...');
      const confirmedBooking = await bookingWizardService.confirmBooking({
        booking_id: pendingBooking.booking_id,
        payment_reference: paymentReference,
      });

      // Step 3: Clear session storage
      sessionStorage.removeItem('pendingBooking');

      // Step 4: Update status
      setStatus('success');
      setBookingReference(confirmedBooking.booking_reference);
      setMessage('Booking confirmed successfully! Check your email to set your password and access your booking portal.');

      // Redirect to confirmation page after 3 seconds
      setTimeout(() => {
        navigate(`/booking/confirmation/${confirmedBooking.booking_reference}`);
      }, 3000);
    } catch (err) {
      console.error('Payment processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      setStatus('error');
      setMessage(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-lg shadow-lg p-8">
        {status === 'processing' && (
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            {bookingReference && (
              <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Booking Reference</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {bookingReference}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to your bookings...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Failed
            </h2>
            <Alert variant="error" className="text-left mb-4">
              {message}
            </Alert>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
