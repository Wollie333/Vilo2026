/**
 * FailedCheckoutsPage Component
 *
 * Analytics dashboard for failed/abandoned checkouts with recovery tracking.
 * Routes: /manage/analytics/failed-checkouts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Spinner,
  Alert,
  Card,
  StatCard,
  Select,
  EmptyState,
  Table,
  Badge,
} from '@/components/ui';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { ChartCard } from '@/pages/Dashboard/components/ChartCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineExclamation,
  HiOutlineMail,
  HiOutlineRefresh,
  HiOutlineFilter,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import { formatCurrency } from '@/types/booking.types';
import { propertyService } from '@/services';
import { api } from '@/services/api.service';

// ============================================================================
// Types
// ============================================================================

interface FailedCheckoutSummary {
  totalFailed: number;
  totalRevenueLost: number;
  averageTimeToAbandonment: number;
  failureRate: number;
}

interface TimelineDataPoint {
  date: string;
  count: number;
  revenue: number;
}

interface PropertyDataPoint {
  propertyId: string;
  propertyName: string;
  failedCount: number;
  revenueLost: number;
}

interface PaymentMethodDataPoint {
  method: string;
  count: number;
  percentage: number;
}

interface AbandonedBooking {
  id: string;
  bookingReference: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  failedCheckoutAt: string;
  daysSinceAbandonment: number;
}

interface FailedCheckoutAnalytics {
  summary: FailedCheckoutSummary;
  timeline: TimelineDataPoint[];
  byProperty: PropertyDataPoint[];
  byPaymentMethod: PaymentMethodDataPoint[];
  abandonedBookings: AbandonedBooking[];
}

interface Filters {
  startDate: string;
  endDate: string;
  propertyId: string;
  paymentMethod: string;
}

// ============================================================================
// Component
// ============================================================================

export const FailedCheckoutsPage: React.FC = () => {
  const navigate = useNavigate();

  // Data state
  const [analytics, setAnalytics] = useState<FailedCheckoutAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0],
    propertyId: '',
    paymentMethod: '',
  });

  // Properties for filter dropdown
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.propertyId) params.append('propertyId', filters.propertyId);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);

      const response = await api.get(`/analytics/failed-checkouts?${params.toString()}`);
      setAnalytics(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchProperties = useCallback(async () => {
    try {
      const data = await propertyService.getMyProperties({ page: 1, limit: 100 });
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Failed to load properties:', err);
      setProperties([]); // Set empty array on error
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      propertyId: '',
      paymentMethod: '',
    });
  };

  const handleViewBooking = (bookingId: string) => {
    navigate(`/bookings/${bookingId}`);
  };

  const handleSendRecoveryEmail = async (bookingId: string) => {
    // TODO: Implement recovery email sending
    setSuccess('Recovery email feature coming soon!');
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading && !analytics) {
    return (
      <AuthenticatedLayout title="Failed Checkouts Analytics">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!analytics) {
    return (
      <AuthenticatedLayout title="Failed Checkouts Analytics">
        <Card>
          <Card.Body className="text-center py-12">
            <EmptyState
              icon={HiOutlineChartBar}
              title="No data available"
              description="Unable to load analytics data"
            />
          </Card.Body>
        </Card>
      </AuthenticatedLayout>
    );
  }

  // ============================================================================
  // Chart Colors
  // ============================================================================

  const CHART_COLORS = ['#047857', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

  // Prepare chart data
  const paymentMethodChartData = analytics.byPaymentMethod.map((item) => ({
    name: item.method.toUpperCase(),
    value: item.count,
  }));

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AuthenticatedLayout
      title="Failed Checkouts Analytics"
      subtitle="Track abandoned bookings and recovery opportunities"
    >
      <div className="space-y-6">
        {/* Alerts */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineFilter className="w-5 h-5" />
                <span>Filters</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
                <Button size="sm" onClick={handleRefresh}>
                  <HiOutlineRefresh className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Property Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property
                </label>
                <Select
                  value={filters.propertyId}
                  onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
                  options={[
                    { value: '', label: 'All Properties' },
                    ...properties.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  fullWidth
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <Select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                  options={[
                    { value: '', label: 'All Methods' },
                    { value: 'eft', label: 'EFT' },
                    { value: 'card_on_arrival', label: 'Card on Arrival' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'stripe', label: 'Stripe' },
                    { value: 'paystack', label: 'Paystack' },
                  ]}
                  fullWidth
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Failed"
            value={analytics.summary.totalFailed.toString()}
            variant="error"
            icon={<HiOutlineExclamation />}
          />
          <StatCard
            title="Revenue Lost"
            value={formatCurrency(analytics.summary.totalRevenueLost, 'ZAR')}
            variant="warning"
            icon={<HiOutlineCurrencyDollar />}
          />
          <StatCard
            title="Avg Time to Abandonment"
            value={`${analytics.summary.averageTimeToAbandonment}h`}
            variant="info"
            icon={<HiOutlineClock />}
          />
          <StatCard
            title="Failure Rate"
            value={`${analytics.summary.failureRate}%`}
            variant="primary"
            icon={<HiOutlineChartBar />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <ChartCard
            title="Failed Checkouts Over Time"
            subtitle="Daily failed checkout count"
            height={300}
          >
            {analytics.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Failed Checkouts"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </ChartCard>

          {/* Payment Method Distribution */}
          <ChartCard
            title="By Payment Method"
            subtitle="Distribution of failed checkouts"
            height={300}
          >
            {paymentMethodChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Property Breakdown */}
        {analytics.byProperty.length > 0 && (
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                By Property
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Failed Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Revenue Lost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {analytics.byProperty.map((prop) => (
                      <tr key={prop.propertyId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {prop.propertyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {prop.failedCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(prop.revenueLost, 'ZAR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Abandoned Bookings Table */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Abandoned Bookings
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing latest {analytics.abandonedBookings.length} bookings
              </span>
            </div>
          </Card.Header>
          <Card.Body>
            {analytics.abandonedBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
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
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Days Ago
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {analytics.abandonedBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-primary">
                            {booking.bookingReference}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {booking.guestName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {booking.guestEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {booking.propertyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(booking.totalAmount, booking.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary" size="sm">
                            {booking.paymentMethod.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {booking.daysSinceAbandonment} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewBooking(booking.id)}
                          >
                            <HiOutlineDocumentText className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendRecoveryEmail(booking.id)}
                          >
                            <HiOutlineMail className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={HiOutlineChartBar}
                title="No abandoned bookings"
                description="There are no abandoned bookings matching your filters"
              />
            )}
          </Card.Body>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};
