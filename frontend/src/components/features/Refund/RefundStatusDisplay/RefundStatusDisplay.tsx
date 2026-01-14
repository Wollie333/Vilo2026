import React from 'react';
import { RefundStatusBadge, AmountDisplay, Alert } from '@/components/ui';
import type { RefundRequestWithDetails } from '@/types/refund.types';

export interface RefundStatusDisplayProps {
  refundRequest: RefundRequestWithDetails;
  currency?: string;
  className?: string;
}

export const RefundStatusDisplay: React.FC<RefundStatusDisplayProps> = ({
  refundRequest,
  currency = 'ZAR',
  className = '',
}) => {
  const getStatusMessage = (): { title: string; description: string; variant: 'info' | 'success' | 'warning' | 'error' } => {
    switch (refundRequest.status) {
      case 'requested':
        return {
          title: 'Refund Request Submitted',
          description: 'Your refund request has been submitted and is awaiting review by our team.',
          variant: 'info',
        };
      case 'under_review':
        return {
          title: 'Under Review',
          description: 'Our team is currently reviewing your refund request. We will notify you once a decision has been made.',
          variant: 'info',
        };
      case 'approved':
        return {
          title: 'Refund Approved',
          description: `Your refund request has been approved for ${currency}${refundRequest.approved_amount?.toFixed(2) || '0.00'}. The refund will be processed shortly.`,
          variant: 'success',
        };
      case 'rejected':
        return {
          title: 'Refund Request Declined',
          description: refundRequest.review_notes || 'Your refund request has been declined. Please contact support for more information.',
          variant: 'error',
        };
      case 'processing':
        return {
          title: 'Processing Refund',
          description: 'Your refund is currently being processed. This may take 5-10 business days depending on your payment method.',
          variant: 'info',
        };
      case 'completed':
        return {
          title: 'Refund Completed',
          description: `Your refund of ${currency}${refundRequest.refunded_amount?.toFixed(2) || '0.00'} has been processed successfully. You should see the funds in your account within 5-10 business days.`,
          variant: 'success',
        };
      case 'failed':
        return {
          title: 'Refund Processing Failed',
          description: refundRequest.failure_reason || 'There was an issue processing your refund. Our team has been notified and will contact you shortly.',
          variant: 'error',
        };
      default:
        return {
          title: 'Refund Status',
          description: 'Status information is not available.',
          variant: 'info',
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Refund Status
        </h3>
        <RefundStatusBadge status={refundRequest.status} size="lg" />
      </div>

      {/* Status Alert */}
      <Alert variant={statusMessage.variant} title={statusMessage.title}>
        <p className="text-sm">{statusMessage.description}</p>
      </Alert>

      {/* Refund Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Requested Amount</p>
          <AmountDisplay
            amount={refundRequest.requested_amount}
            currency={currency}
            size="md"
          />
        </div>

        {refundRequest.approved_amount !== null && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Approved Amount</p>
            <AmountDisplay
              amount={refundRequest.approved_amount}
              currency={currency}
              size="md"
            />
          </div>
        )}

        {refundRequest.status === 'completed' && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Refunded Amount</p>
            <AmountDisplay
              amount={refundRequest.refunded_amount}
              currency={currency}
              size="md"
              className="text-success"
            />
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Request Date</p>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {new Date(refundRequest.created_at).toLocaleDateString('en-ZA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {refundRequest.reviewed_at && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Review Date</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {new Date(refundRequest.reviewed_at).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Review Notes (if rejected) */}
      {refundRequest.status === 'rejected' && refundRequest.review_notes && (
        <div className="p-4 bg-error-light dark:bg-error/10 rounded-lg border border-error/20">
          <p className="text-sm font-medium text-error-dark dark:text-error mb-2">
            Reason for Decline
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {refundRequest.review_notes}
          </p>
        </div>
      )}

      {/* Reason for Request */}
      {refundRequest.reason && (
        <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for Refund Request
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {refundRequest.reason}
          </p>
        </div>
      )}

      {/* Credit Memo Link (if completed) */}
      {refundRequest.status === 'completed' && refundRequest.credit_memo_id && (
        <div className="p-4 bg-success-light dark:bg-success/10 rounded-lg border border-success/20">
          <p className="text-sm font-medium text-success-dark dark:text-success mb-2">
            Credit Memo Available
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            A credit memo has been generated for this refund. You can view and download it from your booking details.
          </p>
        </div>
      )}
    </div>
  );
};
