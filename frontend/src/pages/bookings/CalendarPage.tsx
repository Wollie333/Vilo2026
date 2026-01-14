/**
 * CalendarPage
 *
 * Calendar view for managing room availability and bookings.
 * Provides timeline and month views with filtering options.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Button,
  Select,
  Alert,
  Modal,
  Textarea,
  DateRangePicker,
  Checkbox,
} from '@/components/ui';
import { AuthenticatedLayout } from '@/components/layout';
import { BookingCalendar, BookingQuickViewModal } from '@/components/features/Calendar';
import type {
  CalendarEntry,
  CalendarDateRange,
  CalendarViewMode,
} from '@/components/features/Calendar';
import { bookingService } from '@/services/booking.service';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';
import type { RoomWithDetails } from '@/types/room.types';

// ============================================================================
// Icons
// ============================================================================

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

interface Property {
  id: string;
  name: string;
}

interface BlockModalData {
  roomId: string;
  roomName: string;
  startDate: Date;
  endDate?: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getDefaultDateRange = (): CalendarDateRange => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 7);
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  return { start, end };
};

// ============================================================================
// Main Component
// ============================================================================

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [propertyId, setPropertyId] = useState<string>(searchParams.get('property') || '');
  const [dateRange, setDateRange] = useState<CalendarDateRange>(getDefaultDateRange);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    // Load saved preference from localStorage
    const savedView = localStorage.getItem('calendar-view-preference');
    return (savedView === 'month' || savedView === 'timeline') ? savedView : 'timeline';
  });

  // Calendar-specific filters
  const [showCancelled, setShowCancelled] = useState(false);
  const [showBlocks, setShowBlocks] = useState(true);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Block modal
  const [blockModal, setBlockModal] = useState<BlockModalData | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);

  // Quick view modal state
  const [quickViewModal, setQuickViewModal] = useState<{
    entries: CalendarEntry[];
    currentIndex: number;
  } | null>(null);

  // Filter toggle state
  const [showFilters, setShowFilters] = useState(false);

  // View mode change confirmation
  const [savedViewMessage, setSavedViewMessage] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    // Show Cancelled toggle (when enabled)
    if (showCancelled) count++;
    // Show Blocks toggle (when disabled)
    if (!showBlocks) count++;
    // Booking status filter (when not "all")
    if (bookingStatusFilter !== 'all') count++;
    // Payment status filter (when not "all")
    if (paymentStatusFilter !== 'all') count++;
    // Source filter (when not "all")
    if (sourceFilter !== 'all') count++;
    return count;
  }, [showCancelled, showBlocks, bookingStatusFilter, paymentStatusFilter, sourceFilter]);

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await propertyService.getMyProperties({ limit: 100 });
        setProperties(response.properties.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        // Auto-select first property if none selected
        if (!propertyId && response.properties.length > 0) {
          setPropertyId(response.properties[0].id);
        }
      } catch (err) {
        console.error('Failed to load properties:', err);
      }
    };
    loadProperties();
  }, []);

  // Load rooms and bookings
  useEffect(() => {
    const loadData = async () => {
      if (!propertyId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load rooms
        const roomsResponse = await roomService.listPropertyRooms(propertyId, {
          is_active: true,
          limit: 100,
        });
        setRooms(roomsResponse.rooms);

        // Load calendar entries (bookings + blocks)
        const entriesResponse = await bookingService.getCalendarEntries(
          propertyId,
          dateRange.start.toISOString().split('T')[0],
          dateRange.end.toISOString().split('T')[0]
        );

        // Map to CalendarEntry format
        setEntries(entriesResponse.map((entry) => {
          // Detect if this is a block (backend returns blocks with special format)
          const isBlock = entry.booking_reference?.startsWith('BLOCK-') ||
                          ['Maintenance', 'Owner Blocked', 'Renovation', 'Blocked'].includes(entry.guest_name);

          return {
            id: entry.booking_id,
            booking_id: entry.booking_id,
            property_id: propertyId,
            room_id: entry.room_id,
            room_name: entry.room_name,
            room_thumbnail: entry.room_thumbnail || undefined,
            property_name: '',
            start_date: entry.check_in,
            end_date: entry.check_out,
            type: isBlock ? ('block' as const) : ('booking' as const),
            // Booking details
            booking_reference: entry.booking_reference,
            booking_status: entry.booking_status,
            payment_status: entry.payment_status,
            guest_name: entry.guest_name,
            guest_email: entry.guest_email || undefined,
            guest_phone: entry.guest_phone || undefined,
            total_amount: entry.total_amount,
            currency: entry.currency,
            adults: entry.adults,
            children: entry.children,
            source: entry.source,
            // Payment proof metadata (new fields)
            payment_proof_url: entry.payment_proof_url || undefined,
            payment_proof_uploaded_at: entry.payment_proof_uploaded_at || undefined,
            payment_verified_at: entry.payment_verified_at || undefined,
            payment_verified_by: entry.payment_verified_by || undefined,
            payment_rejection_reason: entry.payment_rejection_reason || undefined,
            // Refund information (new fields)
            refund_status: entry.refund_status || 'none',
            total_refunded: entry.total_refunded || 0,
            // Modification tracking (new field)
            has_pending_modification: entry.has_pending_modification || false,
            // Block details
            block_reason: isBlock ? entry.guest_name : undefined,
          };
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [propertyId, dateRange]);

  // Update URL params when property changes
  useEffect(() => {
    if (propertyId) {
      setSearchParams({ property: propertyId });
    }
  }, [propertyId, setSearchParams]);

  // Save view preference when it changes
  const handleViewModeChange = useCallback((newMode: CalendarViewMode) => {
    setViewMode(newMode);
    localStorage.setItem('calendar-view-preference', newMode);
    // Show saved message briefly
    setSavedViewMessage(true);
    setTimeout(() => setSavedViewMessage(false), 2000);
  }, []);

  // Set default view from right-click menu
  const handleSetDefaultView = useCallback((newMode: CalendarViewMode) => {
    setViewMode(newMode);
    localStorage.setItem('calendar-view-preference', newMode);
    setSavedViewMessage(true);
    setTimeout(() => setSavedViewMessage(false), 2000);
  }, []);

  // Handle entry click
  const handleEntryClick = useCallback((entry: CalendarEntry, dayEntries?: CalendarEntry[]) => {
    if (dayEntries && dayEntries.length > 0) {
      // Sort by check-in date (earliest first)
      const sorted = [...dayEntries].sort((a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      const index = sorted.findIndex(e => e.id === entry.id);

      setQuickViewModal({
        entries: sorted,
        currentIndex: index >= 0 ? index : 0,
      });
    } else {
      // Fallback: navigate directly
      if (entry.type === 'booking' && entry.booking_id) {
        navigate(`/bookings/${entry.booking_id}`);
      }
    }
  }, [navigate]);

  // Handle date click (create block)
  const handleDateClick = useCallback((date: Date, roomId?: string) => {
    if (!roomId) return;

    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    setBlockModal({
      roomId,
      roomName: room.name,
      startDate: date,
    });
    setBlockReason('');
  }, [rooms]);

  // Handle add booking (from plus icon)
  const handleAddBooking = useCallback((date: Date) => {
    const checkInDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    navigate(`/bookings/new?checkIn=${checkInDate}`);
  }, [navigate]);

  // Handle quick view navigation
  const handleQuickViewNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!quickViewModal) return;

    const newIndex = direction === 'prev'
      ? Math.max(0, quickViewModal.currentIndex - 1)
      : Math.min(quickViewModal.entries.length - 1, quickViewModal.currentIndex + 1);

    setQuickViewModal({
      ...quickViewModal,
      currentIndex: newIndex,
    });
  }, [quickViewModal]);

  // Handle view full booking
  const handleViewFullBooking = useCallback((entry: CalendarEntry) => {
    if (entry.type === 'booking' && entry.booking_id) {
      navigate(`/bookings/${entry.booking_id}`);
    }
  }, [navigate]);

  // Create block
  const handleCreateBlock = async () => {
    if (!blockModal) return;

    setIsCreatingBlock(true);
    try {
      await roomService.createAvailabilityBlock(blockModal.roomId, {
        start_date: blockModal.startDate.toISOString().split('T')[0],
        end_date: (blockModal.endDate || blockModal.startDate).toISOString().split('T')[0],
        reason: blockReason || undefined,
      });

      // Refresh data
      const entriesResponse = await bookingService.getCalendarEntries(
        propertyId,
        dateRange.start.toISOString().split('T')[0],
        dateRange.end.toISOString().split('T')[0]
      );
      // Map to CalendarEntry format
      setEntries(entriesResponse.map((entry) => ({
        id: entry.booking_id,
        booking_id: entry.booking_id,
        property_id: propertyId,
        room_id: entry.room_id,
        room_name: entry.room_name,
        room_thumbnail: entry.room_thumbnail || undefined,
        property_name: '',
        start_date: entry.check_in,
        end_date: entry.check_out,
        type: 'booking' as const,
        booking_reference: entry.booking_reference,
        booking_status: entry.booking_status,
        payment_status: entry.payment_status,
        guest_name: entry.guest_name,
        guest_email: entry.guest_email || undefined,
        guest_phone: entry.guest_phone || undefined,
        total_amount: entry.total_amount,
        currency: entry.currency,
        adults: entry.adults,
        children: entry.children,
        source: entry.source,
      })));

      setBlockModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create block');
    } finally {
      setIsCreatingBlock(false);
    }
  };

  // Property options for select
  const propertyOptions = useMemo(() => [
    { value: '', label: 'Select property...' },
    ...properties.map((p) => ({ value: p.id, label: p.name })),
  ], [properties]);

  // Apply filters to entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filter cancelled bookings
      if (!showCancelled && entry.booking_status === 'cancelled') {
        return false;
      }

      // Filter blocks
      if (!showBlocks && entry.type === 'block') {
        return false;
      }

      // Filter by booking status
      if (bookingStatusFilter !== 'all' && entry.type === 'booking' && entry.booking_status) {
        if (entry.booking_status !== bookingStatusFilter) {
          return false;
        }
      }

      // Filter by payment status
      if (paymentStatusFilter !== 'all' && entry.type === 'booking' && entry.payment_status) {
        if (entry.payment_status !== paymentStatusFilter) {
          return false;
        }
      }

      // Filter by source
      if (sourceFilter !== 'all' && entry.type === 'booking' && entry.source) {
        if (entry.source !== sourceFilter) {
          return false;
        }
      }

      return true;
    });
  }, [entries, showCancelled, showBlocks, bookingStatusFilter, paymentStatusFilter, sourceFilter]);

  // Room calendar data
  const roomCalendarData = useMemo(() => {
    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      property_id: room.property_id,
      property_name: room.property_name,
      total_units: room.total_units,
      entries: filteredEntries.filter((e) => e.room_id === room.id),
    }));
  }, [rooms, filteredEntries]);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CalendarIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Availability Calendar
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View and manage room availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Saved message */}
            {savedViewMessage && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium animate-fade-in">
                <CheckIcon />
                <span>Default view saved</span>
              </div>
            )}

            {/* Filter Icon Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                p-2 rounded-lg transition-colors relative
                ${showFilters
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border border border-gray-200 dark:border-dark-border'
                }
              `}
              title="Toggle Filters"
            >
              <FilterIcon />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Toggle Icon Buttons */}
            <div className="flex border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
              <button
                className={`
                  p-2 flex items-center justify-center transition-colors
                  ${viewMode === 'timeline'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border'
                  }
                `}
                onClick={() => handleViewModeChange('timeline')}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleSetDefaultView('timeline');
                }}
                title="Timeline View (right-click to set as default)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                className={`
                  p-2 flex items-center justify-center border-l border-gray-200 dark:border-dark-border transition-colors
                  ${viewMode === 'month'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border'
                  }
                `}
                onClick={() => handleViewModeChange('month')}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleSetDefaultView('month');
                }}
                title="Month View (right-click to set as default)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
            </div>

            <Button
              variant="primary"
              onClick={() => navigate('/bookings/new')}
              leftIcon={<PlusIcon />}
            >
              New Reservation
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <Card.Body className="py-4">
              <div className="space-y-4">
                {/* Filter Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    <FilterIcon />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Calendar Filters
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCancelled(false);
                      setShowBlocks(true);
                      setBookingStatusFilter('all');
                      setPaymentStatusFilter('all');
                      setSourceFilter('all');
                    }}
                  >
                    Reset
                  </Button>
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Display Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Display Options
                    </label>
                    <div className="space-y-2">
                      <Checkbox
                        label="Show Cancelled"
                        checked={showCancelled}
                        onCheckedChange={setShowCancelled}
                      />
                      <Checkbox
                        label="Show Blocks"
                        checked={showBlocks}
                        onCheckedChange={setShowBlocks}
                      />
                    </div>
                  </div>

                  {/* Booking Status */}
                  <Select
                    label="Booking Status"
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'confirmed', label: 'Confirmed' },
                      { value: 'pending_modification', label: 'Pending Modification' },
                      { value: 'checked_in', label: 'Checked In' },
                      { value: 'checked_out', label: 'Checked Out' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                      { value: 'no_show', label: 'No Show' },
                    ]}
                  />

                  {/* Payment Status */}
                  <Select
                    label="Payment Status"
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Payments' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'failed_checkout', label: 'Failed Checkout' },
                      { value: 'verification_pending', label: 'Verification Pending' },
                      { value: 'partial', label: 'Partial' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'refunded', label: 'Refunded' },
                      { value: 'partially_refunded', label: 'Partially Refunded' },
                      { value: 'failed', label: 'Failed' },
                    ]}
                  />

                  {/* Booking Source */}
                  <Select
                    label="Booking Source"
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Sources' },
                      { value: 'vilo', label: 'Vilo' },
                      { value: 'website', label: 'Website' },
                      { value: 'manual', label: 'Manual' },
                      { value: 'airbnb', label: 'Airbnb' },
                      { value: 'booking_com', label: 'Booking.com' },
                      { value: 'lekkerslaap', label: 'Lekkerslaap' },
                      { value: 'expedia', label: 'Expedia' },
                      { value: 'tripadvisor', label: 'TripAdvisor' },
                      { value: 'vrbo', label: 'VRBO' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Quick stats */}
        {!isLoading && propertyId && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <Card.Body className="py-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rooms.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rooms</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="py-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {filteredEntries.filter((e) => e.type === 'booking' && e.booking_status === 'confirmed').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Confirmed</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="py-3 text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {filteredEntries.filter((e) => e.type === 'booking' && e.booking_status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body className="py-3 text-center">
                <div className="text-2xl font-bold text-gray-500">
                  {filteredEntries.filter((e) => e.type === 'block').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Blocked</div>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Calendar */}
        {!propertyId ? (
          <Card>
            <Card.Body className="py-12 text-center text-gray-500 dark:text-gray-400">
              <CalendarIcon />
              <p className="mt-2">Select a property to view the calendar</p>
            </Card.Body>
          </Card>
        ) : (
          <BookingCalendar
            entries={filteredEntries}
            rooms={roomCalendarData}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onSetDefaultView={handleSetDefaultView}
            onEntryClick={handleEntryClick}
            onDateClick={handleDateClick}
            onAddBooking={handleAddBooking}
            isLoading={isLoading}
            highlightToday
          />
        )}
      </div>

      {/* Block Modal */}
      <Modal
        isOpen={!!blockModal}
        onClose={() => setBlockModal(null)}
        size="md"
      >
        <Modal.Header>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Block Dates
          </h3>
        </Modal.Header>
        <Modal.Body className="space-y-4">
          {blockModal && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room
                </label>
                <div className="text-gray-900 dark:text-white">{blockModal.roomName}</div>
              </div>

              <DateRangePicker
                label="Block Period"
                value={{
                  startDate: blockModal.startDate.toISOString().split('T')[0],
                  endDate: blockModal.endDate?.toISOString().split('T')[0] || blockModal.startDate.toISOString().split('T')[0],
                }}
                onChange={(range) => {
                  setBlockModal({
                    ...blockModal,
                    startDate: range.startDate ? new Date(range.startDate) : blockModal.startDate,
                    endDate: range.endDate ? new Date(range.endDate) : undefined,
                  });
                }}
              />

              <Textarea
                label="Reason (optional)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Maintenance, Owner stay, etc."
                rows={2}
              />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setBlockModal(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateBlock}
            isLoading={isCreatingBlock}
          >
            Block Dates
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Quick View Modal */}
      {quickViewModal && quickViewModal.entries.length > 0 && (
        <BookingQuickViewModal
          isOpen={true}
          onClose={() => setQuickViewModal(null)}
          entries={quickViewModal.entries}
          currentIndex={quickViewModal.currentIndex}
          onNavigate={handleQuickViewNavigate}
          onViewFullBooking={handleViewFullBooking}
        />
      )}
    </AuthenticatedLayout>
  );
};

export default CalendarPage;
