/**
 * SeasonalRatesCalendar Component
 *
 * Displays seasonal rates in a calendar/table format similar to booking.com
 * Shows pricing across dates with seasonal rate variations
 */

import React, { useState, useMemo } from 'react';
import { Button, DateInput } from '@/components/ui';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import type { SeasonalRatesCalendarProps, DateCellInfo } from './SeasonalRatesCalendar.types';

export const SeasonalRatesCalendar: React.FC<SeasonalRatesCalendarProps> = ({
  room,
  startDate: initialStartDate,
  daysToShow = 7,
  bookedDates = [],
  compact = false,
  showNavigation = true,
  onDateRangeChange,
  onDateSelect,
}) => {
  const [startDate, setStartDate] = useState<Date>(initialStartDate || new Date());

  // Handle date cell click
  const handleDateClick = (date: Date, isBooked: boolean) => {
    if (isBooked) return; // Don't allow booking on fully booked dates

    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Generate array of dates to display
  const dates = useMemo(() => {
    const dateArray: DateCellInfo[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(current);
      date.setDate(current.getDate() + i);

      const dateString = date.toISOString().split('T')[0];
      const isBooked = bookedDates.some(
        (bookedDate) => bookedDate.toISOString().split('T')[0] === dateString
      );
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = date.getTime() === today.getTime();

      // Find applicable seasonal rate for this date
      const applicableRate = room.seasonal_rates?.find((rate) => {
        if (!rate.is_active) return false;
        const rateStart = new Date(rate.start_date);
        const rateEnd = new Date(rate.end_date);
        rateStart.setHours(0, 0, 0, 0);
        rateEnd.setHours(0, 0, 0, 0);
        return date >= rateStart && date <= rateEnd;
      });

      const price = applicableRate?.price_per_night || room.base_price_per_night;

      dateArray.push({
        date,
        dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        price,
        rateName: applicableRate?.name,
        isBooked,
        isWeekend,
        isToday,
      });
    }

    return dateArray;
  }, [startDate, daysToShow, bookedDates, room.seasonal_rates, room.base_price_per_night]);

  // Navigation handlers
  const handlePrevious = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() - daysToShow);
    setStartDate(newStartDate);

    if (onDateRangeChange) {
      const endDate = new Date(newStartDate);
      endDate.setDate(newStartDate.getDate() + daysToShow - 1);
      onDateRangeChange(newStartDate, endDate);
    }
  };

  const handleNext = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() + daysToShow);
    setStartDate(newStartDate);

    if (onDateRangeChange) {
      const endDate = new Date(newStartDate);
      endDate.setDate(newStartDate.getDate() + daysToShow - 1);
      onDateRangeChange(newStartDate, endDate);
    }
  };

  const handleDateChange = (value: string) => {
    const newDate = new Date(value);
    if (!isNaN(newDate.getTime())) {
      setStartDate(newDate);

      if (onDateRangeChange) {
        const endDate = new Date(newDate);
        endDate.setDate(newDate.getDate() + daysToShow - 1);
        onDateRangeChange(newDate, endDate);
      }
    }
  };

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: room.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Header with date picker and navigation */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-64">
          <DateInput
            label="Check-in"
            value={startDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            placeholder="Select date"
          />
        </div>

        {showNavigation && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              className="p-2"
            >
              <HiOutlineChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="p-2"
            >
              <HiOutlineChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Pricing table */}
      <div className="overflow-x-auto styled-scrollbar-horizontal">
        <table className="w-full border-collapse border border-gray-200 dark:border-dark-border">
          {/* Header row with dates */}
          <thead>
            <tr className="bg-gray-50 dark:bg-dark-card">
              <th className="border border-gray-200 dark:border-dark-border p-3 text-left min-w-[200px]">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {room.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sleeps up to {room.max_guests} {room.max_guests === 1 ? 'person' : 'people'}
                </div>
              </th>
              {dates.map((dateInfo) => (
                <th
                  key={dateInfo.dateString}
                  className={`border border-gray-200 dark:border-dark-border p-2 min-w-[120px] ${
                    dateInfo.isToday ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {dateInfo.dayName}
                    </div>
                    <div className={`text-sm font-semibold ${
                      dateInfo.isToday
                        ? 'text-primary'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {dateInfo.dayNumber}{compact ? '' : ` ${dateInfo.monthName}`}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body row with pricing */}
          <tbody>
            <tr>
              <td className="border border-gray-200 dark:border-dark-border p-3 bg-gray-50 dark:bg-dark-card">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Base rate
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatPrice(room.base_price_per_night)} per night
                </div>
              </td>
              {dates.map((dateInfo) => {
                const tooltipText = dateInfo.isBooked
                  ? 'Fully booked - unavailable'
                  : dateInfo.rateName
                  ? `${dateInfo.rateName} - Click to book`
                  : 'Available - Click to book';

                return (
                  <td
                    key={dateInfo.dateString}
                    onClick={() => handleDateClick(dateInfo.date, dateInfo.isBooked)}
                    title={tooltipText}
                    className={`border border-gray-200 dark:border-dark-border p-3 text-center transition-all ${
                      dateInfo.isBooked
                        ? 'bg-red-50 dark:bg-red-900/20 cursor-not-allowed'
                        : dateInfo.rateName
                        ? 'bg-green-50 dark:bg-green-900/20 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30'
                        : 'bg-green-50/50 dark:bg-green-900/10 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20'
                    }`}
                  >
                    {dateInfo.isBooked ? (
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                        FULL
                      </div>
                    ) : (
                      <>
                        <div className="text-base font-bold text-primary">
                          {formatPrice(dateInfo.price)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          per night for {room.max_guests}
                        </div>
                        {dateInfo.rateName && !compact && (
                          <div className="text-xs text-primary font-medium mt-1">
                            {dateInfo.rateName}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {room.seasonal_rates && room.seasonal_rates.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 dark:bg-green-900/10 border border-gray-200 dark:border-dark-border" />
            <span>Base rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 dark:bg-green-900/20 border border-gray-200 dark:border-dark-border" />
            <span>Seasonal rate applied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-dark-border" />
            <span>Fully booked</span>
          </div>
        </div>
      )}

      {/* Active seasonal rates summary */}
      {room.seasonal_rates && room.seasonal_rates.length > 0 && !compact && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Active Seasonal Rates
          </h4>
          <div className="space-y-2">
            {room.seasonal_rates
              .filter((rate) => rate.is_active)
              .map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {rate.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(rate.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(rate.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-primary">
                      {formatPrice(rate.price_per_night)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      per night
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
