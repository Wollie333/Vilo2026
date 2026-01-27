/**
 * BookingManagementPage Component
 *
 * Central hub for managing bookings across all properties.
 * Provides comprehensive booking overview, filtering, and quick actions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Spinner,
  Pagination,
  // Icons
  CalendarIcon,
  CheckInIcon,
  CheckOutIcon,
  AlertIcon,
  SearchIcon,
  FilterIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  AnalyticsIcon,
  DollarIcon,
  PlusIcon,
} from '@/components/ui';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/features/Booking/BookingCard';
import { bookingService, propertyService } from '@/services';
import { formatCurrency } from '@/utils/currency';
import type { BookingWithDetails, BookingListParams, BookingStats } from '@/types/booking.types';
import type { Property } from '@/types/property.types';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, variant = 'default', subtitle }) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    primary: 'bg-primary/10 text-primary dark:bg-primary/20',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${variantStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export const BookingManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [properties, setProperties] = useState<Property[]>([]); // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<BookingListParams>({
    page: 1,
    limit: 20,
    sortBy: 'created_at', // Sort by booking creation date (when booking was made)
    sortOrder: 'desc', // Newest bookings first
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch properties for filter dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyService.getMyProperties({ page: 1, limit: 100 });
        setProperties(response.properties || []); // Ensure it's always an array
      } catch (err) {
        console.error('Failed to fetch properties:', err);
        setProperties([]); // Set empty array on error
      }
    };
    fetchProperties();
  }, []);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        console.log('=== [BOOKING_MANAGEMENT_PAGE] Fetching bookings ===');
        setLoading(true);
        setError(null);

        const params: BookingListParams = {
          ...filters,
          bookingType: 'received', // Only show bookings received at user's properties
          search: searchTerm || undefined,
        };

        console.log('[BOOKING_MANAGEMENT_PAGE] Calling service with params:', params);
        const response = await bookingService.listBookings(params);
        console.log('[BOOKING_MANAGEMENT_PAGE] Service returned:', response);
        console.log('[BOOKING_MANAGEMENT_PAGE] response.bookings:', response.bookings);
        console.log('[BOOKING_MANAGEMENT_PAGE] response.bookings length:', response.bookings?.length || 0);

        setBookings(response.bookings || []);
        console.log('[BOOKING_MANAGEMENT_PAGE] State updated with bookings');

        // Response structure: { bookings, total, page, limit, totalPages }
        setCurrentPage(response.page || 1);
        setTotalPages(response.totalPages || 1);
        setTotalCount(response.total || 0);

        console.log('[BOOKING_MANAGEMENT_PAGE] Pagination:', {
          currentPage: response.page || 1,
          totalPages: response.totalPages || 1,
          totalCount: response.total || 0
        });
      } catch (err) {
        console.error('[BOOKING_MANAGEMENT_PAGE] Failed to fetch bookings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
        setBookings([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
        console.log('[BOOKING_MANAGEMENT_PAGE] Loading complete');
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchBookings();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [filters, searchTerm]);

  // Calculate stats from bookings
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return {
      total: totalCount,
      pending_verification: bookings.filter(b => b.payment_status === 'verification_pending').length,
      today_checkins: bookings.filter(b => b.check_in_date.startsWith(today) && b.booking_status === 'confirmed').length,
      today_checkouts: bookings.filter(b => b.check_out_date.startsWith(today) && b.booking_status === 'checked_in').length,
      pending_payments: bookings.filter(b => b.payment_status === 'pending' && b.booking_status !== 'cancelled').length,
      total_revenue: bookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + b.amount_paid, 0),
    };
  }, [bookings, totalCount]);

  // Handle filter changes
  const handleFilterChange = (key: keyof BookingListParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    setSearchTerm('');
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Loading state
  if (loading && bookings.length === 0) {
    return (
      <AuthenticatedLayout
        title="Booking Management"
        subtitle="Manage all your property bookings"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading bookings...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Debug log for render
  console.log('[BOOKING_MANAGEMENT_PAGE] Rendering with state:', {
    bookingsCount: bookings.length,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages
  });
  console.log('[BOOKING_MANAGEMENT_PAGE] Bookings in state:', bookings);

  if (bookings.length > 0) {
    console.log('[BOOKING_MANAGEMENT_PAGE] First booking structure:', bookings[0]);
    console.log('[BOOKING_MANAGEMENT_PAGE] First booking has property?', !!bookings[0].property);
    console.log('[BOOKING_MANAGEMENT_PAGE] First booking has properties?', !!(bookings[0] as any).properties);
    console.log('[BOOKING_MANAGEMENT_PAGE] Property field:', bookings[0].property);
    console.log('[BOOKING_MANAGEMENT_PAGE] Properties field:', (bookings[0] as any).properties);
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header Actions Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booking Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all your property bookings
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-2.5 rounded-lg border transition-colors ${
                showStats
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title="Toggle Stats Cards"
            >
              {showStats ? <EyeOpenIcon /> : <EyeClosedIcon />}
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title="Toggle Filters"
            >
              <FilterIcon />
            </button>

            {/* Analytics */}
            <button
              onClick={() => navigate('/manage/analytics/failed-checkouts')}
              className="p-2.5 rounded-lg border bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="View Analytics"
            >
              <AnalyticsIcon />
            </button>

            {/* Payments/Revenue */}
            <button
              onClick={() => handleFilterChange('payment_status', 'verification_pending')}
              className="p-2.5 rounded-lg border bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative"
              title="Verify Payments"
            >
              <DollarIcon />
              {stats.pending_verification > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {stats.pending_verification}
                </span>
              )}
            </button>

            {/* Create Reservation */}
            <Button
              variant="primary"
              onClick={() => navigate('/manage/properties')}
              className="flex items-center gap-2"
            >
              <PlusIcon size="sm" />
              Create Reservation
            </Button>
          </div>
        </div>

        {/* Alert Banners */}
        {stats.pending_verification > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <AlertIcon />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                  {stats.pending_verification} Payment{stats.pending_verification !== 1 ? 's' : ''} Awaiting Verification
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Guests have uploaded payment proofs. Review and verify to confirm bookings.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                  onClick={() => handleFilterChange('payment_status', 'verification_pending')}
                >
                  View Pending Verifications
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Collapsible */}
        {showFilters && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FilterIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <Input
                  type="text"
                  placeholder="Search by reference, guest name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Property Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property
              </label>
              <Select
                options={[
                  { value: '', label: 'All Properties' },
                  ...(properties || []).map(property => ({
                    value: property.id,
                    label: property.name
                  }))
                ]}
                value={filters.property_id || ''}
                onChange={(e) => handleFilterChange('property_id', e.target.value || undefined)}
              />
            </div>

            {/* Booking Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Booking Status
              </label>
              <Select
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'checked_in', label: 'Checked In' },
                  { value: 'checked_out', label: 'Checked Out' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'no_show', label: 'No Show' }
                ]}
                value={filters.booking_status as string || ''}
                onChange={(e) => handleFilterChange('booking_status', e.target.value || undefined)}
              />
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Status
              </label>
              <Select
                options={[
                  { value: '', label: 'All Payments' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'verification_pending', label: 'Verification Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'partial', label: 'Partial' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'refunded', label: 'Refunded' }
                ]}
                value={filters.payment_status as string || ''}
                onChange={(e) => handleFilterChange('payment_status', e.target.value || undefined)}
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <Select
                options={[
                  { value: 'created_at', label: 'Booking Date (When Made)' },
                  { value: 'check_in_date', label: 'Check-In Date' },
                  { value: 'check_out_date', label: 'Check-Out Date' },
                  { value: 'total_amount', label: 'Amount' }
                ]}
                value={filters.sortBy || 'created_at'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order
              </label>
              <Select
                options={[
                  { value: 'desc', label: 'Newest First' },
                  { value: 'asc', label: 'Oldest First' }
                ]}
                value={filters.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
        )}

        {/* Stats Cards - Collapsible */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Bookings"
              value={stats.total}
              icon={<CalendarIcon />}
              variant="default"
            />
            <StatCard
              title="Today's Check-Ins"
              value={stats.today_checkins}
              icon={<CheckInIcon />}
              variant="primary"
              subtitle={stats.today_checkins === 0 ? 'No arrivals today' : 'Arriving today'}
            />
            <StatCard
              title="Today's Check-Outs"
              value={stats.today_checkouts}
              icon={<CheckOutIcon />}
              variant="success"
              subtitle={stats.today_checkouts === 0 ? 'No departures today' : 'Departing today'}
            />
            <StatCard
              title="Pending Payments"
              value={stats.pending_payments}
              icon={<AlertIcon />}
              variant={stats.pending_payments > 0 ? 'warning' : 'default'}
              subtitle={stats.pending_payments > 0 ? 'Require attention' : 'All up to date'}
            />
          </div>
        )}

        {/* Bookings Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Check-In / Check-Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Spinner size="md" className="mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Loading bookings...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No bookings found. Try adjusting your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.booking_reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {booking.guest_name || 'N/A'}
                        </div>
                        {booking.guest_email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {booking.guest_email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {booking.property?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(booking.check_in_date)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          to {formatDate(booking.check_out_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BookingStatusBadge status={booking.booking_status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentStatusBadge status={booking.payment_status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(booking.total_amount, booking.currency)}
                        </div>
                        {booking.amount_paid < booking.total_amount && (
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            Balance: {formatCurrency(booking.total_amount - booking.amount_paid, booking.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/bookings/${booking.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};
