/**
 * DatePickerModal Component
 *
 * Modern date selection modal with calendar view
 */

import React, { useState, useMemo } from 'react';
import { Modal, Button } from '@/components/ui';
import { HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi';
import type { DatePickerModalProps } from './DatePickerModal.types';

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onDateSelect,
  title = 'Select Dates',
  mode = 'range',
  minDate = new Date(),
  maxDate,
  initialCheckIn,
  initialCheckOut,
  disabledDates = [],
  confirmText = 'Confirm',
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn || null);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut || null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Check if a date is disabled
  const isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(d => d.toDateString() === date.toDateString())) return true;

    return false;
  };

  // Check if date is in selected range
  const isDateInRange = (date: Date | null): boolean => {
    if (!date || !checkIn) return false;

    const compareDate = mode === 'range' && checkOut ? checkOut : hoverDate;
    if (!compareDate) return false;

    const start = checkIn < compareDate ? checkIn : compareDate;
    const end = checkIn < compareDate ? compareDate : checkIn;

    date.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return date > start && date < end;
  };

  // Check if date is selected
  const isDateSelected = (date: Date | null): boolean => {
    if (!date) return false;

    date.setHours(0, 0, 0, 0);

    if (checkIn && date.getTime() === checkIn.getTime()) return true;
    if (mode === 'range' && checkOut && date.getTime() === checkOut.getTime()) return true;

    return false;
  };

  // Handle date click
  const handleDateClick = (date: Date | null) => {
    console.log('📅 [DatePickerModal] Date clicked:', date?.toLocaleDateString());

    if (!date || isDateDisabled(date)) {
      console.log('❌ [DatePickerModal] Date is null or disabled');
      return;
    }

    if (mode === 'single') {
      console.log('📅 [DatePickerModal] Single mode - setting check-in');
      setCheckIn(date);
      setCheckOut(null);
    } else {
      // Range mode
      if (!checkIn || (checkIn && checkOut)) {
        // Start new selection
        console.log('📅 [DatePickerModal] Range mode - starting new selection');
        setCheckIn(date);
        setCheckOut(null);
      } else {
        // Complete the range
        console.log('📅 [DatePickerModal] Range mode - completing range');
        if (date < checkIn) {
          setCheckOut(checkIn);
          setCheckIn(date);
        } else {
          setCheckOut(date);
        }
        console.log('✅ [DatePickerModal] Range selected:', {
          checkIn: checkIn.toLocaleDateString(),
          checkOut: date.toLocaleDateString()
        });
      }
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Handle month selection
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    setCurrentMonth(new Date(currentMonth.getFullYear(), newMonth, 1));
  };

  // Handle year selection
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
  };

  // Confirm selection
  const handleConfirm = () => {
    console.log('✅ [DatePickerModal] Confirm clicked:', {
      checkIn: checkIn?.toLocaleDateString(),
      checkOut: checkOut?.toLocaleDateString()
    });

    if (checkIn) {
      console.log('📅 [DatePickerModal] Calling onDateSelect');
      onDateSelect(checkIn, checkOut || undefined);
      onClose();
    } else {
      console.log('❌ [DatePickerModal] No check-in date selected');
    }
  };

  // Generate year range (current year - 1 to current year + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 1 + i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  console.log('📅 [DatePickerModal] Rendering:', {
    isOpen,
    mode,
    checkIn: checkIn?.toLocaleDateString(),
    checkOut: checkOut?.toLocaleDateString()
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md" headerClassName="bg-primary">
      <div className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="p-2"
          >
            <HiChevronLeft className="w-5 h-5" />
          </Button>

          {/* Month and Year Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={currentMonth.getMonth()}
              onChange={handleMonthChange}
              className="px-3 py-1.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={currentMonth.getFullYear()}
              onChange={handleYearChange}
              className="px-3 py-1.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="p-2"
          >
            <HiChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const disabled = isDateDisabled(date);
            const selected = isDateSelected(date);
            const inRange = isDateInRange(date);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => mode === 'range' && setHoverDate(date)}
                disabled={disabled}
                className={`
                  aspect-square p-2 rounded-lg text-sm font-medium transition-all
                  ${!date ? 'invisible' : ''}
                  ${disabled
                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover cursor-pointer'
                  }
                  ${selected
                    ? 'bg-primary text-white hover:bg-primary/90 dark:hover:bg-primary/80'
                    : ''
                  }
                  ${inRange
                    ? 'bg-primary/10 dark:bg-primary/20'
                    : ''
                  }
                `}
              >
                {date ? date.getDate() : ''}
              </button>
            );
          })}
        </div>

        {/* Selected Date Display */}
        {checkIn && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {checkIn.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {mode === 'range' && checkOut && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {checkOut.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!checkIn || (mode === 'range' && !checkOut)}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
