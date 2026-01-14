/**
 * Calendar Types
 *
 * Type definitions for booking calendar components.
 */

import type { BookingStatus, PaymentStatus, BookingSource } from '@/types/booking.types';

// ============================================================================
// Calendar Entry
// ============================================================================

export interface CalendarEntry {
  id: string;
  booking_id?: string;
  room_id: string;
  room_name: string;
  room_thumbnail?: string;
  property_id: string;
  property_name?: string;
  start_date: string;
  end_date: string;
  type: 'booking' | 'block' | 'maintenance';

  // Booking details (when type === 'booking')
  booking_reference?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  booking_status?: BookingStatus;
  payment_status?: PaymentStatus;
  source?: BookingSource;
  total_amount?: number;
  currency?: string;
  adults?: number;
  children?: number;

  // Payment proof metadata (EFT verification)
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_verified_at?: string | null;
  payment_verified_by?: string | null;
  payment_rejection_reason?: string | null;

  // Refund information
  refund_status?: 'none' | 'partial' | 'full';
  total_refunded?: number;

  // Modification tracking
  has_pending_modification?: boolean;

  // Block details (when type === 'block' or 'maintenance')
  block_reason?: string;

  // Visual
  color?: string;
}

// ============================================================================
// Calendar View Types
// ============================================================================

export type CalendarViewMode = 'month' | 'week' | 'timeline';

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// Room with Calendar Data
// ============================================================================

export interface RoomCalendarData {
  id: string;
  name: string;
  property_id: string;
  property_name?: string;
  total_units: number;
  entries: CalendarEntry[];
}

// ============================================================================
// Calendar Props
// ============================================================================

export interface BookingCalendarProps {
  /** Entries to display on the calendar */
  entries: CalendarEntry[];
  /** Rooms to show in timeline view */
  rooms?: RoomCalendarData[];
  /** Currently selected date range */
  dateRange: CalendarDateRange;
  /** Callback when date range changes */
  onDateRangeChange: (range: CalendarDateRange) => void;
  /** Current view mode */
  viewMode?: CalendarViewMode;
  /** Callback when view mode changes */
  onViewModeChange?: (mode: CalendarViewMode) => void;
  /** Callback when default view is set via context menu */
  onSetDefaultView?: (mode: CalendarViewMode) => void;
  /** Callback when an entry is clicked */
  onEntryClick?: (entry: CalendarEntry) => void;
  /** Callback when a date cell is clicked */
  onDateClick?: (date: Date, roomId?: string) => void;
  /** Callback when plus icon is clicked to add booking */
  onAddBooking?: (date: Date) => void;
  /** Whether the calendar is loading */
  isLoading?: boolean;
  /** Property filter */
  propertyId?: string;
  /** Room filter */
  roomId?: string;
  /** Show room rows in timeline */
  showRoomRows?: boolean;
  /** Highlight today */
  highlightToday?: boolean;
  /** Allow creating blocks by clicking */
  allowCreateBlock?: boolean;
  /** Custom class name */
  className?: string;
}

export interface CalendarTimelineProps {
  rooms: RoomCalendarData[];
  dateRange: CalendarDateRange;
  onEntryClick?: (entry: CalendarEntry) => void;
  onDateClick?: (date: Date, roomId: string) => void;
  isLoading?: boolean;
  highlightToday?: boolean;
}

export interface CalendarMonthProps {
  entries: CalendarEntry[];
  month: Date;
  onEntryClick?: (entry: CalendarEntry, allDayEntries?: CalendarEntry[]) => void;
  onDateClick?: (date: Date) => void;
  onAddBooking?: (date: Date) => void;
  highlightToday?: boolean;
}

export interface CalendarDayCellProps {
  date: Date;
  entries: CalendarEntry[];
  isToday?: boolean;
  isCurrentMonth?: boolean;
  onClick?: () => void;
  onEntryClick?: (entry: CalendarEntry) => void;
}

export interface CalendarEntryBarProps {
  entry: CalendarEntry;
  onClick?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

// ============================================================================
// Filter Options
// ============================================================================

export interface CalendarFilterOptions {
  /** Show cancelled bookings (default: false) */
  showCancelled: boolean;
  /** Show availability blocks (default: true) */
  showBlocks: boolean;
  /** Show maintenance periods (default: true) */
  showMaintenance: boolean;
  /** Highlight entries with payment issues (default: true) */
  highlightPaymentIssues: boolean;
  /** Filter by payment status */
  paymentStatusFilter: 'all' | 'verified' | 'pending' | 'failed';
}

// ============================================================================
// Helper Types
// ============================================================================

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  entries: CalendarEntry[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

// ============================================================================
// Color Mappings
// ============================================================================

export const ENTRY_TYPE_COLORS: Record<CalendarEntry['type'], string> = {
  booking: 'bg-primary',
  block: 'bg-gray-500',
  maintenance: 'bg-yellow-500',
};

export const BOOKING_STATUS_CALENDAR_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-primary',
  pending_modification: 'bg-purple-500', // Booking modified, awaiting guest approval
  checked_in: 'bg-blue-500',
  checked_out: 'bg-gray-400',
  completed: 'bg-green-600',
  cancelled: 'bg-red-500',
  no_show: 'bg-red-400',
};

// Payment status colors for calendar display
export const PAYMENT_STATUS_CALENDAR_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  verification_pending: 'bg-orange-500', // EFT payment proof uploaded, awaiting verification
  failed_checkout: 'bg-gray-400', // Checkout abandoned/failed
  partial: 'bg-orange-400',
  paid: 'bg-green-500',
  refunded: 'bg-purple-500',
  partially_refunded: 'bg-purple-400', // Partial refund issued
  failed: 'bg-red-500',
};

export const SOURCE_CALENDAR_COLORS: Record<BookingSource, string> = {
  vilo: 'bg-primary',
  website: 'bg-emerald-500',
  manual: 'bg-blue-500',
  airbnb: 'bg-[#FF5A5F]',
  booking_com: 'bg-[#003580]',
  lekkerslaap: 'bg-orange-500',
  expedia: 'bg-[#FFCC00]',
  tripadvisor: 'bg-[#00AF87]',
  vrbo: 'bg-[#3B5998]',
  other: 'bg-gray-500',
  block: 'bg-gray-600',
};
