import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { refundService } from '@/services/refund.service';
import type { RefundActionModalProps, RefundActionFormData } from './RefundActionModal.types';

/**
 * RefundActionModal Component
 *
 * Modal for admin actions on refund requests (approve/reject/process).
 * Follows industry best practices with guided workflow and validation.
 *
 * Features:
 * - Separate internal and customer notes (both can be provided simultaneously)
 * - Predefined reason dropdowns
 * - Refund method selection for processing
 * - Character count for notes (2000 max)
 * - Required customer notes for rejection
 * - Amount validation for approval
 * - Clear error messaging
 */
export const RefundActionModal: React.FC<RefundActionModalProps> = ({
  isOpen,
  onClose,
  refund,
  action,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<RefundActionFormData>({
    approvedAmount: refund.requested_amount,
    reason: '',
    customerNotes: '',
    internalNotes: '',
    refundMethod: 'manual',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (action === 'approve') {
        // Validate approved amount
        if (formData.approvedAmount > refund.requested_amount) {
          throw new Error('Approved amount cannot exceed requested amount');
        }
        if (formData.approvedAmount <= 0) {
          throw new Error('Approved amount must be greater than zero');
        }

        await refundService.approveRefund(refund.id, {
          approved_amount: formData.approvedAmount,
          customer_notes: formData.customerNotes || undefined,
          internal_notes: formData.internalNotes || undefined,
          change_reason: formData.reason || undefined,
        });
      } else if (action === 'reject') {
        // Customer notes are REQUIRED for rejection
        if (!formData.customerNotes.trim()) {
          throw new Error('Customer notes are required when rejecting a refund');
        }

        await refundService.rejectRefund(refund.id, {
          customer_notes: formData.customerNotes,
          internal_notes: formData.internalNotes || undefined,
          change_reason: formData.reason || undefined,
        });
      } else if (action === 'process') {
        await refundService.processRefund(refund.id);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = {
    approve: 'Approve Refund Request',
    reject: 'Reject Refund Request',
    process: 'Process Refund',
  }[action];

  const submitButtonText = {
    approve: 'Approve Refund',
    reject: 'Reject Request',
    process: 'Process Refund',
  }[action];

  const submitButtonVariant = 'primary'; // Always use primary variant

  const customerCharsRemaining = 2000 - formData.customerNotes.length;
  const internalCharsRemaining = 2000 - formData.internalNotes.length;
  const isCustomerOverLimit = customerCharsRemaining < 0;
  const isInternalOverLimit = internalCharsRemaining < 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Refund Summary */}
        <div className="p-4 bg-gray-50 dark:bg-dark-hover rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Refund Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Booking ID:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {refund.booking_id}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Requested Amount:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {refund.currency} {refund.requested_amount.toFixed(2)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 dark:text-gray-400">Reason:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {refund.reason}
              </span>
            </div>
          </div>
        </div>

        {/* Approve: Amount Input */}
        {action === 'approve' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Approved Amount
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={refund.requested_amount}
              value={formData.approvedAmount}
              onChange={(e) =>
                setFormData({ ...formData, approvedAmount: parseFloat(e.target.value) || 0 })
              }
              placeholder="Enter approved amount"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum: {refund.currency} {refund.requested_amount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Reason Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for{' '}
            {action === 'approve' ? 'Approval' : action === 'reject' ? 'Rejection' : 'Processing'}
          </label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select a reason...</option>
            {action === 'approve' && (
              <>
                <option value="valid_claim">Valid claim - policy compliant</option>
                <option value="exceptional_circumstances">Exceptional circumstances</option>
                <option value="partial_approval">Partial approval warranted</option>
                <option value="goodwill">Goodwill gesture</option>
              </>
            )}
            {action === 'reject' && (
              <>
                <option value="policy_violation">Outside cancellation policy window</option>
                <option value="insufficient_evidence">Insufficient evidence provided</option>
                <option value="duplicate_request">Duplicate refund request</option>
                <option value="invalid_reason">Reason does not warrant refund</option>
              </>
            )}
            {action === 'process' && (
              <>
                <option value="automatic_processing">Automatic processing initiated</option>
                <option value="manual_review_complete">Manual review complete</option>
              </>
            )}
          </select>
        </div>

        {/* Customer Notes (public) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes to Customer{' '}
            {action === 'reject' ? (
              <span className="text-red-600 dark:text-red-400">(Required)</span>
            ) : (
              <span className="text-gray-500">(Optional)</span>
            )}
          </label>
          <Textarea
            rows={3}
            value={formData.customerNotes}
            onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
            placeholder="Message visible to the customer..."
            maxLength={2000}
          />
          <p
            className={`text-xs mt-1 ${
              isCustomerOverLimit
                ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {customerCharsRemaining}/2000 characters
          </p>
        </div>

        {/* Internal Notes (admin-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Internal Notes (Admin Only){' '}
            <span className="text-gray-500">(Optional)</span>
          </label>
          <Textarea
            rows={2}
            value={formData.internalNotes}
            onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
            placeholder="Private notes for admin team..."
            maxLength={2000}
          />
          <p
            className={`text-xs mt-1 ${
              isInternalOverLimit
                ? 'text-red-600 dark:text-red-400 font-medium'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Not visible to customer • {internalCharsRemaining}/2000 characters
          </p>
        </div>

        {/* Process: Refund Method Selection */}
        {action === 'process' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refund Method
            </label>
            <select
              value={formData.refundMethod}
              onChange={(e) =>
                setFormData({ ...formData, refundMethod: e.target.value as any })
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="manual">Manual Processing</option>
              <option value="eft">EFT (Electronic Funds Transfer)</option>
              <option value="credit_memo">Credit Memo</option>
              {/* Future payment processors (commented for now) */}
              {/* <option value="paystack">PayStack</option> */}
              {/* <option value="stripe">Stripe</option> */}
              {/* <option value="paypal">PayPal</option> */}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Refund will be processed via the selected method
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={submitButtonVariant}
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (action === 'reject' && !formData.customerNotes.trim()) ||
              isCustomerOverLimit ||
              isInternalOverLimit
            }
            isLoading={isSubmitting}
          >
            {submitButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
