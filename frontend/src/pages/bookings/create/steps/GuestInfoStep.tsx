/**
 * GuestInfoStep Component
 *
 * Step 4 of the booking wizard: Guest information, source, and notes.
 */

import React, { useState } from 'react';
import { Input, Select, Textarea, PhoneInput } from '@/components/ui';
import { BookingFooter } from '../components/BookingFooter';
import type { GuestInfoStepProps } from '../CreateBookingPage.types';
import type { BookingSource, PaymentMethod } from '@/types/booking.types';
import { BOOKING_SOURCE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/booking.types';

// ============================================================================
// Icons
// ============================================================================

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export const GuestInfoStep: React.FC<GuestInfoStepProps> = ({
  formData,
  onUpdate,
  onBack,
  onContinue,
  onCancel,
  isLoading,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Source options (filter out non-manual sources)
  const sourceOptions = Object.entries(BOOKING_SOURCE_LABELS)
    .filter(([key]) => !['block', 'vilo', 'website'].includes(key))
    .map(([value, label]) => ({ value, label }));

  // Payment method options
  const paymentMethodOptions = [
    { value: '', label: 'Not specified' },
    ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label })),
  ];

  // Handle field changes with error clearing
  const handleChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation
  const validateAndContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Guest name is required';
    }

    if (!formData.guest_email.trim()) {
      newErrors.guest_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      newErrors.guest_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onContinue();
    }
  };

  // Can proceed
  const canProceed =
    formData.guest_name.trim() &&
    formData.guest_email.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email);

  return (
    <div className="flex flex-col h-full">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 text-primary items-center justify-center mb-4">
          <UserIcon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Guest Details</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Enter the guest's contact information
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Guest Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Guest Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.guest_name}
            onChange={(e) => handleChange('guest_name', e.target.value)}
            placeholder="John Doe"
            error={errors.guest_name}
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                type="email"
                value={formData.guest_email}
                onChange={(e) => handleChange('guest_email', e.target.value)}
                placeholder="john@example.com"
                className="pl-10"
                error={errors.guest_email}
              />
            </div>
          </div>
          <div>
            <PhoneInput
              label="Phone"
              value={formData.guest_phone}
              onChange={(value) => handleChange('guest_phone', value)}
              placeholder="+27 12 345 6789"
              defaultCountry="ZA"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-dark-border pt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Booking Information
          </h3>

          {/* Source & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Booking Source
              </label>
              <Select
                value={formData.source}
                onChange={(e) => onUpdate({ source: e.target.value as BookingSource })}
                options={sourceOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Method
              </label>
              <Select
                value={formData.payment_method}
                onChange={(e) =>
                  onUpdate({ payment_method: e.target.value as PaymentMethod | '' })
                }
                options={paymentMethodOptions}
              />
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Special Requests
          </label>
          <Textarea
            value={formData.special_requests}
            onChange={(e) => onUpdate({ special_requests: e.target.value })}
            placeholder="Any special requests from the guest..."
            rows={3}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            These requests will be visible on the booking details.
          </p>
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Internal Notes
          </label>
          <Textarea
            value={formData.internal_notes}
            onChange={(e) => onUpdate({ internal_notes: e.target.value })}
            placeholder="Internal notes (not visible to guest)..."
            rows={2}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Only visible to staff members.
          </p>
        </div>
      </div>

      {/* Footer */}
      <BookingFooter
        onCancel={onCancel}
        onContinue={validateAndContinue}
        onBack={onBack}
        showBack
        continueLabel="Continue to Review"
        continueDisabled={!canProceed}
        isLoading={isLoading}
      />
    </div>
  );
};

export default GuestInfoStep;
