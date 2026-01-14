/**
 * DateInput Component
 *
 * Modern date input that opens DatePickerModal
 * Replaces native date inputs across the app
 */

import React, { useState } from 'react';
import { HiCalendar } from 'react-icons/hi';
import { DatePickerModal } from '../DatePickerModal';
import type { DateInputProps } from './DateInput.types';

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  disabled = false,
  error,
  helperText,
  required = false,
  minDate,
  maxDate,
  disabledDates = [],
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateSelect = (selectedDate: Date) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    onChange(dateString);
    setIsModalOpen(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsModalOpen(true)}
          disabled={disabled}
          className={`
            w-full px-4 py-2 pr-10 text-left
            border rounded-lg
            transition-all
            ${
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-dark-border focus:ring-2 focus:ring-primary focus:border-primary'
            }
            ${
              disabled
                ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                : 'bg-white dark:bg-dark-bg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
            text-sm
          `}
        >
          {value ? formatDisplayDate(value) : placeholder}
        </button>

        {/* Calendar Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <HiCalendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>

        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Clear date"
          >
            <svg
              className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Helper text / Error */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDateSelect={handleDateSelect}
        mode="single"
        initialCheckIn={value ? new Date(value) : undefined}
        minDate={minDate}
        maxDate={maxDate}
        disabledDates={disabledDates}
        title={label || 'Select Date'}
      />
    </div>
  );
};
