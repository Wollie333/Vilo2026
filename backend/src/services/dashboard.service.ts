import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  change?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'check-in' | 'check-out' | 'system' | 'user' | 'property';
  title: string;
  description?: string;
  timestamp: string;
  status?: 'pending' | 'completed' | 'warning' | 'error' | 'info';
}

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface UpcomingEvent {
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

interface PropertySummaryData {
  id: string;
  name: string;
  occupancyRate: number;
  revenue: number;
  bookingsCount: number;
  rating?: number;
  image?: string;
}

interface SystemHealthIndicator {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value?: string;
  lastChecked: string;
}

// ============================================================================
// CACHING
// ============================================================================

interface CacheEntry {
  data: any;
  expires: number;
}

const dashboardCache = new Map<string, CacheEntry>();

/**
 * Get or fetch cached dashboard data
 */
const getCachedDashboardData = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300 // 5 minutes default
): Promise<T> => {
  const cached = dashboardCache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  const data = await fetcher();
  dashboardCache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  });

  return data;
};

/**
 * Clear cache for a specific user or all cache
 */
export const clearDashboardCache = (userId?: string): void => {
  if (userId) {
    // Clear all cache entries for this user
    for (const key of dashboardCache.keys()) {
      if (key.includes(userId)) {
        dashboardCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    dashboardCache.clear();
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency consistently
 */
const formatCurrency = (amount: number, currency = 'ZAR'): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get month names for the last N months
 */
const getLastNMonths = (n: number): { name: string; year: number; month: number; startDate: string; endDate: string }[] => {
  const months = [];
  const now = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    months.push({
      name: date.toLocaleString('default', { month: 'short' }),
      year,
      month,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  }

  return months;
};

/**
 * Calculate percentage change
 */
const calculateChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
  if (previous === 0) {
    return { value: 0, isPositive: true };
  }

  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    isPositive: change >= 0
  };
};

/**
 * Format activity from audit logs
 */
const formatActivityFeed = (auditLogs: any[]): ActivityItem[] => {
  return auditLogs.map(log => {
    let type: ActivityItem['type'] = 'system';
    let title = log.action;
    let status: ActivityItem['status'] = 'info';

    // Map audit actions to activity types
    if (log.action.includes('booking')) {
      type = 'booking';
      status = 'completed';
    } else if (log.action.includes('payment')) {
      type = 'payment';
      status = 'completed';
    } else if (log.action.includes('user')) {
      type = 'user';
    } else if (log.action.includes('property')) {
      type = 'property';
    }

    // Generate human-readable title
    switch (log.action) {
      case 'user.created':
        title = 'New user registered';
        break;
      case 'user.approved':
        title = 'User approved';
        break;
      case 'user.suspended':
        title = 'User suspended';
        status = 'warning';
        break;
      case 'checkout.completed':
        title = 'Booking confirmed';
        break;
      case 'refund_request.created':
        title = 'Refund requested';
        status = 'warning';
        break;
      default:
        title = log.action.replace(/\./g, ' ').replace(/_/g, ' ');
    }

    return {
      id: log.id,
      type,
      title,
      description: log.metadata?.description || '',
      timestamp: log.created_at,
      status
    };
  });
};

// ============================================================================
// PROPERTY OWNER DASHBOARD
// ============================================================================

/**
 * Count active bookings for a property owner
 */
const countActiveBookings = async (userId: string): Promise<number> => {
  const supabase = getAdminClient();

  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('booking_status', ['confirmed', 'checked_in'])
    .in(
      'property_id',
      supabase.from('properties').select('id').eq('owner_id', userId)
    );

  if (error) throw new AppError('INTERNAL_ERROR', 'Failed to count active bookings');

  return count || 0;
};

/**
 * Calculate average occupancy for property owner
 */
const calculateAverageOccupancy = async (userId: string): Promise<number> => {
  const supabase = getAdminClient();

  // Get user's properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', userId);

  if (!properties || properties.length === 0) return 0;

  const propertyIds = properties.map(p => p.id);

  // Get bookings for this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in_date, check_out_date')
    .in('property_id', propertyIds)
    .in('booking_status', ['confirmed', 'checked_in', 'checked_out', 'completed'])
    .gte('check_out_date', startOfMonth)
    .lte('check_in_date', endOfMonth);

  if (!bookings || bookings.length === 0) return 0;

  // Calculate booked nights (simplified - counts all booking nights in the month)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const totalAvailableNights = propertyIds.length * daysInMonth;

  let bookedNights = 0;
  for (const booking of bookings) {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    bookedNights += nights;
  }

  const occupancy = (bookedNights / totalAvailableNights) * 100;
  return Math.round(occupancy);
};

/**
 * Calculate monthly revenue for property owner
 */
const calculateMonthlyRevenue = async (userId: string): Promise<number> => {
  const supabase = getAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('total_amount, properties!inner(owner_id)')
    .eq('properties.owner_id', userId)
    .in('booking_status', ['confirmed', 'checked_in', 'checked_out', 'completed'])
    .gte('created_at', startOfMonth);

  if (!bookings) return 0;

  const revenue = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  return revenue;
};

/**
 * Get upcoming events (check-ins/check-outs)
 */
const getUpcomingEvents = async (userId: string): Promise<UpcomingEvent[]> => {
  const supabase = getAdminClient();

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get check-ins
  const { data: checkIns } = await supabase
    .from('bookings')
    .select('*, properties!inner(id, name, owner_id), users!bookings_guest_id_fkey(full_name, email)')
    .eq('properties.owner_id', userId)
    .gte('check_in_date', today)
    .lte('check_in_date', nextWeek)
    .in('booking_status', ['confirmed', 'pending'])
    .order('check_in_date', { ascending: true })
    .limit(5);

  // Get check-outs
  const { data: checkOuts } = await supabase
    .from('bookings')
    .select('*, properties!inner(id, name, owner_id), users!bookings_guest_id_fkey(full_name, email)')
    .eq('properties.owner_id', userId)
    .gte('check_out_date', today)
    .lte('check_out_date', nextWeek)
    .eq('booking_status', 'checked_in')
    .order('check_out_date', { ascending: true })
    .limit(5);

  const events: UpcomingEvent[] = [];

  if (checkIns) {
    checkIns.forEach(booking => {
      events.push({
        id: `checkin-${booking.id}`,
        type: 'check-in',
        title: `Check-in: ${booking.users?.full_name || booking.guest_email}`,
        subtitle: `${booking.guest_count_adults + booking.guest_count_children} guests`,
        date: booking.check_in_date,
        property: {
          id: booking.properties.id,
          name: booking.properties.name
        },
        status: booking.check_in_date === today ? 'today' : 'upcoming'
      });
    });
  }

  if (checkOuts) {
    checkOuts.forEach(booking => {
      events.push({
        id: `checkout-${booking.id}`,
        type: 'check-out',
        title: `Check-out: ${booking.users?.full_name || booking.guest_email}`,
        subtitle: `${booking.guest_count_adults + booking.guest_count_children} guests`,
        date: booking.check_out_date,
        property: {
          id: booking.properties.id,
          name: booking.properties.name
        },
        status: booking.check_out_date === today ? 'today' : 'upcoming'
      });
    });
  }

  // Sort by date
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Get property performance summary
 */
const getPropertyPerformanceSummary = async (userId: string): Promise<PropertySummaryData[]> => {
  const supabase = getAdminClient();

  const { data: properties } = await supabase
    .from('properties')
    .select(`
      id,
      name,
      thumbnail_url,
      bookings(
        id,
        total_amount,
        booking_status,
        check_in_date,
        check_out_date
      )
    `)
    .eq('owner_id', userId)
    .limit(10);

  if (!properties) return [];

  const summary: PropertySummaryData[] = [];
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  for (const property of properties) {
    const bookings = property.bookings || [];
    const confirmedBookings = bookings.filter((b: any) =>
      ['confirmed', 'checked_in', 'checked_out', 'completed'].includes(b.booking_status)
    );

    // Calculate revenue (this month)
    const monthlyBookings = confirmedBookings.filter((b: any) =>
      new Date(b.check_in_date) >= startOfMonth
    );
    const revenue = monthlyBookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);

    // Calculate occupancy (simplified)
    let bookedNights = 0;
    for (const booking of monthlyBookings) {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      bookedNights += nights;
    }
    const occupancyRate = Math.round((bookedNights / daysInMonth) * 100);

    summary.push({
      id: property.id,
      name: property.name,
      occupancyRate: Math.min(occupancyRate, 100),
      revenue,
      bookingsCount: confirmedBookings.length,
      rating: undefined, // TODO: Implement reviews
      image: property.thumbnail_url
    });
  }

  return summary;
};

/**
 * Get monthly occupancy trend
 */
const getMonthlyOccupancyTrend = async (userId: string): Promise<ChartDataPoint[]> => {
  const supabase = getAdminClient();

  const months = getLastNMonths(12);
  const chartData: ChartDataPoint[] = [];

  // Get user's properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', userId);

  if (!properties || properties.length === 0) {
    return months.map(m => ({ name: m.name, occupancy: 0 }));
  }

  const propertyIds = properties.map(p => p.id);

  for (const month of months) {
    const daysInMonth = new Date(month.year, month.month, 0).getDate();
    const totalAvailableNights = propertyIds.length * daysInMonth;

    const { data: bookings } = await supabase
      .from('bookings')
      .select('check_in_date, check_out_date')
      .in('property_id', propertyIds)
      .in('booking_status', ['confirmed', 'checked_in', 'checked_out', 'completed'])
      .gte('check_out_date', month.startDate)
      .lte('check_in_date', month.endDate);

    let bookedNights = 0;
    if (bookings) {
      for (const booking of bookings) {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        bookedNights += nights;
      }
    }

    const occupancy = totalAvailableNights > 0
      ? Math.round((bookedNights / totalAvailableNights) * 100)
      : 0;

    chartData.push({
      name: month.name,
      occupancy: Math.min(occupancy, 100)
    });
  }

  return chartData;
};

/**
 * Get monthly revenue trend
 */
const getMonthlyRevenueTrend = async (userId: string): Promise<ChartDataPoint[]> => {
  const supabase = getAdminClient();

  const months = getLastNMonths(12);
  const chartData: ChartDataPoint[] = [];

  for (const month of months) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('total_amount, properties!inner(owner_id)')
      .eq('properties.owner_id', userId)
      .in('booking_status', ['confirmed', 'checked_in', 'checked_out', 'completed'])
      .gte('created_at', month.startDate)
      .lte('created_at', month.endDate);

    const revenue = bookings
      ? bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      : 0;

    chartData.push({
      name: month.name,
      revenue
    });
  }

  return chartData;
};

/**
 * Get Property Owner Dashboard Data
 */
export const getPropertyOwnerDashboard = async (userId: string) => {
  return getCachedDashboardData(
    `property-owner:${userId}`,
    async () => {
      const supabase = getAdminClient();

      // Get property count
      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      // Get metrics
      const activeBookings = await countActiveBookings(userId);
      const avgOccupancy = await calculateAverageOccupancy(userId);
      const monthlyRevenue = await calculateMonthlyRevenue(userId);

      // Get last month's revenue for comparison
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1, 1);
      const lastMonthEnd = new Date();
      lastMonthEnd.setMonth(lastMonthEnd.getMonth(), 0);

      const { data: lastMonthBookings } = await supabase
        .from('bookings')
        .select('total_amount, properties!inner(owner_id)')
        .eq('properties.owner_id', userId)
        .in('booking_status', ['confirmed', 'checked_in', 'checked_out', 'completed'])
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      const lastMonthRevenue = lastMonthBookings
        ? lastMonthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
        : 0;

      const revenueChange = calculateChange(monthlyRevenue, lastMonthRevenue);

      const propertyMetrics: DashboardMetric[] = [
        {
          id: 'total-properties',
          label: 'Total Properties',
          value: propertyCount || 0,
          variant: 'primary'
        },
        {
          id: 'active-bookings',
          label: 'Active Bookings',
          value: activeBookings,
          variant: 'success'
        },
        {
          id: 'avg-occupancy',
          label: 'Average Occupancy',
          value: `${avgOccupancy}%`,
          variant: 'info'
        },
        {
          id: 'monthly-revenue',
          label: 'Monthly Revenue',
          value: formatCurrency(monthlyRevenue),
          change: {
            value: revenueChange.value,
            isPositive: revenueChange.isPositive,
            period: 'vs last month'
          },
          variant: 'success'
        }
      ];

      // Get historical data
      const occupancyData = await getMonthlyOccupancyTrend(userId);
      const revenueData = await getMonthlyRevenueTrend(userId);

      // Get upcoming events
      const upcomingEvents = await getUpcomingEvents(userId);

      // Get property summary
      const propertySummary = await getPropertyPerformanceSummary(userId);

      return {
        propertyMetrics,
        occupancyData,
        revenueData,
        upcomingEvents,
        propertySummary
      };
    }
  );
};

// ============================================================================
// GUEST DASHBOARD
// ============================================================================

/**
 * Get Guest Dashboard Data
 */
export const getGuestDashboard = async (userId: string) => {
  return getCachedDashboardData(
    `guest:${userId}`,
    async () => {
      const supabase = getAdminClient();
      const today = new Date().toISOString().split('T')[0];

      // Count total bookings
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('guest_id', userId);

      // Count upcoming stays
      const { count: upcomingStays } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('guest_id', userId)
        .gte('check_in_date', today)
        .in('booking_status', ['confirmed', 'pending']);

      const bookingMetrics: DashboardMetric[] = [
        {
          id: 'total-bookings',
          label: 'Total Bookings',
          value: totalBookings || 0,
          variant: 'primary'
        },
        {
          id: 'upcoming-stays',
          label: 'Upcoming Stays',
          value: upcomingStays || 0,
          variant: 'info'
        },
        {
          id: 'reviews-given',
          label: 'Reviews Given',
          value: 0, // TODO: Implement reviews
          variant: 'success'
        },
        {
          id: 'loyalty-points',
          label: 'Loyalty Points',
          value: 0, // TODO: Implement loyalty program
          variant: 'warning'
        }
      ];

      // Get upcoming bookings
      const { data: upcomingBookingsData } = await supabase
        .from('bookings')
        .select('*, properties(id, name, thumbnail_url)')
        .eq('guest_id', userId)
        .gte('check_in_date', today)
        .in('booking_status', ['confirmed', 'pending'])
        .order('check_in_date', { ascending: true })
        .limit(10);

      const upcomingBookings: UpcomingEvent[] = upcomingBookingsData
        ? upcomingBookingsData.map(booking => ({
            id: booking.id,
            type: 'booking' as const,
            title: booking.properties.name,
            subtitle: `${booking.guest_count_adults + booking.guest_count_children} guests`,
            date: booking.check_in_date,
            property: {
              id: booking.properties.id,
              name: booking.properties.name
            },
            status: booking.check_in_date === today ? 'today' as const : 'upcoming' as const
          }))
        : [];

      // Get past bookings
      const { data: pastBookingsData } = await supabase
        .from('bookings')
        .select('*, properties(id, name, thumbnail_url)')
        .eq('guest_id', userId)
        .lt('check_out_date', today)
        .in('booking_status', ['checked_out', 'completed'])
        .order('check_out_date', { ascending: false })
        .limit(5);

      const pastBookings: UpcomingEvent[] = pastBookingsData
        ? pastBookingsData.map(booking => ({
            id: booking.id,
            type: 'booking' as const,
            title: booking.properties.name,
            subtitle: `${booking.guest_count_adults + booking.guest_count_children} guests`,
            date: booking.check_out_date,
            property: {
              id: booking.properties.id,
              name: booking.properties.name
            },
            status: 'upcoming' as const
          }))
        : [];

      // Get recent activity
      const { data: auditLogs } = await supabase
        .from('audit_log')
        .select('*')
        .eq('actor_id', userId)
        .in('action', ['checkout.completed', 'checkout.created', 'refund_request.created'])
        .order('created_at', { ascending: false })
        .limit(10);

      const recentActivity = formatActivityFeed(auditLogs || []);

      return {
        bookingMetrics,
        upcomingStays: upcomingBookings,
        pastStays: pastBookings,
        loyaltyPoints: 0,
        recentActivity
      };
    }
  );
};

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================

/**
 * Get Admin Dashboard Data
 */
export const getAdminDashboard = async () => {
  return getCachedDashboardData(
    'admin:global',
    async () => {
      const supabase = getAdminClient();

      // Get user statistics
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: pendingApprovals } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count active properties
      const { count: activeProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const supportMetrics: DashboardMetric[] = [
        {
          id: 'total-users',
          label: 'Total Users',
          value: totalUsers || 0,
          variant: 'primary'
        },
        {
          id: 'pending-approvals',
          label: 'Pending Approvals',
          value: pendingApprovals || 0,
          variant: 'warning'
        },
        {
          id: 'active-properties',
          label: 'Active Properties',
          value: activeProperties || 0,
          variant: 'success'
        }
      ];

      // Get recent activity (admin-relevant actions)
      const { data: auditLogs } = await supabase
        .from('audit_log')
        .select('*')
        .in('action', [
          'user.created',
          'user.approved',
          'user.suspended',
          'property.updated',
          'refund_request.created'
        ])
        .order('created_at', { ascending: false })
        .limit(10);

      const recentActivity = formatActivityFeed(auditLogs || []);

      return {
        supportMetrics,
        recentActivity,
        pendingApprovals: pendingApprovals || 0
      };
    }
  );
};

// ============================================================================
// SUPER ADMIN DASHBOARD
// ============================================================================

/**
 * Get monthly user growth
 */
const getMonthlyUserGrowth = async (): Promise<ChartDataPoint[]> => {
  const supabase = getAdminClient();
  const months = getLastNMonths(12);
  const chartData: ChartDataPoint[] = [];

  for (const month of months) {
    const { count: newUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', month.startDate)
      .lte('created_at', month.endDate);

    chartData.push({
      name: month.name,
      users: newUsers || 0,
      newUsers: newUsers || 0
    });
  }

  return chartData;
};

/**
 * Get monthly platform revenue
 */
const getMonthlyPlatformRevenue = async (): Promise<ChartDataPoint[]> => {
  const supabase = getAdminClient();
  const months = getLastNMonths(12);
  const chartData: ChartDataPoint[] = [];

  for (const month of months) {
    // Get subscription revenue
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('subscription_types(price)')
      .eq('subscription_status', 'active')
      .gte('created_at', month.startDate)
      .lte('created_at', month.endDate);

    const subscriptionRevenue = subscriptions
      ? subscriptions.reduce((sum, sub: any) => sum + (sub.subscription_types?.price || 0), 0)
      : 0;

    chartData.push({
      name: month.name,
      revenue: subscriptionRevenue,
      subscriptions: subscriptions?.length || 0
    });
  }

  return chartData;
};

/**
 * Get Super Admin Dashboard Data
 */
export const getSuperAdminDashboard = async () => {
  return getCachedDashboardData(
    'superadmin:global',
    async () => {
      const supabase = getAdminClient();

      // Platform metrics
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      // Calculate this month's revenue
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: monthlySubscriptions } = await supabase
        .from('user_subscriptions')
        .select('subscription_types(price)')
        .eq('subscription_status', 'active')
        .gte('created_at', startOfMonth);

      const monthlyRevenue = monthlySubscriptions
        ? monthlySubscriptions.reduce((sum, sub: any) => sum + (sub.subscription_types?.price || 0), 0)
        : 0;

      const platformMetrics: DashboardMetric[] = [
        {
          id: 'total-users',
          label: 'Total Users',
          value: totalUsers || 0,
          variant: 'primary'
        },
        {
          id: 'monthly-revenue',
          label: 'Monthly Revenue',
          value: formatCurrency(monthlyRevenue),
          variant: 'success'
        },
        {
          id: 'active-subscriptions',
          label: 'Active Subscriptions',
          value: activeSubscriptions || 0,
          variant: 'info'
        },
        {
          id: 'system-uptime',
          label: 'System Uptime',
          value: '99.9%',
          variant: 'success'
        }
      ];

      // Get user growth data
      const userGrowthData = await getMonthlyUserGrowth();

      // Get revenue data
      const revenueData = await getMonthlyPlatformRevenue();

      // Get recent activity
      const { data: auditLogs } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const recentActivity = formatActivityFeed(auditLogs || []);

      // System health indicators (mock for now)
      const systemHealth: SystemHealthIndicator[] = [
        {
          id: 'api',
          name: 'API Server',
          status: 'healthy',
          value: 'Operational',
          lastChecked: new Date().toISOString()
        },
        {
          id: 'database',
          name: 'Database',
          status: 'healthy',
          value: 'Operational',
          lastChecked: new Date().toISOString()
        },
        {
          id: 'storage',
          name: 'Storage',
          status: 'healthy',
          value: 'Operational',
          lastChecked: new Date().toISOString()
        },
        {
          id: 'email',
          name: 'Email Service',
          status: 'healthy',
          value: 'Operational',
          lastChecked: new Date().toISOString()
        },
        {
          id: 'payments',
          name: 'Payment Gateway',
          status: 'healthy',
          value: 'Operational',
          lastChecked: new Date().toISOString()
        }
      ];

      return {
        platformMetrics,
        userGrowthData,
        revenueData,
        recentActivity,
        systemHealth
      };
    }
  );
};

// ============================================================================
// FAILED CHECKOUT ANALYTICS
// ============================================================================

export interface FailedCheckoutFilters {
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  paymentMethod?: string;
}

export interface FailedCheckoutAnalytics {
  summary: {
    totalFailed: number;
    totalRevenueLost: number;
    averageTimeToAbandonment: number; // in hours
    failureRate: number; // percentage
  };
  timeline: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  byProperty: Array<{
    propertyId: string;
    propertyName: string;
    failedCount: number;
    revenueLost: number;
  }>;
  byPaymentMethod: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  abandonedBookings: Array<{
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
  }>;
}

/**
 * Get failed checkout analytics with optional filters
 */
export const getFailedCheckoutAnalytics = async (
  userId: string,
  filters: FailedCheckoutFilters = {}
): Promise<FailedCheckoutAnalytics> => {
  const supabase = getAdminClient();

  // Get user role to determine data scope
  const { data: userData } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', userId)
    .single();

  if (!userData) {
    throw new AppError('User not found', 404);
  }

  const isAdmin = ['super_admin', 'vilo_admin'].includes(userData.user_type);

  // Build base query
  let bookingsQuery = supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      guest_name,
      guest_email,
      total_amount,
      currency,
      payment_method,
      created_at,
      failed_checkout_at,
      property:properties(id, name)
    `)
    .eq('payment_status', 'failed_checkout')
    .order('failed_checkout_at', { ascending: false });

  // Apply property filter for non-admins
  if (!isAdmin) {
    const { data: ownedProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_id', userId);

    if (!ownedProperties || ownedProperties.length === 0) {
      // User has no properties, return empty analytics
      return {
        summary: {
          totalFailed: 0,
          totalRevenueLost: 0,
          averageTimeToAbandonment: 0,
          failureRate: 0,
        },
        timeline: [],
        byProperty: [],
        byPaymentMethod: [],
        abandonedBookings: [],
      };
    }

    const propertyIds = ownedProperties.map(p => p.id);
    bookingsQuery = bookingsQuery.in('property_id', propertyIds);
  }

  // Apply filters
  if (filters.startDate) {
    bookingsQuery = bookingsQuery.gte('failed_checkout_at', filters.startDate);
  }
  if (filters.endDate) {
    bookingsQuery = bookingsQuery.lte('failed_checkout_at', filters.endDate);
  }
  if (filters.propertyId) {
    bookingsQuery = bookingsQuery.eq('property_id', filters.propertyId);
  }
  if (filters.paymentMethod) {
    bookingsQuery = bookingsQuery.eq('payment_method', filters.paymentMethod);
  }

  const { data: failedBookings, error } = await bookingsQuery;

  if (error) {
    throw new AppError(`Failed to fetch analytics: ${error.message}`, 500);
  }

  if (!failedBookings || failedBookings.length === 0) {
    return {
      summary: {
        totalFailed: 0,
        totalRevenueLost: 0,
        averageTimeToAbandonment: 0,
        failureRate: 0,
      },
      timeline: [],
      byProperty: [],
      byPaymentMethod: [],
      abandonedBookings: [],
    };
  }

  // Calculate summary metrics
  const totalFailed = failedBookings.length;
  const totalRevenueLost = failedBookings.reduce((sum, b) => sum + b.total_amount, 0);

  // Calculate average time to abandonment
  const abandonmentTimes = failedBookings
    .filter(b => b.created_at && b.failed_checkout_at)
    .map(b => {
      const created = new Date(b.created_at).getTime();
      const failed = new Date(b.failed_checkout_at!).getTime();
      return (failed - created) / (1000 * 60 * 60); // hours
    });

  const averageTimeToAbandonment = abandonmentTimes.length > 0
    ? abandonmentTimes.reduce((sum, t) => sum + t, 0) / abandonmentTimes.length
    : 0;

  // Calculate failure rate (compared to all bookings)
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  const failureRate = totalBookings ? (totalFailed / totalBookings) * 100 : 0;

  // Group by date for timeline
  const timelineMap = new Map<string, { count: number; revenue: number }>();
  failedBookings.forEach(booking => {
    if (!booking.failed_checkout_at) return;
    const date = booking.failed_checkout_at.split('T')[0]; // YYYY-MM-DD
    const existing = timelineMap.get(date) || { count: 0, revenue: 0 };
    timelineMap.set(date, {
      count: existing.count + 1,
      revenue: existing.revenue + booking.total_amount,
    });
  });

  const timeline = Array.from(timelineMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by property
  const propertyMap = new Map<string, { propertyName: string; failedCount: number; revenueLost: number }>();
  failedBookings.forEach(booking => {
    const property = booking.property as any;
    if (!property) return;
    const propertyId = property.id;
    const propertyName = property.name;
    const existing = propertyMap.get(propertyId) || { propertyName, failedCount: 0, revenueLost: 0 };
    propertyMap.set(propertyId, {
      propertyName,
      failedCount: existing.failedCount + 1,
      revenueLost: existing.revenueLost + booking.total_amount,
    });
  });

  const byProperty = Array.from(propertyMap.entries())
    .map(([propertyId, data]) => ({ propertyId, ...data }))
    .sort((a, b) => b.failedCount - a.failedCount);

  // Group by payment method
  const paymentMethodMap = new Map<string, number>();
  failedBookings.forEach(booking => {
    const method = booking.payment_method || 'unknown';
    paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + 1);
  });

  const byPaymentMethod = Array.from(paymentMethodMap.entries())
    .map(([method, count]) => ({
      method,
      count,
      percentage: (count / totalFailed) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Format abandoned bookings list
  const abandonedBookings = failedBookings.slice(0, 50).map(booking => {
    const property = booking.property as any;
    const createdAt = new Date(booking.created_at);
    const failedAt = booking.failed_checkout_at ? new Date(booking.failed_checkout_at) : new Date();
    const daysSinceAbandonment = Math.floor((Date.now() - failedAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: booking.id,
      bookingReference: booking.booking_reference,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email || '',
      propertyName: property?.name || 'Unknown',
      totalAmount: booking.total_amount,
      currency: booking.currency,
      paymentMethod: booking.payment_method || 'unknown',
      createdAt: booking.created_at,
      failedCheckoutAt: booking.failed_checkout_at || '',
      daysSinceAbandonment,
    };
  });

  return {
    summary: {
      totalFailed,
      totalRevenueLost,
      averageTimeToAbandonment: Math.round(averageTimeToAbandonment * 10) / 10,
      failureRate: Math.round(failureRate * 100) / 100,
    },
    timeline,
    byProperty,
    byPaymentMethod,
    abandonedBookings,
  };
};
