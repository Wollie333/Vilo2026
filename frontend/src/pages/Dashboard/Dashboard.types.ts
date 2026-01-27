import { ReactNode } from 'react';

// User type names (matches database)
export type UserTypeName = 'super_admin' | 'admin' | 'free' | 'paid';

// Dashboard metric with optional trend
export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  change?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  href?: string;
}

// Activity feed item
export interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'check-in' | 'check-out' | 'system' | 'user' | 'property';
  title: string;
  description?: string;
  timestamp: string;
  status?: 'pending' | 'completed' | 'warning' | 'error' | 'info';
  href?: string;
  icon?: ReactNode;
}

// Quick action button
export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
}

// Chart data point
export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

// Upcoming event
export interface UpcomingEvent {
  id: string;
  type: 'check-in' | 'check-out' | 'maintenance' | 'booking' | 'review';
  title: string;
  subtitle?: string;
  date: string;
  time?: string;
  property?: {
    id: string;
    name: string;
  };
  status?: 'upcoming' | 'today' | 'overdue';
}

// Property summary for dashboard
export interface PropertySummaryData {
  id: string;
  name: string;
  occupancyRate: number;
  revenue: number;
  bookingsCount: number;
  rating?: number;
  image?: string;
}

// System health indicator
export interface SystemHealthIndicator {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value?: string;
  lastChecked: string;
}

// Dashboard data per role
export interface SuperAdminDashboardData {
  platformMetrics: DashboardMetric[];
  userGrowthData: ChartDataPoint[];
  revenueData: ChartDataPoint[];
  recentActivity: ActivityItem[];
  systemHealth: SystemHealthIndicator[];
}

export interface AdminDashboardData {
  supportMetrics: DashboardMetric[];
  recentActivity: ActivityItem[];
  pendingApprovals: number;
}

export interface PropertyOwnerDashboardData {
  propertyMetrics: DashboardMetric[];
  occupancyData: ChartDataPoint[];
  revenueData: ChartDataPoint[];
  upcomingEvents: UpcomingEvent[];
  propertySummary: PropertySummaryData[];
}

export interface GuestDashboardData {
  bookingMetrics: DashboardMetric[];
  upcomingStays: UpcomingEvent[];
  pastStays: UpcomingEvent[];
  recentActivity: ActivityItem[];
}
