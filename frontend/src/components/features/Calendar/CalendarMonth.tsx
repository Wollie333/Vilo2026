/**
 * CalendarMonth
 *
 * Traditional monthly calendar view showing bookings as dots/badges on days.
 */

import React, { useMemo, useState } from 'react';
import { Tooltip, PaymentProofBadge } from '@/components/ui';
import type { PaymentProofStatus } from '@/components/ui';
import type {
  CalendarMonthProps,
  CalendarEntry,
  CalendarDay,
  CalendarWeek,
} from './Calendar.types';
import {
  BOOKING_STATUS_CALENDAR_COLORS,
  PAYMENT_STATUS_CALENDAR_COLORS,
} from './Calendar.types';
import { BOOKING_STATUS_LABELS, formatCurrency } from '@/types/booking.types';

// ============================================================================
// Constants
// ============================================================================

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================================
// Icons
// ============================================================================

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getPaymentProofStatus = (entry: CalendarEntry): PaymentProofStatus => {
  if (!entry.payment_proof_url) return 'none';
  if (entry.payment_verified_at) return 'verified';
  if (entry.payment_rejection_reason) return 'rejected';
  return 'pending';
};

const getMonthDays = (month: Date): CalendarWeek[] => {
  const weeks: CalendarWeek[] = [];
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // Get first day of month
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  // Start from the first Sunday before or on the first day
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // End on the last Saturday after or on the last day
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentWeek: CalendarDay[] = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const day: CalendarDay = {
      date: new Date(current),
      isCurrentMonth: current.getMonth() === monthIndex,
      isToday: isSameDay(current, today),
      entries: [],
    };

    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek });
      currentWeek = [];
    }

    current.setDate(current.getDate() + 1);
  }

  return weeks;
};

const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
};

const getEntryColor = (entry: CalendarEntry): string => {
  if (entry.type === 'block') return 'bg-gray-500';
  if (entry.type === 'maintenance') return 'bg-yellow-500';
  if (entry.booking_status) {
    return BOOKING_STATUS_CALENDAR_COLORS[entry.booking_status];
  }
  return 'bg-primary';
};

// ============================================================================
// Day Cell Component
// ============================================================================

interface DayCellProps {
  day: CalendarDay;
  onClick?: () => void;
  onEntryClick?: (entry: CalendarEntry, allDayEntries?: CalendarEntry[]) => void;
  onAddBooking?: (date: Date) => void;
}

const DayCell: React.FC<DayCellProps> = ({ day, onClick, onEntryClick, onAddBooking }) => {
  const [isHovered, setIsHovered] = useState(false);
  const maxVisible = 3;
  const hasMore = day.entries.length > maxVisible;
  const visibleEntries = day.entries.slice(0, maxVisible);

  return (
    <div
      className={`relative
        min-h-[100px] p-1 border-r border-b border-gray-200 dark:border-dark-border cursor-pointer
        hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors
        ${!day.isCurrentMonth ? 'bg-gray-50 dark:bg-dark-bg/50' : ''}
        ${day.isToday ? 'bg-primary/5' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Day number */}
      <div
        className={`
          text-sm font-medium mb-1
          ${day.isToday
            ? 'w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center'
            : day.isCurrentMonth
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-400 dark:text-gray-600'
          }
        `}
      >
        {day.date.getDate()}
      </div>

      {/* Entries */}
      <div className="space-y-1">
        {visibleEntries.map((entry) => {
          const colorClass = getEntryColor(entry);
          const isBlock = entry.type === 'block' || entry.type === 'maintenance';
          const paymentProofStatus = getPaymentProofStatus(entry);
          const isCancelled = entry.booking_status === 'cancelled';

          return (
            <Tooltip
              key={entry.id}
              content={
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
                      {entry.booking_status && (
                        <div className="mt-1 text-[10px] text-gray-300">
                          {BOOKING_STATUS_LABELS[entry.booking_status]}
                        </div>
                      )}
                      {entry.total_amount !== undefined && (
                        <div className="mt-1 text-gray-300">
                          {formatCurrency(entry.total_amount, entry.currency || 'ZAR')}
                        </div>
                      )}

                      {/* Payment Proof Status */}
                      {paymentProofStatus !== 'none' && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <PaymentProofBadge
                            status={paymentProofStatus}
                            uploadedAt={entry.payment_proof_uploaded_at}
                            verifiedAt={entry.payment_verified_at}
                          />
                        </div>
                      )}

                      {/* Refund Info */}
                      {entry.refund_status && entry.refund_status !== 'none' && (
                        <div className="mt-2 pt-2 border-t border-gray-600 text-purple-400 text-[10px]">
                          {entry.refund_status === 'full' ? 'Fully Refunded' : 'Partially Refunded'}
                        </div>
                      )}

                      {/* Pending Modification */}
                      {entry.has_pending_modification && (
                        <div className="mt-2 pt-2 border-t border-gray-600 text-purple-400 text-[10px]">
                          ⚠️ Modification Pending
                        </div>
                      )}
                    </>
                  )}
                </div>
              }
            >
              <div
                className={`
                  text-xs px-1.5 py-0.5 rounded truncate text-white flex items-center gap-1
                  ${colorClass} hover:opacity-80 transition-opacity relative
                  ${isBlock ? 'opacity-70' : ''}
                  ${isCancelled ? 'opacity-50 line-through' : ''}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onEntryClick?.(entry, day.entries);
                }}
              >
                {/* Payment Status Dot */}
                {!isBlock && paymentProofStatus !== 'none' && (
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      paymentProofStatus === 'verified' ? 'bg-green-400' :
                      paymentProofStatus === 'pending' ? 'bg-orange-400' :
                      'bg-red-400'
                    }`}
                    title={`Payment: ${paymentProofStatus}`}
                  />
                )}
                <span className="truncate">
                  {isBlock
                    ? entry.type === 'maintenance' ? 'Maint.' : 'Blocked'
                    : entry.guest_name?.split(' ')[0] || entry.booking_reference?.slice(0, 8)
                  }
                </span>
              </div>
            </Tooltip>
          );
        })}
        {hasMore && (
          <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
            +{day.entries.length - maxVisible} more
          </div>
        )}
      </div>

      {/* Plus icon - visible on hover */}
      {isHovered && onAddBooking && (
        <button
          className="absolute bottom-1 right-1 p-1 rounded-full bg-primary text-white
                     hover:bg-primary/90 transition-all shadow-md z-10"
          onClick={(e) => {
            e.stopPropagation();
            onAddBooking(day.date);
          }}
          title="Create new booking"
          aria-label={`Create booking for ${day.date.toLocaleDateString()}`}
        >
          <PlusIcon />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const CalendarMonth: React.FC<CalendarMonthProps> = ({
  entries,
  month,
  onEntryClick,
  onDateClick,
  onAddBooking,
  highlightToday: _highlightToday = true,
}) => {
  // Generate calendar structure
  const weeks = useMemo(() => getMonthDays(month), [month]);

  // Assign entries to days
  const weeksWithEntries = useMemo(() => {
    return weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => {
        const dayEntries = entries.filter((entry) => {
          const start = new Date(entry.start_date);
          const end = new Date(entry.end_date);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return isDateInRange(day.date, start, end);
        });

        return {
          ...day,
          entries: dayEntries,
        };
      }),
    }));
  }, [weeks, entries]);

  return (
    <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-card">
      {/* Weekday header */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {weeksWithEntries.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.days.map((day, dayIndex) => (
              <DayCell
                key={dayIndex}
                day={day}
                onClick={() => onDateClick?.(day.date)}
                onEntryClick={onEntryClick}
                onAddBooking={onAddBooking}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarMonth;
