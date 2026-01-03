import React from 'react';
import type { DateRangePickerProps } from './DateRangePicker.types';

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

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
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      startDate: e.target.value || null,
    });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      endDate: e.target.value || null,
    });
  };

  const clearDates = () => {
    onChange({ startDate: null, endDate: null });
  };

  const inputClasses = `
    w-full pl-9 pr-3 py-2 text-sm
    border rounded-md
    bg-white dark:bg-dark-bg
    text-gray-900 dark:text-white
    ${error
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary'
    }
    ${disabled
      ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'
      : ''
    }
    focus:outline-none focus:ring-2
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        {/* Start date */}
        <div className="flex-1 w-full">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {startLabel}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <CalendarIcon />
            </span>
            <input
              type="date"
              value={value.startDate || ''}
              onChange={handleStartChange}
              disabled={disabled}
              min={minDate}
              max={value.endDate || maxDate}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Separator */}
        <span className="hidden sm:block text-gray-400 mt-5">-</span>

        {/* End date */}
        <div className="flex-1 w-full">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {endLabel}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <CalendarIcon />
            </span>
            <input
              type="date"
              value={value.endDate || ''}
              onChange={handleEndChange}
              disabled={disabled}
              min={value.startDate || minDate}
              max={maxDate}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Clear button */}
        {(value.startDate || value.endDate) && !disabled && (
          <button
            type="button"
            onClick={clearDates}
            className="mt-5 px-2 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Clear dates"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    </div>
  );
};
