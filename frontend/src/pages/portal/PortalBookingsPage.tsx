/**
 * PortalBookingsPage
 *
 * Guest portal page showing user's booking history and upcoming stays.
 * Routes: /portal/bookings
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
} from '@/components/ui';
import { AuthenticatedLayout } from '@/components/layout';
import { bookingService } from '@/services/booking.service';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  formatCurrency,
  formatDateRange,
} from '@/types/booking.types';
import type { BookingWithDetails } from '@/types/booking.types';

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

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

const isUpcoming = (booking: BookingWithDetails): boolean => {
  const checkIn = new Date(booking.check_in_date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return checkIn >= now && booking.booking_status !== 'cancelled';
};

const isPast = (booking: BookingWithDetails): boolean => {
  const checkOut = new Date(booking.check_out_date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return checkOut < now;
};

const isCancelled = (booking: BookingWithDetails): boolean => {
  return booking.booking_status === 'cancelled';
};

const getDaysUntil = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// Booking Card Component
// ============================================================================

interface BookingCardProps {
  booking: BookingWithDetails;
  onClick: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick }) => {
  const daysUntil = getDaysUntil(booking.check_in_date);
  const upcoming = isUpcoming(booking);
  const cancelled = isCancelled(booking);

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        cancelled ? 'opacity-75' : ''
      }`}
      onClick={onClick}
    >
      <Card.Body>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Property placeholder (no image available in booking details) */}
          <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-border flex-shrink-0">
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <HomeIcon />
            </div>
          </div>

          {/* Booking info */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {booking.property_name || 'Property'}
                </h3>
              </div>
              <ChevronRightIcon />
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <CalendarIcon />
              <span>{formatDateRange(booking.check_in_date, booking.check_out_date)}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>{booking.total_nights} night{booking.total_nights !== 1 ? 's' : ''}</span>
            </div>

            {/* Guests */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <UserIcon />
              <span>
                {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                {booking.children > 0 && `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}`}
              </span>
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[booking.booking_status].bg} ${BOOKING_STATUS_COLORS[booking.booking_status].text}`}
                >
                  {BOOKING_STATUS_LABELS[booking.booking_status]}
                </span>
                {upcoming && daysUntil <= 7 && daysUntil >= 0 && (
                  <Badge variant="primary">
                    <ClockIcon />
                    <span className="ml-1">
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                    </span>
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(booking.total_amount, booking.currency)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {booking.booking_reference}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// ============================================================================
// Empty States
// ============================================================================

const UpcomingEmptyState: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => (
  <EmptyState
    icon={<CheckCircleIcon />}
    title="No upcoming stays"
    description="You don't have any upcoming reservations. Ready to plan your next getaway?"
    action={
      <Button variant="primary" onClick={onBrowse}>
        Browse Properties
      </Button>
    }
  />
);

const PastEmptyState: React.FC = () => (
  <EmptyState
    icon={<CalendarIcon />}
    title="No past stays"
    description="You haven't completed any stays yet. Your booking history will appear here."
  />
);

const CancelledEmptyState: React.FC = () => (
  <EmptyState
    icon={<XCircleIcon />}
    title="No cancelled bookings"
    description="You don't have any cancelled bookings."
  />
);

// ============================================================================
// Main Component
// ============================================================================

export const PortalBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load bookings the user MADE as a guest (not bookings received at their properties)
        const response = await bookingService.listBookings({
          bookingType: 'made', // Only show bookings user made as guest
          limit: 100,
          sortBy: 'check_in_date',
          sortOrder: 'desc',
        });
        setBookings(response.bookings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  // Filter bookings by tab
  const filteredBookings = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return bookings.filter(isUpcoming).sort((a, b) =>
          new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime()
        );
      case 'past':
        return bookings.filter(isPast).sort((a, b) =>
          new Date(b.check_out_date).getTime() - new Date(a.check_out_date).getTime()
        );
      case 'cancelled':
        return bookings.filter(isCancelled).sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      default:
        return bookings;
    }
  }, [bookings, activeTab]);

  // Get counts for tabs
  const counts = useMemo(() => ({
    upcoming: bookings.filter(isUpcoming).length,
    past: bookings.filter(isPast).length,
    cancelled: bookings.filter(isCancelled).length,
  }), [bookings]);

  // Handle booking click
  const handleBookingClick = (booking: BookingWithDetails) => {
    navigate(`/portal/bookings/${booking.id}`);
  };

  // Handle browse
  const handleBrowse = () => {
    navigate('/portal/properties');
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage your reservations
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          /* Tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList variant="underline" className="mb-6">
              <TabsTrigger value="upcoming" variant="underline">
                Upcoming
                {counts.upcoming > 0 && (
                  <Badge variant="primary" className="ml-2">
                    {counts.upcoming}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" variant="underline">
                Past
                {counts.past > 0 && (
                  <Badge variant="default" className="ml-2">
                    {counts.past}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cancelled" variant="underline">
                Cancelled
                {counts.cancelled > 0 && (
                  <Badge variant="error" className="ml-2">
                    {counts.cancelled}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Upcoming */}
            <TabsContent value="upcoming">
              {filteredBookings.length === 0 ? (
                <UpcomingEmptyState onBrowse={handleBrowse} />
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => handleBookingClick(booking)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Past */}
            <TabsContent value="past">
              {filteredBookings.length === 0 ? (
                <PastEmptyState />
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => handleBookingClick(booking)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Cancelled */}
            <TabsContent value="cancelled">
              {filteredBookings.length === 0 ? (
                <CancelledEmptyState />
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => handleBookingClick(booking)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default PortalBookingsPage;
