/**
 * RatesTab Component
 *
 * Display combined room rates and availability calendar for all rooms
 */

import React, { useState, useMemo } from 'react';
import { Button, DateInput } from '@/components/ui';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import type { RatesTabProps } from './RatesTab.types';

interface DateInfo {
  date: Date;
  dateString: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isWeekend: boolean;
}

interface RoomDatePrice {
  price: number;
  rateName?: string;
  isBooked: boolean;
}

export const RatesTab: React.FC<RatesTabProps> = ({ rooms, currency, onDateSelect }) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const daysToShow = 14;

  // Filter out inactive or paused rooms
  const availableRooms = rooms.filter((room) => room.is_active && !room.is_paused);

  // Handle date cell click
  const handleDateClick = (date: Date, roomId: string, isBooked: boolean) => {
    if (isBooked) return; // Don't allow booking on fully booked dates

    if (onDateSelect) {
      onDateSelect(date, roomId);
    }
  };

  if (availableRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No rooms are currently available for booking.
        </p>
      </div>
    );
  }

  // Generate array of dates to display
  const dates = useMemo((): DateInfo[] => {
    const dateArray: DateInfo[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(current);
      date.setDate(current.getDate() + i);

      const dateString = date.toISOString().split('T')[0];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = date.getTime() === today.getTime();

      dateArray.push({
        date,
        dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday,
        isWeekend,
      });
    }

    return dateArray;
  }, [startDate, daysToShow]);

  // Get pricing for a specific room on a specific date
  const getRoomPricing = (room: typeof availableRooms[0], date: Date): RoomDatePrice => {
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

    return {
      price,
      rateName: applicableRate?.name,
      isBooked: false, // TODO: Connect to actual booking data if available
    };
  };

  // Navigation handlers
  const handlePrevious = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() - daysToShow);
    setStartDate(newStartDate);
  };

  const handleNext = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() + daysToShow);
    setStartDate(newStartDate);
  };

  const handleDateChange = (value: string) => {
    const newDate = new Date(value);
    if (!isNaN(newDate.getTime())) {
      setStartDate(newDate);
    }
  };

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
          Room Rates & Availability
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Compare rates across all rooms. Seasonal rates and special pricing may apply during certain periods.
        </p>
      </div>

      {/* Combined Calendar */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
        {/* Header with date picker and navigation */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-64">
            <DateInput
              label="Check-in"
              value={startDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              placeholder="Select date"
            />
          </div>

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
        </div>

        {/* Pricing table */}
        <div className="overflow-x-auto
          [&::-webkit-scrollbar]:h-2
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:m-1
          dark:[&::-webkit-scrollbar-track]:bg-gray-800/50
          [&::-webkit-scrollbar-thumb]:bg-gray-400
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:border-2
          [&::-webkit-scrollbar-thumb]:border-white
          dark:[&::-webkit-scrollbar-thumb]:bg-gray-600
          dark:[&::-webkit-scrollbar-thumb]:border-dark-card
          hover:[&::-webkit-scrollbar-thumb]:bg-gray-500
          dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500
        ">
          <table className="w-full border-collapse border border-gray-200 dark:border-dark-border">
            {/* Header row with dates */}
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-card">
                <th className="border border-gray-200 dark:border-dark-border p-3 text-left min-w-[180px] sticky left-0 bg-gray-50 dark:bg-dark-card z-10">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    Room Type
                  </div>
                </th>
                {dates.map((dateInfo) => (
                  <th
                    key={dateInfo.dateString}
                    className={`border border-gray-200 dark:border-dark-border p-2 min-w-[100px] ${
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
                        {dateInfo.dayNumber} {dateInfo.monthName}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body rows - one per room */}
            <tbody>
              {availableRooms.map((room) => (
                <tr key={room.id}>
                  <td className="border border-gray-200 dark:border-dark-border p-3 bg-gray-50 dark:bg-dark-card sticky left-0 z-10">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {room.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Sleeps {room.max_guests}
                    </div>
                  </td>
                  {dates.map((dateInfo) => {
                    const pricing = getRoomPricing(room, dateInfo.date);
                    const tooltipText = pricing.isBooked
                      ? 'Fully booked - unavailable'
                      : pricing.rateName
                      ? `${pricing.rateName} - Click to book`
                      : 'Available - Click to book';

                    return (
                      <td
                        key={dateInfo.dateString}
                        onClick={() => handleDateClick(dateInfo.date, room.id, pricing.isBooked)}
                        title={tooltipText}
                        className={`border border-gray-200 dark:border-dark-border p-2 text-center transition-all ${
                          pricing.isBooked
                            ? 'bg-red-50 dark:bg-red-900/20 cursor-not-allowed'
                            : pricing.rateName
                            ? 'bg-green-50 dark:bg-green-900/20 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30'
                            : 'bg-green-50/50 dark:bg-green-900/10 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {pricing.isBooked ? (
                          <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                            FULL
                          </div>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-primary">
                              {formatPrice(pricing.price)}
                            </div>
                            {pricing.rateName && (
                              <div className="text-xs text-primary font-medium mt-1">
                                {pricing.rateName}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 dark:bg-green-900/10 border border-gray-200 dark:border-dark-border" />
            <span>Base rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 dark:bg-green-900/20 border border-gray-200 dark:border-dark-border" />
            <span>Seasonal rate applied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 dark:bg-red-900/20 border border-gray-200 dark:border-dark-border" />
            <span>Fully booked</span>
          </div>
        </div>
      </div>

      {/* Information Footer */}
      <div className="bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-white">Note:</strong> Prices shown are per night.
          Additional fees may apply. Seasonal rates automatically apply during specified date ranges.
        </p>
      </div>
    </div>
  );
};
