// Main Dashboard Router (auto-detects user type)
export { Dashboard } from './Dashboard';

// Individual Dashboard Views (for direct access if needed)
export {
  SuperAdminDashboard,
  AdminDashboard,
  PropertyOwnerDashboard,
  GuestDashboard,
} from './views';

// Dashboard Components (for reuse in other pages)
export {
  MetricCard,
  ChartCard,
  ActivityFeed,
  QuickActions,
  UpcomingEvents,
  SystemHealth,
} from './components';

// Types
export type {
  DashboardMetric,
  ActivityItem,
  QuickAction,
  ChartDataPoint,
  UpcomingEvent,
  PropertySummaryData,
  SystemHealthIndicator,
  UserTypeName,
} from './Dashboard.types';
