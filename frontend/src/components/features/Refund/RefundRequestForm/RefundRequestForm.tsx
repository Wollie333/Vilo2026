import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Textarea, Alert, AmountDisplay } from '@/components/ui';
import { refundService } from '@/services';
import type { Booking } from '@/types/booking.types';
import type { CreateRefundRequestDTO, RefundCalculation } from '@/types/refund.types';

export interface RefundRequestFormProps {
  booking: Booking;
  onSubmit: (data: CreateRefundRequestDTO) => Promise<void>;
  onCancel: () => void;
}

const REFUND_REASONS = [
  { value: 'change_of_plans', label: 'Change of Plans' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'dissatisfied', label: 'Dissatisfied with Service' },
  { value: 'property_issue', label: 'Issue with Property' },
  { value: 'personal_circumstances', label: 'Personal Circumstances' },
  { value: 'other', label: 'Other' },
];

export const RefundRequestForm: React.FC<RefundRequestFormProps> = ({
  booking,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateRefundRequestDTO>({
    requested_amount: 0,
    reason: '',
  });
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [calculation, setCalculation] = useState<RefundCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});

  // Calculate suggested refund on mount
  useEffect(() => {
    const fetchCalculation = async () => {
      try {
        setIsLoading(true);
        const calc = await refundService.calculateSuggestedRefund(booking.id);
        setCalculation(calc);
        // Pre-fill with suggested amount
        setFormData(prev => ({
          ...prev,
          requested_amount: calc.suggested_amount,
        }));
      } catch (error) {
        console.error('Error calculating refund:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculation();
  }, [booking.id]);

  const validateForm = (): boolean => {
    const newErrors: { amount?: string; reason?: string } = {};

    if (!formData.requested_amount || formData.requested_amount <= 0) {
      newErrors.amount = 'Please enter a valid refund amount';
    }

    // Calculate max refund - use breakdown if available, otherwise calculate from booking
    const totalPaid = calculation?.breakdown?.total_paid || booking.amount_paid || 0;
    const totalRefunded = calculation?.breakdown?.total_refunded || booking.total_refunded || 0;
    const maxRefund = totalPaid - totalRefunded;

    if (maxRefund <= 0) {
      newErrors.amount = 'No refund available - booking has been fully refunded or has no payments';
    } else if (formData.requested_amount > maxRefund) {
      newErrors.amount = `Amount cannot exceed ${booking.currency} ${maxRefund.toFixed(2)} (available for refund)`;
    }

    if (!formData.reason || formData.reason.trim().length === 0) {
      newErrors.reason = 'Please provide a reason for the refund request';
    }

    if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Please provide a more detailed reason (minimum 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, requested_amount: value }));
    // Clear error when user types
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  };

  const handleReasonSelect = (value: string) => {
    setSelectedReason(value);
    if (value !== 'other') {
      const selectedOption = REFUND_REASONS.find(r => r.value === value);
      const baseReason = selectedOption?.label || '';
      // Combine base reason with additional details if they exist
      const fullReason = additionalDetails
        ? `${baseReason}. ${additionalDetails}`
        : baseReason;
      setFormData(prev => ({ ...prev, reason: fullReason }));
    } else {
      // For 'other', use only the additional details
      setFormData(prev => ({ ...prev, reason: additionalDetails }));
    }
    // Clear error when user selects
    if (errors.reason) {
      setErrors(prev => ({ ...prev, reason: undefined }));
    }
  };

  const handleReasonText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const details = e.target.value;
    setAdditionalDetails(details);

    if (selectedReason === 'other') {
      // For 'other', use only the additional details
      setFormData(prev => ({ ...prev, reason: details }));
    } else {
      // For other reasons, combine base reason with additional details
      const selectedOption = REFUND_REASONS.find(r => r.value === selectedReason);
      const baseReason = selectedOption?.label || '';
      const fullReason = details ? `${baseReason}. ${details}` : baseReason;
      setFormData(prev => ({ ...prev, reason: fullReason }));
    }

    // Clear error when user types
    if (errors.reason) {
      setErrors(prev => ({ ...prev, reason: undefined }));
    }
  };

  if (isLoading || !calculation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Calculating refund amount...</p>
        </div>
      </div>
    );
  }

  const isOutsidePolicyWindow = !calculation.is_policy_eligible;

  // Calculate available refund amount
  const totalPaid = calculation?.breakdown?.total_paid || booking.amount_paid || 0;
  const totalRefunded = calculation?.breakdown?.total_refunded || booking.total_refunded || 0;
  const availableForRefund = totalPaid - totalRefunded;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Policy Information Banner */}
      <Alert
        variant={isOutsidePolicyWindow ? 'warning' : 'info'}
        title={`Cancellation Policy: ${calculation.policy}`}
      >
        <div className="space-y-2 text-sm">
          <p>
            Check-in is in <strong>{calculation.days_until_checkin} days</strong>.
          </p>
          {calculation.is_policy_eligible ? (
            <p>
              Based on the cancellation policy, you are eligible for a refund of up to{' '}
              <AmountDisplay
                amount={calculation.policy_amount}
                currency={booking.currency}
                size="sm"
                className="font-semibold"
              />
              .
            </p>
          ) : (
            <p className="text-warning-dark dark:text-warning">
              Based on the cancellation policy and timing, you may not be eligible for a full
              refund. However, you can still submit a request for admin review.
            </p>
          )}
        </div>
      </Alert>

      {/* Amount Field */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Refund Amount <span className="text-error">*</span>
        </label>
        <div className="space-y-2">
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={availableForRefund}
            value={formData.requested_amount || ''}
            onChange={handleAmountChange}
            error={errors.amount}
            placeholder="0.00"
            className="font-mono"
          />
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Total Paid:</span>
              <AmountDisplay
                amount={totalPaid}
                currency={booking.currency}
                size="sm"
              />
            </div>
            <div className="flex justify-between">
              <span>Already Refunded:</span>
              <AmountDisplay
                amount={totalRefunded}
                currency={booking.currency}
                size="sm"
              />
            </div>
            <div className="flex justify-between font-semibold pt-1 border-t border-gray-200 dark:border-dark-border">
              <span>Available for Refund:</span>
              <AmountDisplay
                amount={availableForRefund}
                currency={booking.currency}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reason Selection */}
      <div>
        <label htmlFor="reason-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reason for Refund <span className="text-error">*</span>
        </label>
        <Select
          id="reason-select"
          value={selectedReason}
          onChange={(e) => handleReasonSelect(e.target.value)}
          options={REFUND_REASONS}
          placeholder="Select a reason"
        />
      </div>

      {/* Reason Details */}
      {(selectedReason === 'other' || selectedReason) && (
        <div>
          <label htmlFor="reason-details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {selectedReason === 'other' ? 'Please explain' : 'Additional details (optional)'}
            {selectedReason === 'other' && <span className="text-error"> *</span>}
          </label>
          <Textarea
            id="reason-details"
            value={additionalDetails}
            onChange={handleReasonText}
            error={errors.reason}
            placeholder="Please provide details about your refund request"
            rows={4}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {additionalDetails.length}/500 characters
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting || !selectedReason}
        >
          Submit Refund Request
        </Button>
      </div>
    </form>
  );
};
