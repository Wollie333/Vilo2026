import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import {
  MetricCard,
  ActivityFeed,
  QuickActions,
} from '../components';
import { dashboardService } from '@/services';
import type { QuickAction, AdminDashboardData } from '../Dashboard.types';

// Icons
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PendingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PropertyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const metricIcons = [<UsersIcon />, <PendingIcon />, <PropertyIcon />];

const quickActions: QuickAction[] = [
  {
    id: 'manage-users',
    label: 'Manage Users',
    description: 'View and manage user accounts',
    icon: <UsersIcon />,
    href: '/admin/users',
    variant: 'outline',
  },
  {
    id: 'pending-approvals',
    label: 'Pending Approvals',
    description: 'Review new user registrations',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: '/admin/approvals',
    variant: 'primary',
  },
  {
    id: 'create-user',
    label: 'Create User',
    description: 'Add a new user to the platform',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    href: '/admin/users/new',
    variant: 'outline',
  },
  {
    id: 'my-profile',
    label: 'My Profile',
    description: 'View and edit your profile',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    href: '/manage/profile',
    variant: 'outline',
  },
];

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await dashboardService.getAdminDashboard();
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
        title="Admin Dashboard"
        subtitle="Manage users and monitor platform activity"
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AuthenticatedLayout
        title="Admin Dashboard"
        subtitle="Manage users and monitor platform activity"
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

  if (!data) return null;

  return (
    <AuthenticatedLayout
      title="Admin Dashboard"
      subtitle="Manage users and monitor platform activity"
    >
      <div className="space-y-6">
        {/* Support Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.supportMetrics.map((metric, index) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              variant={metric.variant}
              icon={metricIcons[index]}
              href={metric.id === 'pending-approvals' ? '/admin/approvals' : undefined}
            />
          ))}
        </div>

        {/* Pending Approvals Alert */}
        {data.pendingApprovals > 0 && (
          <div className="p-4 bg-warning-light dark:bg-warning/20 border border-warning/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <PendingIcon />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {data.pendingApprovals} users awaiting approval
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review and approve new user registrations
                  </p>
                </div>
              </div>
              <a
                href="/admin/approvals"
                className="px-4 py-2 bg-warning text-white rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors"
              >
                Review Now
              </a>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <ActivityFeed
          activities={data.recentActivity}
          maxItems={5}
        />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} columns={4} />
      </div>
    </AuthenticatedLayout>
  );
};
