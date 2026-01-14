/**
 * RefundApprovalForm Component
 *
 * Admin approval/rejection form for refund requests.
 * Follows exact booking management patterns with inline expandable forms.
 *
 * Features:
 * - Gradient backgrounds (green for approve, red for reject)
 * - Explicit Cancel/Save buttons
 * - Separate data and UI state
 * - Loading states
 * - Inline validation
 */

import React, { useState } from 'react';
import { Button, Input, Textarea, AmountDisplay } from '@/components/ui';
import { formatCurrency } from '@/types/booking.types';
import type { RefundApprovalFormProps, RefundApprovalData } from './RefundApprovalForm.types';

export const RefundApprovalForm: React.FC<RefundApprovalFormProps> = ({
  refund,
  booking,
  mode,
  onSubmit,
  onCancel,
}) => {
  // Form state
  const [formData, setFormData] = useState<RefundApprovalData>({
    approvedAmount: refund.requested_amount,
    rejectionReason: '',
    internalNotes: '',
    customerNotes: '',
    notifyGuest: true,
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    approvedAmount?: string;
    rejectionReason?: string;
  }>({});

  // Calculate max refund amount
  const totalPaid = booking.amount_paid || 0;
  const totalRefunded = booking.total_refunded || 0;
  const maxRefund = totalPaid - totalRefunded;

  const validateForm = (): boolean => {
    const newErrors: { approvedAmount?: string; rejectionReason?: string } = {};

    if (mode === 'approve') {
      if (!formData.approvedAmount || formData.approvedAmount <= 0) {
        newErrors.approvedAmount = 'Please enter a valid amount';
      } else if (formData.approvedAmount > maxRefund) {
        newErrors.approvedAmount = `Amount cannot exceed ${formatCurrency(maxRefund, booking.currency)}`;
      } else if (formData.approvedAmount > refund.requested_amount) {
        newErrors.approvedAmount = `Amount cannot exceed requested amount of ${formatCurrency(refund.requested_amount, booking.currency)}`;
      }
    }

    if (mode === 'reject') {
      if (!formData.rejectionReason || formData.rejectionReason.trim().length === 0) {
        newErrors.rejectionReason = 'Please provide a reason for rejection';
      } else if (formData.rejectionReason.trim().length < 10) {
        newErrors.rejectionReason = 'Please provide a more detailed reason (minimum 10 characters)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData((prev) => ({ ...prev, approvedAmount: value }));
    // Clear error when user types
    if (errors.approvedAmount) {
      setErrors((prev) => ({ ...prev, approvedAmount: undefined }));
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, rejectionReason: e.target.value }));
    // Clear error when user types
    if (errors.rejectionReason) {
      setErrors((prev) => ({ ...prev, rejectionReason: undefined }));
    }
  };

  // Determine gradient background based on mode
  const gradientClass =
    mode === 'approve'
      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
      : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20';

  return (
    <form onSubmit={handleSubmit} className={`p-6 rounded-lg ${gradientClass}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'approve' ? 'Approve Refund Request' : 'Reject Refund Request'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Requested Amount: <span className="font-semibold">{formatCurrency(refund.requested_amount, refund.currency)}</span>
          </p>
        </div>

        {/* Approve Mode - Amount Input */}
        {mode === 'approve' && (
          <div>
            <label htmlFor="approved-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Approved Amount <span className="text-red-600">*</span>
            </label>
            <div className="space-y-2">
              <Input
                id="approved-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={Math.min(maxRefund, refund.requested_amount)}
                value={formData.approvedAmount || ''}
                onChange={handleAmountChange}
                error={errors.approvedAmount}
                placeholder="0.00"
                className="font-mono"
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Requested Amount:</span>
                  <AmountDisplay
                    amount={refund.requested_amount}
                    currency={refund.currency}
                    size="sm"
                  />
                </div>
                <div className="flex justify-between">
                  <span>Maximum Available:</span>
                  <AmountDisplay amount={maxRefund} currency={booking.currency} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Mode - Rejection Reason */}
        {mode === 'reject' && (
          <div>
            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Rejection <span className="text-red-600">*</span>
            </label>
            <Textarea
              id="rejection-reason"
              value={formData.rejectionReason || ''}
              onChange={handleReasonChange}
              error={errors.rejectionReason}
              placeholder="Explain why this refund request is being rejected..."
              rows={4}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {(formData.rejectionReason || '').length}/500 characters (minimum 10)
            </p>
          </div>
        )}

        {/* Customer-facing Notes (Optional) */}
        <div>
          <label htmlFor="customer-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Customer-Facing Notes <span className="text-gray-500">(Optional)</span>
          </label>
          <Textarea
            id="customer-notes"
            value={formData.customerNotes || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, customerNotes: e.target.value }))}
            placeholder="Add any notes that will be visible to the customer..."
            rows={3}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will be visible to the guest in the refund details.
          </p>
        </div>

        {/* Internal Notes (Optional) */}
        <div>
          <label htmlFor="internal-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Internal Admin Notes <span className="text-gray-500">(Optional)</span>
          </label>
          <Textarea
            id="internal-notes"
            value={formData.internalNotes || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, internalNotes: e.target.value }))}
            placeholder="Add any internal notes (not visible to customer)..."
            rows={3}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Internal notes are only visible to admin users.
          </p>
        </div>

        {/* Notify Guest Checkbox */}
        <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <input
            type="checkbox"
            id="notify-guest"
            checked={formData.notifyGuest}
            onChange={(e) => setFormData((prev) => ({ ...prev, notifyGuest: e.target.checked }))}
            className="mt-1 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
          />
          <label htmlFor="notify-guest" className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <span className="font-medium">Send notification to guest</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The guest will receive an email notification about this decision.
            </p>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={mode === 'approve' ? 'primary' : 'danger'}
            isLoading={isSaving}
            disabled={isSaving}
          >
            {mode === 'approve' ? 'Approve Refund' : 'Reject Refund'}
          </Button>
        </div>
      </div>
    </form>
  );
};
