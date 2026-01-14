/**
 * CalendarTimeline
 *
 * Timeline/Gantt-style view showing room availability across dates.
 * Best for visualizing multiple rooms at once.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Spinner, Tooltip, PaymentProofBadge } from '@/components/ui';
import type { PaymentProofStatus } from '@/components/ui';
import type {
  CalendarTimelineProps,
  CalendarEntry,
} from './Calendar.types';
import {
  BOOKING_STATUS_CALENDAR_COLORS,
  SOURCE_CALENDAR_COLORS,
  PAYMENT_STATUS_CALENDAR_COLORS,
} from './Calendar.types';
import { formatCurrency } from '@/types/booking.types';

// ============================================================================
// Constants
// ============================================================================

const CELL_WIDTH = 40; // px per day
const ROW_HEIGHT = 48; // px per room row
const HEADER_HEIGHT = 60; // px for date header

// ============================================================================
// Helper Functions
// ============================================================================

const getDatesInRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const getEntryColor = (entry: CalendarEntry): string => {
  if (entry.type === 'block') return 'bg-gray-500';
  if (entry.type === 'maintenance') return 'bg-yellow-500';
  if (entry.booking_status) {
    return BOOKING_STATUS_CALENDAR_COLORS[entry.booking_status];
  }
  if (entry.source) {
    return SOURCE_CALENDAR_COLORS[entry.source];
  }
  return 'bg-primary';
};

const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('en-ZA', { day: 'numeric' });
};

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
};

const formatDayOfWeek = (date: Date): string => {
  return date.toLocaleDateString('en-ZA', { weekday: 'short' });
};

const getPaymentProofStatus = (entry: CalendarEntry): PaymentProofStatus => {
  if (!entry.payment_proof_url) return 'none';
  if (entry.payment_verified_at) return 'verified';
  if (entry.payment_rejection_reason) return 'rejected';
  return 'pending';
};

// Icons for indicators
const WrenchIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// ============================================================================
// Entry Bar Component
// ============================================================================

interface EntryBarProps {
  entry: CalendarEntry;
  startOffset: number;
  width: number;
  onClick?: () => void;
}

const EntryBar: React.FC<EntryBarProps> = ({
  entry,
  startOffset,
  width,
  onClick,
}) => {
  const colorClass = getEntryColor(entry);
  const isBlock = entry.type === 'block' || entry.type === 'maintenance';

  const paymentProofStatus = getPaymentProofStatus(entry);
  const isCancelled = entry.booking_status === 'cancelled';

  const tooltipContent = (
    <div className="text-xs min-w-[180px]">
      {isBlock ? (
        <>
          <div className="font-semibold capitalize">{entry.type}</div>
          {entry.block_reason && <div>{entry.block_reason}</div>}
        </>
      ) : (
        <>
          {/* Room Thumbnail */}
          {entry.room_thumbnail && (
            <div className="mb-2 rounded overflow-hidden">
              <img
                src={entry.room_thumbnail}
                alt={entry.room_name}
                className="w-full h-16 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className={`font-semibold ${isCancelled ? 'line-through' : ''}`}>
            {entry.guest_name || 'Guest'}
          </div>
          <div className="text-gray-300">{entry.room_name}</div>
          <div className="text-gray-400 text-[10px]">{entry.booking_reference}</div>
          {entry.total_amount !== undefined && (
            <div className="mt-1 text-gray-300">
              {formatCurrency(entry.total_amount, entry.currency || 'ZAR')}
            </div>
          )}

          {/* Payment Proof Status */}
          {paymentProofStatus !== 'none' && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-gray-400 mb-1">Payment Proof:</div>
              <div className="flex items-center gap-1">
                <PaymentProofBadge
                  status={paymentProofStatus}
                  uploadedAt={entry.payment_proof_uploaded_at}
                  verifiedAt={entry.payment_verified_at}
                />
              </div>
              {entry.payment_rejection_reason && (
                <div className="mt-1 text-red-400 text-[10px]">
                  {entry.payment_rejection_reason}
                </div>
              )}
            </div>
          )}

          {/* Refund Information */}
          {entry.refund_status && entry.refund_status !== 'none' && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-purple-400">
                {entry.refund_status === 'full' ? 'Fully Refunded' : 'Partially Refunded'}
                {entry.total_refunded !== undefined && entry.total_refunded > 0 && (
                  <span className="ml-1">
                    ({formatCurrency(entry.total_refunded, entry.currency || 'ZAR')})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Pending Modification */}
          {entry.has_pending_modification && (
            <div className="mt-2 pt-2 border-t border-gray-600 text-purple-400">
              ⚠️ Modification pending guest approval
            </div>
          )}

          {/* Cancelled Status */}
          {isCancelled && (
            <div className="mt-2 pt-2 border-t border-gray-600 text-red-400">
              ❌ Cancelled
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`
          absolute top-1 h-[calc(100%-8px)] rounded cursor-pointer
          ${colorClass} text-white text-xs font-medium
          flex items-center px-2 overflow-hidden whitespace-nowrap
          hover:opacity-90 transition-opacity shadow-sm relative
          ${isBlock ? 'opacity-70 bg-repeat' : ''}
          ${isCancelled ? 'opacity-50' : ''}
        `}
        style={{
          left: `${startOffset}px`,
          width: `${Math.max(width - 2, 20)}px`,
          ...(isBlock ? {
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px)',
          } : {}),
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {/* Indicators */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-1 py-0.5">
          {/* Left: Pending Modification Icon */}
          {entry.has_pending_modification && !isBlock && (
            <div className="bg-purple-500 rounded-full p-0.5" title="Modification pending">
              <WrenchIcon />
            </div>
          )}
          <div className="flex-1" />
          {/* Right: Payment Proof Badge */}
          {!isBlock && paymentProofStatus !== 'none' && (
            <PaymentProofBadge status={paymentProofStatus} compact />
          )}
        </div>

        {/* Main Label */}
        {width > 60 && (
          <span className={`truncate ${isCancelled ? 'line-through' : ''}`}>
            {isBlock
              ? entry.type === 'maintenance'
                ? 'Maintenance'
                : 'Blocked'
              : entry.guest_name || entry.booking_reference || 'Booking'}
          </span>
        )}
      </div>
    </Tooltip>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const CalendarTimeline: React.FC<CalendarTimelineProps> = ({
  rooms,
  dateRange,
  onEntryClick,
  onDateClick,
  isLoading = false,
  highlightToday = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Generate dates array
  const dates = useMemo(() => {
    return getDatesInRange(dateRange.start, dateRange.end);
  }, [dateRange]);

  const today = useMemo(() => new Date(), []);

  // Calculate entry positions
  const getEntryPosition = (entry: CalendarEntry): { startOffset: number; width: number } | null => {
    const entryStart = new Date(entry.start_date);
    const entryEnd = new Date(entry.end_date);
    const rangeStart = new Date(dateRange.start);
    const rangeEnd = new Date(dateRange.end);

    // Entry completely outside range
    if (entryEnd < rangeStart || entryStart > rangeEnd) {
      return null;
    }

    // Clamp dates to range
    const displayStart = entryStart < rangeStart ? rangeStart : entryStart;
    const displayEnd = entryEnd > rangeEnd ? rangeEnd : entryEnd;

    // Calculate position
    const startDiff = Math.floor(
      (displayStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.ceil(
      (displayEnd.getTime() - displayStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      startOffset: startDiff * CELL_WIDTH,
      width: Math.max(duration, 1) * CELL_WIDTH,
    };
  };

  // Group dates by month for header
  const monthGroups = useMemo(() => {
    const groups: { month: string; days: number; startIndex: number }[] = [];
    let currentMonth = '';
    let currentDays = 0;
    let startIndex = 0;

    dates.forEach((date, index) => {
      const monthKey = formatMonthYear(date);
      if (monthKey !== currentMonth) {
        if (currentMonth) {
          groups.push({ month: currentMonth, days: currentDays, startIndex });
        }
        currentMonth = monthKey;
        currentDays = 1;
        startIndex = index;
      } else {
        currentDays++;
      }
    });

    if (currentMonth) {
      groups.push({ month: currentMonth, days: currentDays, startIndex });
    }

    return groups;
  }, [dates]);

  // Scroll to today on mount
  useEffect(() => {
    if (containerRef.current && highlightToday) {
      const todayIndex = dates.findIndex((d) => isSameDay(d, today));
      if (todayIndex >= 0) {
        const scrollTo = Math.max(0, todayIndex * CELL_WIDTH - 200);
        containerRef.current.scrollLeft = scrollTo;
        setScrollLeft(scrollTo);
      }
    }
  }, [dates, today, highlightToday]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No rooms to display
      </div>
    );
  }

  const totalWidth = dates.length * CELL_WIDTH;

  return (
    <div className="relative border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-card">
      <div className="flex">
        {/* Fixed room column */}
        <div
          className="flex-shrink-0 border-r border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"
          style={{ width: 180 }}
        >
          {/* Room header */}
          <div
            className="border-b border-gray-200 dark:border-dark-border px-3 flex items-end pb-2 font-medium text-gray-700 dark:text-gray-300"
            style={{ height: HEADER_HEIGHT }}
          >
            Rooms
          </div>
          {/* Room rows */}
          {rooms.map((room) => (
            <div
              key={room.id}
              className="border-b border-gray-200 dark:border-dark-border px-3 flex items-center"
              style={{ height: ROW_HEIGHT }}
            >
              <div className="truncate">
                <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {room.name}
                </div>
                {room.property_name && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {room.property_name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable timeline */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto"
          onScroll={handleScroll}
        >
          <div style={{ width: totalWidth, minWidth: '100%' }}>
            {/* Date headers */}
            <div
              className="border-b border-gray-200 dark:border-dark-border"
              style={{ height: HEADER_HEIGHT }}
            >
              {/* Month row */}
              <div className="flex h-1/2 border-b border-gray-100 dark:border-dark-border">
                {monthGroups.map((group, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-dark-border"
                    style={{ width: group.days * CELL_WIDTH }}
                  >
                    {group.month}
                  </div>
                ))}
              </div>
              {/* Day row */}
              <div className="flex h-1/2">
                {dates.map((date, index) => {
                  const isToday = isSameDay(date, today);
                  const weekend = isWeekend(date);

                  return (
                    <div
                      key={index}
                      className={`
                        flex flex-col items-center justify-center text-xs border-r border-gray-100 dark:border-dark-border
                        ${isToday ? 'bg-primary/10' : weekend ? 'bg-gray-50 dark:bg-dark-bg' : ''}
                      `}
                      style={{ width: CELL_WIDTH }}
                    >
                      <span className={`text-[10px] ${weekend ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {formatDayOfWeek(date)}
                      </span>
                      <span className={`font-medium ${isToday ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                        {formatShortDate(date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room rows with entries */}
            {rooms.map((room) => (
              <div
                key={room.id}
                className="relative border-b border-gray-200 dark:border-dark-border"
                style={{ height: ROW_HEIGHT }}
              >
                {/* Background cells */}
                <div className="absolute inset-0 flex">
                  {dates.map((date, index) => {
                    const isToday = isSameDay(date, today);
                    const weekend = isWeekend(date);

                    return (
                      <div
                        key={index}
                        className={`
                          border-r border-gray-100 dark:border-dark-border cursor-pointer
                          hover:bg-gray-100 dark:hover:bg-dark-border transition-colors
                          ${isToday && highlightToday ? 'bg-primary/5' : weekend ? 'bg-gray-50/50 dark:bg-dark-bg/50' : ''}
                        `}
                        style={{ width: CELL_WIDTH }}
                        onClick={() => onDateClick?.(date, room.id)}
                      />
                    );
                  })}
                </div>

                {/* Entry bars */}
                {room.entries.map((entry) => {
                  const position = getEntryPosition(entry);
                  if (!position) return null;

                  return (
                    <EntryBar
                      key={entry.id}
                      entry={entry}
                      startOffset={position.startOffset}
                      width={position.width}
                      onClick={() => onEntryClick?.(entry)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today indicator line */}
      {highlightToday && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-10"
          style={{
            left: `${180 + dates.findIndex((d) => isSameDay(d, today)) * CELL_WIDTH + CELL_WIDTH / 2 - scrollLeft}px`,
            display: dates.some((d) => isSameDay(d, today)) ? 'block' : 'none',
          }}
        />
      )}
    </div>
  );
};

export default CalendarTimeline;
