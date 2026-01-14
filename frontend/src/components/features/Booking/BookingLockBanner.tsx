import React from 'react';
import { HiOutlineLockClosed, HiOutlineExclamationCircle } from 'react-icons/hi';
import { Alert } from '@/components/ui';
import type { RefundRequest } from '@/types/refund.types';

export interface BookingLockBannerProps {
  activeRefunds: RefundRequest[];
  onViewRefunds?: () => void;
}

export const BookingLockBanner: React.FC<BookingLockBannerProps> = ({
  activeRefunds,
  onViewRefunds,
}) => {
  if (!activeRefunds || activeRefunds.length === 0) {
    return null;
  }

  const refundCount = activeRefunds.length;

  return (
    <Alert variant="warning" className="mb-6">
      <div className="flex items-start gap-3">
        <HiOutlineLockClosed className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-warning-dark dark:text-warning mb-2">
            Booking Locked - Refund In Progress
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This booking cannot be modified because it has{' '}
            <strong>{refundCount}</strong> active refund request
            {refundCount !== 1 ? 's' : ''}. The booking will be automatically unlocked once all
            refunds are resolved (completed, failed, rejected, or withdrawn).
          </p>

          {activeRefunds.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Active Refund Requests:
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {activeRefunds.map((refund) => (
                  <li key={refund.id} className="flex items-center gap-2">
                    <HiOutlineExclamationCircle className="w-4 h-4 text-warning-dark dark:text-warning" />
                    <span>
                      {refund.currency} {refund.requested_amount.toFixed(2)} - Status:{' '}
                      <span className="font-medium capitalize">
                        {refund.status.replace('_', ' ')}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onViewRefunds && (
            <button
              onClick={onViewRefunds}
              className="mt-4 text-sm font-medium text-primary hover:text-primary/80 underline"
            >
              View Refund Requests →
            </button>
          )}
        </div>
      </div>
    </Alert>
  );
};
