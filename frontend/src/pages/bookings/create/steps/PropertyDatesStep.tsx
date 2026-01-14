/**
 * PropertyDatesStep Component
 *
 * Step 1 of the booking wizard: Select property and dates.
 */

import React, { useState, useMemo } from 'react';
import { Input, Select, DateInput } from '@/components/ui';
import { BookingFooter } from '../components/BookingFooter';
import type { PropertyDatesStepProps } from '../CreateBookingPage.types';

// ============================================================================
// Icons
// ============================================================================

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export const PropertyDatesStep: React.FC<PropertyDatesStepProps> = ({
  formData,
  onUpdate,
  properties,
  onContinue,
  onCancel,
  isLoading,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Property options for select
  const propertyOptions = useMemo(
    () => [
      { value: '', label: 'Select a property' },
      ...properties.map((p) => ({ value: p.id, label: p.name })),
    ],
    [properties]
  );

  // Calculate nights
  const nights = useMemo(() => {
    if (!formData.check_in_date || !formData.check_out_date) return 0;
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  }, [formData.check_in_date, formData.check_out_date]);

  // Handle field changes
  const handlePropertyChange = (value: string) => {
    onUpdate({ property_id: value, rooms: [] });
    if (errors.property_id) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.property_id;
        return newErrors;
      });
    }
  };

  const handleCheckInChange = (value: string) => {
    onUpdate({ check_in_date: value, rooms: [] });
    if (errors.check_in_date) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.check_in_date;
        return newErrors;
      });
    }
  };

  const handleCheckOutChange = (value: string) => {
    onUpdate({ check_out_date: value, rooms: [] });
    if (errors.check_out_date || errors.dates) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.check_out_date;
        delete newErrors.dates;
        return newErrors;
      });
    }
  };

  // Validation
  const validateAndContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.property_id) {
      newErrors.property_id = 'Please select a property';
    }

    if (!formData.check_in_date) {
      newErrors.check_in_date = 'Check-in date is required';
    }

    if (!formData.check_out_date) {
      newErrors.check_out_date = 'Check-out date is required';
    }

    if (
      formData.check_in_date &&
      formData.check_out_date &&
      new Date(formData.check_out_date) <= new Date(formData.check_in_date)
    ) {
      newErrors.dates = 'Check-out date must be after check-in date';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onContinue();
    }
  };

  // Can proceed
  const canProceed =
    formData.property_id &&
    formData.check_in_date &&
    formData.check_out_date &&
    new Date(formData.check_out_date) > new Date(formData.check_in_date);

  // Today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-full">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 text-primary items-center justify-center mb-4">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Property & Dates</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Choose the property and booking period
        </p>
      </div>

      {/* Form Fields */}
      <div className="flex-1 space-y-6">
        {/* Property Select */}
        <div>
          <Select
            label="Property"
            value={formData.property_id}
            onChange={(e) => handlePropertyChange(e.target.value)}
            options={propertyOptions}
            error={errors.property_id}
            required
          />
        </div>

        {/* Date Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <DateInput
              label="Check-in Date"
              value={formData.check_in_date}
              onChange={handleCheckInChange}
              minDate={new Date(today)}
              error={errors.check_in_date}
              required
              placeholder="Select check-in date"
            />
          </div>
          <div>
            <DateInput
              label="Check-out Date"
              value={formData.check_out_date}
              onChange={handleCheckOutChange}
              minDate={formData.check_in_date ? new Date(formData.check_in_date) : new Date(today)}
              error={errors.check_out_date || errors.dates}
              required
              placeholder="Select check-out date"
            />
          </div>
        </div>

        {/* Nights Display */}
        {nights > 0 && (
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
              <CalendarIcon className="w-4 h-4" />
              {nights} night{nights !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <BookingFooter
        onCancel={onCancel}
        onContinue={validateAndContinue}
        continueLabel="Continue to Rooms"
        continueDisabled={!canProceed}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PropertyDatesStep;
