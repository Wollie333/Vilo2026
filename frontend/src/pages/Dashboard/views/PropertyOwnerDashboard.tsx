import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AuthenticatedLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import {
  MetricCard,
  ChartCard,
  UpcomingEvents,
  QuickActions,
} from '../components';
import { dashboardService } from '@/services';
import { formatCurrency } from '@/utils/currency';
import type { QuickAction, PropertyOwnerDashboardData } from '../Dashboard.types';

// Icons
const PropertyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BookingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const OccupancyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const RevenueIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const metricIcons = [<PropertyIcon />, <BookingIcon />, <OccupancyIcon />, <RevenueIcon />];

const quickActions: QuickAction[] = [
  {
    id: 'add-property',
    label: 'Add Property',
    description: 'List a new property',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    href: '/manage/properties/new',
    variant: 'primary',
  },
  {
    id: 'view-bookings',
    label: 'View Bookings',
    description: 'Manage all bookings',
    icon: <BookingIcon />,
    href: '/manage/booking-management',
    variant: 'outline',
  },
  {
    id: 'my-properties',
    label: 'My Properties',
    description: 'View all properties',
    icon: <PropertyIcon />,
    href: '/manage/properties',
    variant: 'outline',
  },
  {
    id: 'my-profile',
    label: 'Account Settings',
    description: 'Manage your account',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: '/manage/profile',
    variant: 'outline',
  },
];

// Star rating component
const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-1">
    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
    </svg>
    <span className="text-sm font-medium text-gray-900 dark:text-white">{rating.toFixed(1)}</span>
  </div>
);

export const PropertyOwnerDashboard: React.FC = () => {
  const [data, setData] = useState<PropertyOwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await dashboardService.getPropertyOwnerDashboard();
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
        title="Property Dashboard"
        subtitle="Monitor your properties and bookings"
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
        title="Property Dashboard"
        subtitle="Monitor your properties and bookings"
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
      title="Property Dashboard"
      subtitle="Monitor your properties and bookings"
    >
      <div className="space-y-6">
        {/* Property Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.propertyMetrics.map((metric, index) => (
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Occupancy Chart */}
          <ChartCard
            title="Occupancy Rate"
            subtitle="Monthly occupancy percentage"
            height={280}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value: number) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Occupancy']}
                />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue Chart */}
          <ChartCard
            title="Monthly Revenue"
            subtitle="Revenue in ZAR"
            height={280}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value: number) => `R ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Revenue']}
                />
                <Bar
                  dataKey="revenue"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Upcoming Events and Property Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingEvents
            events={data.upcomingEvents}
            maxItems={5}
            title="Upcoming Check-ins & Check-outs"
          />

          {/* Property Summary */}
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Property Performance
              </h3>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-dark-border">
                {data.propertySummary.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {property.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{property.bookingsCount} bookings</span>
                        <span>{property.occupancyRate}% occupancy</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(property.revenue)}
                        </p>
                        {property.rating && <StarRating rating={property.rating} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Quick Actions */}
        <QuickActions actions={quickActions} columns={4} />
      </div>
    </AuthenticatedLayout>
  );
};
