/**
 * BookingListPage Component
 *
 * List all bookings with search, filter, and management operations.
 * Displays bookings in a responsive list/table layout using BookingCard components.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Spinner,
  Alert,
  FilterCard,
  FilterToggleButton,
  EmptyState,
  Modal,
  Select,
  Card,
  Pagination,
  Input,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  ViewModeSelector,
} from '@/components/ui';
import { useViewMode } from '@/hooks';
import { BookingCard, BookingStatusBadge, PaymentStatusBadge } from '@/components/features';
import { bookingService, propertyService } from '@/services';
import type {
  BookingWithDetails,
  BookingStatus,
  PaymentStatus,
  BookingSource,
  BookingListParams,
} from '@/types/booking.types';
import type { PropertyWithCompany } from '@/types/property.types';
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  BOOKING_SOURCE_LABELS,
  formatBookingReference,
} from '@/types/booking.types';
import {
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineLogin,
  HiOutlineLogout,
} from 'react-icons/hi';

// ============================================================================
// Types
// ============================================================================

type SortField = 'check_in_date' | 'check_out_date' | 'created_at' | 'total_amount' | 'booking_reference';
type SortOrder = 'asc' | 'desc';

// ============================================================================
// Filter Options
// ============================================================================

const bookingStatusOptions = [
  { value: '', label: 'All statuses' },
  ...Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const paymentStatusOptions = [
  { value: '', label: 'All payment statuses' },
  ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const sourceOptions = [
  { value: '', label: 'All sources' },
  ...Object.entries(BOOKING_SOURCE_LABELS)
    .filter(([key]) => key !== 'block')
    .map(([value, label]) => ({ value, label })),
];

const sortOptions = [
  { value: 'check_in_date:asc', label: 'Check-in (Upcoming)' },
  { value: 'check_in_date:desc', label: 'Check-in (Recent)' },
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'total_amount:desc', label: 'Amount (High to Low)' },
  { value: 'total_amount:asc', label: 'Amount (Low to High)' },
  { value: 'booking_reference:asc', label: 'Reference (A-Z)' },
];

const dateRangeOptions = [
  { value: '', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'This week' },
  { value: 'next_week', label: 'Next week' },
  { value: 'this_month', label: 'This month' },
  { value: 'next_month', label: 'Next month' },
  { value: 'custom', label: 'Custom range' },
];

// ============================================================================
// Date Range Helpers
// ============================================================================

function getDateRange(preset: string): { from?: string; to?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { from: formatDate(today), to: formatDate(today) };
    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: formatDate(tomorrow), to: formatDate(tomorrow) };
    }
    case 'this_week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return { from: formatDate(startOfWeek), to: formatDate(endOfWeek) };
    }
    case 'next_week': {
      const startOfNextWeek = new Date(today);
      startOfNextWeek.setDate(today.getDate() - today.getDay() + 7);
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
      return { from: formatDate(startOfNextWeek), to: formatDate(endOfNextWeek) };
    }
    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: formatDate(startOfMonth), to: formatDate(endOfMonth) };
    }
    case 'next_month': {
      const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { from: formatDate(startOfNextMonth), to: formatDate(endOfNextMonth) };
    }
    default:
      return {};
  }
}

// ============================================================================
// Component
// ============================================================================

export const BookingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data state
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewMode('bookings-list-view', 'table');

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [propertyFilter, setPropertyFilter] = useState(searchParams.get('property_id') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('payment') || '');
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || '');
  const [dateRangePreset, setDateRangePreset] = useState(searchParams.get('date_range') || '');
  const [customDateFrom, setCustomDateFrom] = useState(searchParams.get('from') || '');
  const [customDateTo, setCustomDateTo] = useState(searchParams.get('to') || '');
  const [sortValue, setSortValue] = useState(
    searchParams.get('sort') || 'check_in_date:asc'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const limit = 20; // Items per page

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingWithDetails | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Parse sort value
  const [sortField, sortOrder] = sortValue.split(':') as [SortField, SortOrder];

  // Filter toggle state
  const [showFilters, setShowFilters] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (propertyFilter) count++;
    if (statusFilter) count++;
    if (paymentFilter) count++;
    if (sourceFilter) count++;
    if (dateRangePreset) count++;
    return count;
  }, [searchQuery, propertyFilter, statusFilter, paymentFilter, sourceFilter, dateRangePreset]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      let checkInFrom: string | undefined;
      let checkInTo: string | undefined;

      if (dateRangePreset === 'custom') {
        checkInFrom = customDateFrom || undefined;
        checkInTo = customDateTo || undefined;
      } else if (dateRangePreset) {
        const range = getDateRange(dateRangePreset);
        checkInFrom = range.from;
        checkInTo = range.to;
      }

      // Build filter params
      const params: BookingListParams = {
        search: searchQuery || undefined,
        property_id: propertyFilter || undefined,
        booking_status: (statusFilter as BookingStatus) || undefined,
        payment_status: (paymentFilter as PaymentStatus) || undefined,
        source: (sourceFilter as BookingSource) || undefined,
        check_in_from: checkInFrom,
        check_in_to: checkInTo,
        sortBy: sortField,
        sortOrder: sortOrder,
        page,
        limit,
      };

      // Fetch bookings and properties
      const [bookingsRes, propertiesRes] = await Promise.all([
        bookingService.listBookings(params),
        propertyService.getMyProperties({ is_active: true }),
      ]);

      setBookings(bookingsRes.bookings);
      setTotalBookings(bookingsRes.total);
      setTotalPages(bookingsRes.totalPages);
      setProperties(propertiesRes.properties);
    } catch (err) {
      setError('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, propertyFilter, statusFilter, paymentFilter, sourceFilter, dateRangePreset, customDateFrom, customDateTo, sortField, sortOrder, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (propertyFilter) params.set('property_id', propertyFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (paymentFilter) params.set('payment', paymentFilter);
    if (sourceFilter) params.set('source', sourceFilter);
    if (dateRangePreset) params.set('date_range', dateRangePreset);
    if (customDateFrom) params.set('from', customDateFrom);
    if (customDateTo) params.set('to', customDateTo);
    if (sortValue !== 'check_in_date:asc') params.set('sort', sortValue);
    if (page > 1) params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [searchQuery, propertyFilter, statusFilter, paymentFilter, sourceFilter, dateRangePreset, customDateFrom, customDateTo, sortValue, page, setSearchParams]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleBookingClick = (booking: BookingWithDetails) => {
    navigate(`/bookings/${booking.id}`);
  };

  const handleViewBooking = (booking: BookingWithDetails) => {
    navigate(`/bookings/${booking.id}`);
  };

  const handleEditBooking = (booking: BookingWithDetails) => {
    navigate(`/bookings/${booking.id}?edit=true`);
  };

  const handleCancelClick = (booking: BookingWithDetails) => {
    setBookingToCancel(booking);
    setCancelModalOpen(true);
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel || !cancelReason.trim()) return;

    try {
      setIsCancelling(true);
      await bookingService.cancelBooking(bookingToCancel.id, {
        reason: cancelReason,
        notify_guest: true,
      });
      setCancelModalOpen(false);
      setBookingToCancel(null);
      setCancelReason('');
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel booking';
      setError(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCheckIn = async (booking: BookingWithDetails) => {
    try {
      await bookingService.checkIn(booking.id);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
      setError(errorMessage);
    }
  };

  const handleCheckOut = async (booking: BookingWithDetails) => {
    try {
      await bookingService.checkOut(booking.id);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check out';
      setError(errorMessage);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    fetchData();
  };

  // ============================================================================
  // Build Options
  // ============================================================================

  const propertyOptions = [
    { value: '', label: 'All properties' },
    ...properties.map((p) => ({ value: p.id, label: p.name })),
  ];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthenticatedLayout title="Bookings" subtitle="Manage all your bookings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {totalBookings} booking{totalBookings !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <FilterToggleButton
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
              activeFilterCount={activeFilterCount}
            />
            {/* Refresh Button */}
            <Button variant="outline" onClick={handleRefresh} className="hidden sm:flex">
              <HiOutlineRefresh className="w-5 h-5" />
            </Button>

            {/* View Mode Selector */}
            <ViewModeSelector
              value={viewMode}
              onChange={setViewMode}
              storageKey="bookings-list-view"
            />
            <Button onClick={() => navigate('/bookings/new')}>
              <HiOutlinePlus className="w-5 h-5" />
              <span className="ml-2">New Booking</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        {showFilters && (
          <FilterCard>
            <FilterCard.Search
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by reference, guest name, or email..."
              debounceMs={300}
            />
            <FilterCard.Field>
              <Select
                value={propertyFilter}
                onChange={(e) => {
                  setPropertyFilter(e.target.value);
                  setPage(1);
                }}
                options={propertyOptions}
              />
            </FilterCard.Field>
            <FilterCard.Field>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={bookingStatusOptions}
              />
            </FilterCard.Field>
            <FilterCard.Field>
              <Select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                options={paymentStatusOptions}
              />
            </FilterCard.Field>
            <FilterCard.Field>
              <Select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                options={sourceOptions}
              />
            </FilterCard.Field>
            <FilterCard.Field>
              <Select
                value={dateRangePreset}
                onChange={(e) => {
                  setDateRangePreset(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomDateFrom('');
                    setCustomDateTo('');
                  }
                  setPage(1);
                }}
                options={dateRangeOptions}
              />
            </FilterCard.Field>
            {dateRangePreset === 'custom' && (
              <>
                <FilterCard.Field>
                  <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => {
                      setCustomDateFrom(e.target.value);
                      setPage(1);
                    }}
                    placeholder="From"
                  />
                </FilterCard.Field>
                <FilterCard.Field>
                  <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => {
                      setCustomDateTo(e.target.value);
                      setPage(1);
                    }}
                    placeholder="To"
                  />
                </FilterCard.Field>
              </>
            )}
            <FilterCard.Field>
              <Select
                value={sortValue}
                onChange={(e) => {
                  setSortValue(e.target.value);
                  setPage(1);
                }}
                options={sortOptions}
              />
            </FilterCard.Field>
          </FilterCard>
        )}

        {/* Quick Stats */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {bookings.filter(b => b.booking_status === 'pending').length}
              </p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed</p>
              <p className="text-2xl font-bold text-emerald-600">
                {bookings.filter(b => b.booking_status === 'confirmed').length}
              </p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <p className="text-sm text-gray-500 dark:text-gray-400">Checked In</p>
              <p className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.booking_status === 'checked_in').length}
              </p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <p className="text-sm text-gray-500 dark:text-gray-400">Payment Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {bookings.filter(b => b.payment_status === 'pending').length}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <EmptyState
              icon={<HiOutlineCalendar className="w-12 h-12" />}
              title="No bookings yet"
              description={
                searchQuery || propertyFilter || statusFilter || paymentFilter || sourceFilter || dateRangePreset
                  ? 'No bookings match your current filters.'
                  : 'When guests book accommodations, they will appear here.'
              }
              action={
                <Button onClick={() => navigate('/bookings/new')}>
                  <HiOutlinePlus className="w-5 h-5" />
                  <span className="ml-2">Create Booking</span>
                </Button>
              }
            />
          </Card>
        ) : viewMode === 'table' ? (
          // Table View
          <Card variant="bordered" padding="none">
            <Table size="sm" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableHeader>Reference</TableHeader>
                  <TableHeader>Guest</TableHeader>
                  <TableHeader>Property / Room</TableHeader>
                  <TableHeader>Check-in</TableHeader>
                  <TableHeader>Check-out</TableHeader>
                  <TableHeader align="center">Nights</TableHeader>
                  <TableHeader align="right">Amount</TableHeader>
                  <TableHeader align="center">Status</TableHeader>
                  <TableHeader align="center">Payment</TableHeader>
                  <TableHeader align="right">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => {
                  const checkIn = new Date(booking.check_in_date);
                  const checkOut = new Date(booking.check_out_date);
                  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                  const canCheckIn = booking.booking_status === 'confirmed';
                  const canCheckOut = booking.booking_status === 'checked_in';
                  const canCancel = ['pending', 'confirmed'].includes(booking.booking_status);

                  return (
                    <TableRow
                      key={booking.id}
                      onClick={() => handleBookingClick(booking)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <span className="font-mono text-sm font-medium text-primary">
                          {formatBookingReference(booking.booking_reference)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{booking.guest_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{booking.guest_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                            {booking.property_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {booking.rooms?.[0]?.room_name || 'Unknown room'}
                            {booking.rooms?.length > 1 && ` +${booking.rooms.length - 1} more`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {checkIn.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {checkOut.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        <span className="text-sm">{nights}</span>
                      </TableCell>
                      <TableCell align="right">
                        <span className="font-medium">
                          {booking.currency} {booking.total_amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        <BookingStatusBadge status={booking.booking_status} size="sm" />
                      </TableCell>
                      <TableCell align="center">
                        <PaymentStatusBadge status={booking.payment_status} size="sm" />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleViewBooking(booking)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-card"
                            title="View"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-card"
                            title="Edit"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          {canCheckIn && (
                            <button
                              onClick={() => handleCheckIn(booking)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Check In"
                            >
                              <HiOutlineLogin className="w-4 h-4" />
                            </button>
                          )}
                          {canCheckOut && (
                            <button
                              onClick={() => handleCheckOut(booking)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Check Out"
                            >
                              <HiOutlineLogout className="w-4 h-4" />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => handleCancelClick(booking)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Cancel"
                            >
                              <HiOutlineX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : viewMode === 'list' ? (
          // List View (compact cards)
          <div className="space-y-2">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                compact
                onClick={() => handleBookingClick(booking)}
                onView={() => handleViewBooking(booking)}
                onEdit={() => handleEditBooking(booking)}
                onCancel={() => handleCancelClick(booking)}
                onCheckIn={() => handleCheckIn(booking)}
                onCheckOut={() => handleCheckOut(booking)}
                showActions
              />
            ))}
          </div>
        ) : (
          // Grid View (full cards)
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => handleBookingClick(booking)}
                onView={() => handleViewBooking(booking)}
                onEdit={() => handleEditBooking(booking)}
                onCancel={() => handleCancelClick(booking)}
                onCheckIn={() => handleCheckIn(booking)}
                onCheckOut={() => handleCheckOut(booking)}
                showActions
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setBookingToCancel(null);
            setCancelReason('');
          }}
          title="Cancel Booking"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to cancel booking{' '}
              <strong>{bookingToCancel && formatBookingReference(bookingToCancel.booking_reference)}</strong>
              {' '}for <strong>{bookingToCancel?.guest_name}</strong>?
            </p>

            {bookingToCancel && (
              <div className="flex items-center gap-2">
                <BookingStatusBadge status={bookingToCancel.booking_status} size="sm" />
                <PaymentStatusBadge status={bookingToCancel.payment_status} size="sm" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-dark-card dark:text-white"
                rows={3}
                placeholder="Please provide a reason for the cancellation..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModalOpen(false);
                  setBookingToCancel(null);
                  setCancelReason('');
                }}
              >
                Keep Booking
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
                disabled={!cancelReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
};
