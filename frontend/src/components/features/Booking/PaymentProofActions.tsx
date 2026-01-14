/**
 * PaymentProofActions Component
 *
 * Actions for property owners to approve/reject payment proofs
 */

import React, { useState } from 'react';
import { bookingService } from '@/services';
import { Modal } from '@/components/ui';
import type { PaymentProofActionsProps } from './PaymentProofActions.types';

// Icons
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const PaymentProofActions: React.FC<PaymentProofActionsProps> = ({
  bookingId,
  paymentStatus,
  isVerified,
  canVerify,
  onVerificationSuccess,
  onVerificationError,
  className = '',
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Don't show actions if already verified or user can't verify
  if (isVerified || !canVerify || paymentStatus !== 'verification_pending') {
    return null;
  }

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await bookingService.verifyEFTPayment(bookingId, {
        action: 'approve',
      });

      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve payment';
      if (onVerificationError) {
        onVerificationError(errorMessage);
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      if (onVerificationError) {
        onVerificationError('Please provide a reason for rejection');
      }
      return;
    }

    setIsRejecting(true);
    try {
      await bookingService.verifyEFTPayment(bookingId, {
        action: 'reject',
        rejection_reason: rejectionReason,
        notes: rejectionNotes || undefined,
      });

      setShowRejectModal(false);
      setRejectionReason('');
      setRejectionNotes('');

      if (onVerificationSuccess) {
        onVerificationSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject payment';
      if (onVerificationError) {
        onVerificationError(errorMessage);
      }
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        {/* Approve Button */}
        <button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isApproving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>Approving...</span>
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              <span>Approve Payment</span>
            </>
          )}
        </button>

        {/* Reject Button */}
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isApproving || isRejecting}
          className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <XIcon className="w-5 h-5" />
          <span>Reject Payment</span>
        </button>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => !isRejecting && setShowRejectModal(false)}
        title="Reject Payment Proof"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please provide a clear reason why you are rejecting this payment proof. The guest will receive this message.
          </p>

          {/* Rejection Reason (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., The payment proof is unclear, the amount doesn't match, or the transaction date is incorrect..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={isRejecting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This will be sent to the guest
            </p>
          </div>

          {/* Additional Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Internal notes for your records..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={isRejecting}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              For internal use only
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowRejectModal(false)}
              disabled={isRejecting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={isRejecting || !rejectionReason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isRejecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <XIcon className="w-5 h-5" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
