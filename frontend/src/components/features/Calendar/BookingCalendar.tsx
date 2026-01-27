/**
 * BookingCalendar
 *
 * Main calendar component that supports both timeline and month views.
 * Used for visualizing room availability and bookings.
 */

import React, { useState, useMemo } from 'react';
import { Button, Spinner } from '@/components/ui';
import { CalendarTimeline } from './CalendarTimeline';
import { CalendarMonth } from './CalendarMonth';
import type {
  BookingCalendarProps,
  CalendarViewMode,
  CalendarDateRange,
  RoomCalendarData,
} from './Calendar.types';

// ============================================================================
// Icons
// ============================================================================

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
};

const formatDateRange = (start: Date, end: Date): string => {
  const startStr = start.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
};

const getMonthRange = (date: Date): CalendarDateRange => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};

const getTimelineRange = (date: Date, days: number = 30): CalendarDateRange => {
  const start = new Date(date);
  start.setDate(start.getDate() - 7); // Start a week before
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return { start, end };
};

// ============================================================================
// View Toggle Component
// ============================================================================

interface ViewToggleProps {
  value: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
  onSetDefault?: (mode: CalendarViewMode) => void;
}

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange, onSetDefault }) => {
  const [contextMenu, setContextMenu] = React.useState<{
    mode: CalendarViewMode;
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, mode: CalendarViewMode) => {
    e.preventDefault();
    setContextMenu({
      mode,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleSetDefault = () => {
    if (contextMenu && onSetDefault) {
      onSetDefault(contextMenu.mode);
      onChange(contextMenu.mode);
    }
    setContextMenu(null);
  };

  const currentDefault = localStorage.getItem('calendar-view-preference') as CalendarViewMode | null;

  return (
    <>
      <div className="flex border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
        <button
          className={`
            px-3 py-1.5 text-sm font-medium flex items-center gap-1
            ${value === 'timeline'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border'
            }
          `}
          onClick={() => onChange('timeline')}
          onContextMenu={(e) => handleContextMenu(e, 'timeline')}
          title="Timeline View (right-click to set as default)"
        >
          <ListIcon />
          <span className="hidden sm:inline">Timeline</span>
          {currentDefault === 'timeline' && (
            <span className="ml-1 text-xs opacity-75">★</span>
          )}
        </button>
        <button
          className={`
            px-3 py-1.5 text-sm font-medium flex items-center gap-1 border-l border-gray-200 dark:border-dark-border
            ${value === 'month'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border'
            }
          `}
          onClick={() => onChange('month')}
          onContextMenu={(e) => handleContextMenu(e, 'month')}
          title="Month View (right-click to set as default)"
        >
          <GridIcon />
          <span className="hidden sm:inline">Month</span>
          {currentDefault === 'month' && (
            <span className="ml-1 text-xs opacity-75">★</span>
          )}
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border py-1 min-w-[180px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
          >
            <button
              onClick={handleSetDefault}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border flex items-center gap-2"
            >
              {currentDefault === contextMenu.mode && <CheckIcon />}
              <span>Set as Default View</span>
            </button>
            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-dark-border">
              {currentDefault === contextMenu.mode
                ? 'Currently your default'
                : 'Opens this view by default'}
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  entries,
  rooms = [],
  dateRange,
  onDateRangeChange,
  viewMode: controlledViewMode,
  onViewModeChange,
  onSetDefaultView,
  onEntryClick,
  onDateClick,
  onAddBooking,
  isLoading = false,
  highlightToday = true,
  className = '',
}) => {
  // Internal view mode state (if not controlled)
  const [internalViewMode, setInternalViewMode] = useState<CalendarViewMode>('timeline');
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  // Current reference date for navigation
  const referenceDate = useMemo(() => {
    return new Date(dateRange.start.getTime() + (dateRange.end.getTime() - dateRange.start.getTime()) / 2);
  }, [dateRange]);

  // Navigate to previous period
  const handlePrevious = () => {
    const diff = dateRange.end.getTime() - dateRange.start.getTime();
    const newStart = new Date(dateRange.start.getTime() - diff);
    const newEnd = new Date(dateRange.end.getTime() - diff);
    onDateRangeChange({ start: newStart, end: newEnd });
  };

  // Navigate to next period
  const handleNext = () => {
    const diff = dateRange.end.getTime() - dateRange.start.getTime();
    const newStart = new Date(dateRange.start.getTime() + diff);
    const newEnd = new Date(dateRange.end.getTime() + diff);
    onDateRangeChange({ start: newStart, end: newEnd });
  };

  // Navigate to today
  const handleToday = () => {
    const today = new Date();
    if (viewMode === 'month') {
      onDateRangeChange(getMonthRange(today));
    } else {
      onDateRangeChange(getTimelineRange(today));
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    if (mode === 'month') {
      onDateRangeChange(getMonthRange(referenceDate));
    } else {
      onDateRangeChange(getTimelineRange(referenceDate));
    }
  };

  // Group entries by room for timeline view
  const roomsWithEntries: RoomCalendarData[] = useMemo(() => {
    if (rooms.length === 0) {
      // Group entries by room_id
      const roomMap = new Map<string, RoomCalendarData>();
      entries.forEach((entry) => {
        if (!roomMap.has(entry.room_id)) {
          roomMap.set(entry.room_id, {
            id: entry.room_id,
            name: entry.room_name,
            property_id: entry.property_id,
            property_name: entry.property_name,
            total_units: 1,
            entries: [],
          });
        }
        roomMap.get(entry.room_id)!.entries.push(entry);
      });
      return Array.from(roomMap.values());
    }

    // Merge entries into provided rooms
    return rooms.map((room) => ({
      ...room,
      entries: entries.filter((e) => e.room_id === room.id),
    }));
  }, [rooms, entries]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRightIcon />
          </Button>
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {viewMode === 'month'
              ? formatMonthYear(referenceDate)
              : formatDateRange(dateRange.start, dateRange.end)
            }
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-primary"></span>
            <span className="text-gray-600 dark:text-gray-400">Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-500"></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Checked In</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-500"></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Blocked</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : viewMode === 'timeline' ? (
        <CalendarTimeline
          rooms={roomsWithEntries}
          dateRange={dateRange}
          onEntryClick={onEntryClick}
          onDateClick={onDateClick}
          isLoading={isLoading}
          highlightToday={highlightToday}
        />
      ) : (
        <CalendarMonth
          entries={entries}
          month={referenceDate}
          onEntryClick={onEntryClick}
          onDateClick={onDateClick}
          onAddBooking={onAddBooking}
          highlightToday={highlightToday}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="font-semibold text-gray-700 dark:text-gray-300">Booking Status:</div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span>Pending Modification</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Checked In</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-500" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500 opacity-50" />
          <span>Cancelled</span>
        </div>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-2" />
        <div className="font-semibold text-gray-700 dark:text-gray-300">Payment Status:</div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Verification Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Paid</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-400" />
          <span>Partially Refunded</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Failed Checkout</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
