/**
 * Guest Dashboard Page
 * Main dashboard for guest portal showing bookings overview
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, MapPin, User } from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout';
import { PasswordChangePrompt } from '@/components/features/PasswordChangePrompt';

interface Booking {
  id: string;
  booking_reference: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  total_amount: number;
  currency: string;
  booking_status: string;
  payment_status: string;
  property_name: string;
  room_name: string;
}

export const GuestDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // TODO: Implement API call to fetch guest bookings
      // For now, using mock data
      const mockBookings: Booking[] = [];

      const now = new Date();
      const upcoming = mockBookings.filter(
        b => new Date(b.check_in_date) >= now && b.booking_status !== 'cancelled'
      );
      const past = mockBookings.filter(
        b => new Date(b.check_in_date) < now || b.booking_status === 'cancelled'
      );

      setUpcomingBookings(upcoming);
      setPastBookings(past);

      // Calculate total spent
      const spent = mockBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + b.total_amount, 0);
      setTotalSpent(spent);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout title="My Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout title="My Dashboard" subtitle="Welcome to your guest portal">
      {/* Password Change Prompt (shows only on first login) */}
      <PasswordChangePrompt />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {upcomingBookings.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Past Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pastBookings.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalSpent, 'USD')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upcoming Bookings
          </h2>
          <button
            onClick={() => navigate('/guest/bookings')}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View All
          </button>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Upcoming Bookings
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any upcoming bookings at the moment.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <div
                key={booking.id}
                onClick={() => navigate(`/guest/bookings/${booking.id}`)}
                className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {booking.property_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.room_name}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                    {booking.booking_status}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(booking.total_amount, booking.currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Booking Reference: <span className="font-mono font-medium">{booking.booking_reference}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings Preview */}
      {pastBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Past Bookings
            </h2>
            <button
              onClick={() => navigate('/guest/bookings?filter=past')}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View All
            </button>
          </div>

          <div className="grid gap-4">
            {pastBookings.slice(0, 2).map((booking) => (
              <div
                key={booking.id}
                onClick={() => navigate(`/guest/bookings/${booking.id}`)}
                className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6 hover:shadow-md transition-shadow cursor-pointer opacity-75"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {booking.property_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.room_name}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                    {booking.booking_status}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
};
