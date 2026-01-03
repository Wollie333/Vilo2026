import { AuthenticatedLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

// Icons for UI elements
const BookingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const SupportIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

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

// Sample metrics data
const metrics = [
  { label: 'Total Bookings', value: '12', change: '+2 this month', trend: 'up' },
  { label: 'Upcoming Stays', value: '3', change: 'Next: Jan 15', trend: 'neutral' },
  { label: 'Reviews Given', value: '8', change: '2 pending', trend: 'neutral' },
  { label: 'Loyalty Points', value: '2,450', change: '+150 this month', trend: 'up' },
];

// Sample activity data
const recentActivity = [
  {
    id: 1,
    title: 'Booking confirmed at Ocean View Villa',
    dates: 'Jan 10, 2026 - Jan 15, 2026',
    status: 'confirmed',
  },
  {
    id: 2,
    title: 'Payment received for Mountain Lodge',
    dates: 'Jan 8, 2026',
    status: 'completed',
  },
  {
    id: 3,
    title: 'Review requested for Beach House',
    dates: 'Jan 5, 2026',
    status: 'pending',
  },
];

const statusColors: Record<string, string> = {
  confirmed: 'bg-success-light text-success-dark dark:bg-success/20 dark:text-success',
  completed: 'bg-info-light text-info-dark dark:bg-info/20 dark:text-info',
  pending: 'bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning',
};

export function Dashboard() {
  const { user } = useAuth();

  // Get user display name
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];

  return (
    <AuthenticatedLayout
      title={`Welcome back, ${firstName}!`}
      subtitle="Here's what's happening with your bookings"
    >
      {/* Welcome Banner */}
      <div className="mb-6 p-4 bg-primary rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
              Welcome to Your Customer Portal!
            </h2>
            <p className="text-brand-black/80 dark:text-brand-white/90 text-sm mt-1">
              Manage your bookings, reviews, and account settings all in one place.
            </p>
          </div>
          <Button variant="secondary" size="sm">
            Take a Tour
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <Card key={metric.label} variant="bordered">
            <Card.Body>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metric.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metric.value}
              </p>
              <p className="text-xs text-primary mt-1">{metric.change}</p>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - Spans 1 column */}
        <Card variant="bordered">
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="primary">
                <BookingIcon />
                Book New Stay
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CalendarIcon />
                View Calendar
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <SupportIcon />
                Contact Support
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Activity - Spans 2 columns */}
        <Card variant="bordered" className="lg:col-span-2">
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <button className="text-sm text-primary hover:text-primary-600 font-medium">
                View all
              </button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-dark-border">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                    <BookingIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.dates}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[activity.status]}`}
                  >
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
