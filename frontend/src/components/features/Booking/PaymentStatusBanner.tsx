/**
 * PaymentStatusBanner Component
 *
 * Displays prominent payment status banners with contextual information and actions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import type { PaymentStatusBannerProps } from './PaymentStatusBanner.types';

// Icons
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ExclamationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const PaymentStatusBanner: React.FC<PaymentStatusBannerProps> = ({
  paymentStatus,
  paymentMethod,
  bookingId,
  balanceRemaining = 0,
  currency = 'ZAR',
  hasUploadedProof = false,
  rejectionReason,
  failedCheckoutAt,
  showActions = true,
  className = '',
  isVisible = true,
  onToggleVisibility,
}) => {
  const navigate = useNavigate();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Render different banners based on payment status
  const renderBanner = () => {
    switch (paymentStatus) {
      // EFT Payment Awaiting Verification
      case 'verification_pending':
        return (
          <div className={`rounded-lg border-2 p-4 ${className} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600`}>
            <div className="flex items-start gap-4">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Payment Proof Awaiting Verification
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  The guest has uploaded proof of payment. Please review and verify the payment to confirm this booking.
                </p>
                {showActions && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        // Scroll to payment proof section
                        const proofSection = document.getElementById('payment-proof-section');
                        if (proofSection) {
                          proofSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                    >
                      Review Payment Proof
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // EFT Payment - Awaiting Upload
      case 'pending':
        if (paymentMethod === 'eft' && !hasUploadedProof) {
          return (
            <div className={`rounded-lg border-2 p-4 ${className} bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600`}>
              <div className="flex items-start gap-4">
                <UploadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Payment Proof Required
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    This is an EFT booking. Please upload proof of your bank transfer to confirm the payment.
                  </p>
                  {showActions && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/bookings/${bookingId}/upload-proof`)}
                    >
                      Upload Payment Proof
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // Regular pending payment
        if (balanceRemaining > 0) {
          if (!isVisible) {
            return null;
          }

          return (
            <div className={`rounded-lg border-2 p-4 ${className} bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-600`}>
              <div className="flex items-start gap-4">
                <ExclamationIcon className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-semibold text-orange-900 dark:text-orange-100">
                      Payment Pending
                    </h3>
                    {onToggleVisibility && (
                      <button
                        onClick={onToggleVisibility}
                        className="flex-shrink-0 p-1 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-800/30 rounded transition-colors"
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Outstanding balance: <span className="font-semibold">{formatCurrency(balanceRemaining)}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;

      // Payment Rejected
      case 'rejected':
        if (rejectionReason) {
          return (
            <div className={`rounded-lg border-2 p-4 ${className} bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600`}>
              <div className="flex items-start gap-4">
                <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
                    Payment Proof Rejected
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                    <span className="font-medium">Reason:</span> {rejectionReason}
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    Please upload a new payment proof to confirm your booking.
                  </p>
                  {showActions && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/bookings/${bookingId}/upload-proof`)}
                    >
                      Upload New Proof
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        }
        return null;

      // Payment Complete
      case 'paid':
        return (
          <div className={`rounded-lg border-2 p-4 ${className} bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600`}>
            <div className="flex items-start gap-4">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-green-900 dark:text-green-100 mb-1">
                  Payment Verified
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Payment has been confirmed. Your booking is secured!
                </p>
              </div>
            </div>
          </div>
        );

      // Failed Checkout
      case 'failed_checkout':
        return (
          <div className={`rounded-lg border-2 p-4 ${className} bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600`}>
            <div className="flex items-start gap-4">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
                  Checkout Incomplete
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                  This booking was not completed. Please complete the checkout process to confirm your reservation.
                </p>
                {showActions && (
                  <Button
                    size="sm"
                    onClick={() => {
                      // Navigate to payment or checkout
                      window.location.href = `/checkout?booking=${bookingId}`;
                    }}
                  >
                    Complete Checkout
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      // Payment Failed
      case 'failed':
        return (
          <div className={`rounded-lg border-2 p-4 ${className} bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600`}>
            <div className="flex items-start gap-4">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
                  Payment Failed
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200">
                  The payment could not be processed. Please try again or contact support.
                </p>
              </div>
            </div>
          </div>
        );

      // Partial Payment
      case 'partial':
        if (balanceRemaining > 0) {
          return (
            <div className={`rounded-lg border-2 p-4 ${className} bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600`}>
              <div className="flex items-start gap-4">
                <InfoIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Partial Payment Received
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Remaining balance: <span className="font-semibold">{formatCurrency(balanceRemaining)}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;

      // Partially Refunded
      case 'partially_refunded':
        return (
          <div className={`rounded-lg border-2 p-4 ${className} bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600`}>
            <div className="flex items-start gap-4">
              <InfoIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Partial Refund Issued
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  A partial refund has been processed for this booking.
                </p>
              </div>
            </div>
          </div>
        );

      // Fully Refunded
      case 'refunded':
        return (
          <div className={`rounded-lg border-2 p-4 ${className} bg-gray-50 dark:bg-gray-900/20 border-gray-400 dark:border-gray-600`}>
            <div className="flex items-start gap-4">
              <InfoIcon className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Fully Refunded
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  This booking has been fully refunded.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const banner = renderBanner();

  // Only render if there's a banner to show
  if (!banner) {
    return null;
  }

  return banner;
};
