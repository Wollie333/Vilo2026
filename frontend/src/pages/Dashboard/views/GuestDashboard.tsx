import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  MetricCard,
  UpcomingEvents,
  ActivityFeed,
  QuickActions,
} from '../components';
import { dashboardService } from '@/services';
import type { QuickAction, GuestDashboardData } from '../Dashboard.types';
import { useAuth } from '@/context/AuthContext';

// Icons
const BookingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UpcomingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ReviewIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const metricIcons = [<BookingIcon />, <UpcomingIcon />, <ReviewIcon />];

const quickActions: QuickAction[] = [
  {
    id: 'browse-properties',
    label: 'Browse Properties',
    description: 'Find your next stay',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    href: '/search',
    variant: 'primary',
  },
  {
    id: 'my-bookings',
    label: 'My Bookings',
    description: 'View all your bookings',
    icon: <BookingIcon />,
    href: '/manage/booking-management',
    variant: 'outline',
  },
  {
    id: 'my-refunds',
    label: 'My Refunds',
    description: 'View refund requests',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
    href: '/refunds',
    variant: 'outline',
  },
  {
    id: 'my-profile',
    label: 'My Profile',
    description: 'Manage your account',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    href: '/manage/profile',
    variant: 'outline',
  },
];

export const GuestDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<GuestDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Get user display name
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Guest';
  const firstName = displayName.split(' ')[0];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await dashboardService.getGuestDashboard();
        setData(dashboardData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout
        title={`Welcome back, ${firstName}!`}
        subtitle="Here's what's happening with your bookings"
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AuthenticatedLayout
        title={`Welcome back, ${firstName}!`}
        subtitle="Here's what's happening with your bookings"
      >
        <Card variant="bordered">
          <Card.Body>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to Load Dashboard
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Retry
              </button>
            </div>
          </Card.Body>
        </Card>
      </AuthenticatedLayout>
    );
  }

  // Data validation
  if (!data) return null;

  return (
    <AuthenticatedLayout
      title={`Welcome back, ${firstName}!`}
      subtitle="Here's what's happening with your bookings"
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        {showWelcomeBanner && (
          <div className="p-4 bg-primary rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Welcome to Your Customer Portal!
                </h2>
                <p className="text-white/90 text-sm mt-1">
                  Manage your bookings, reviews, and account settings all in one place.
                </p>
              </div>
              <button
                onClick={() => setShowWelcomeBanner(false)}
                className="p-2 hover:bg-white/10 rounded-md transition-colors"
                aria-label="Close welcome banner"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Booking Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.bookingMetrics.map((metric, index) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              variant={metric.variant}
              icon={metricIcons[index]}
            />
          ))}
        </div>

        {/* Upcoming and Past Stays */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingEvents
            events={data.upcomingStays}
            maxItems={3}
            title="Upcoming Stays"
            emptyMessage="No upcoming stays. Time to book your next adventure!"
          />
          <UpcomingEvents
            events={data.pastStays}
            maxItems={3}
            title="Past Stays"
            emptyMessage="No past stays yet. Your travel history will appear here."
          />
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed
            activities={data.recentActivity}
            maxItems={4}
            emptyMessage="No recent activity"
          />
          <QuickActions actions={quickActions} columns={2} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
};
