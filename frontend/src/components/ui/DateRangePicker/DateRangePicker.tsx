/**
 * DateRangePicker Component
 *
 * Modern date range picker using DatePickerModal
 */

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { DatePickerModal } from '../DatePickerModal';
import type { DateRangePickerProps } from './DateRangePicker.types';

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  label,
  startLabel = 'From',
  endLabel = 'To',
  disabled = false,
  error,
  helperText,
  minDate,
  maxDate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<'start' | 'end'>('start');

  const handleDateSelect = (checkIn: Date, checkOut?: Date) => {
    if (checkOut) {
      // Range selected
      onChange({
        startDate: checkIn.toISOString().split('T')[0],
        endDate: checkOut.toISOString().split('T')[0],
      });
    } else {
      // Single date selected based on which field was clicked
      if (editingField === 'start') {
        onChange({
          ...value,
          startDate: checkIn.toISOString().split('T')[0],
        });
      } else {
        onChange({
          ...value,
          endDate: checkIn.toISOString().split('T')[0],
        });
      }
    }
    setIsModalOpen(false);
  };

  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const clearDates = () => {
    onChange({ startDate: null, endDate: null });
  };

  const openModal = (field: 'start' | 'end') => {
    if (!disabled) {
      setEditingField(field);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div className="relative h-full">
        <button
          type="button"
          onClick={() => openModal('start')}
          disabled={disabled}
          className={`
            w-full h-full px-4 py-2 pr-10 text-left
            border rounded-lg text-sm
            transition-all whitespace-nowrap overflow-hidden text-ellipsis
            ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-dark-border focus:ring-2 focus:ring-primary'
            }
            ${
              disabled
                ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
                : 'bg-white dark:bg-dark-bg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${value.startDate || value.endDate ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
          `}
        >
          {value.startDate && value.endDate
            ? `${formatDisplayDate(value.startDate)} - ${formatDisplayDate(value.endDate)}`
            : value.startDate
            ? formatDisplayDate(value.startDate)
            : 'Select dates'}
        </button>
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" />
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
        mode="range"
        initialCheckIn={value.startDate ? new Date(value.startDate) : undefined}
        initialCheckOut={value.endDate ? new Date(value.endDate) : undefined}
        minDate={minDate ? new Date(minDate) : new Date()}
        maxDate={maxDate ? new Date(maxDate) : undefined}
        title={label || 'Select Date Range'}
      />
    </div>
  );
};
