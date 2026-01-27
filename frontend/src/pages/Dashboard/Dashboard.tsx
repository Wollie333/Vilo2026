import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import {
  SuperAdminDashboard,
  AdminDashboard,
  PropertyOwnerDashboard,
  GuestDashboard,
} from './views';

/**
 * Dashboard Router Component
 *
 * Renders the appropriate dashboard view based on user type:
 * - Super Admin: Platform overview with system metrics
 * - Admin: User management and platform activity
 * - Property Owner (Paid): Property performance and bookings
 * - Guest (Free): Personal bookings and activity
 *
 * Smart Dashboard:
 * - Property owners see BOTH property management stats AND guest booking stats
 * - Guests see ONLY guest booking stats
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isLoading, subscriptionAccess } = useAuth();

  // Defensive check: redirect to onboarding if not completed
  useEffect(() => {
    if (user && !user.onboarding_completed_at) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate]);

  // Determine if user is a property owner
  const isPropertyOwner = useMemo(() => {
    if (!user) return false;

    // PRIORITY 1: Check if user has an active paid subscription
    // This is the primary indicator that a user should see property management features
    const hasActiveSubscription = subscriptionAccess?.hasActiveSubscription || subscriptionAccess?.hasFullAccess;

    // PRIORITY 2: Check user type (paid or free tier)
    const hasOwnerType = ['paid', 'free'].includes(user.user_type?.name || '');

    // PRIORITY 3: Check if user has property-related roles
    const hasPropertyRole = user.roles?.some((role) =>
      ['property_admin', 'property_manager'].includes(role.name)
    );

    // PRIORITY 4: Check if user has properties assigned
    const hasProperties = user.properties && user.properties.length > 0;

    // User is a property owner if ANY of these conditions are true
    return hasActiveSubscription || hasOwnerType || hasPropertyRole || hasProperties;
  }, [user, subscriptionAccess]);

  // Show loading spinner while auth is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  // Determine which dashboard to show based on user role/type
  // Priority: SuperAdmin > Admin > Smart Dashboard (Property Owner + Guest)

  // 1. Super Admin - Full platform access
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  // 2. Admin - Administrative access
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // 3. Smart Dashboard - Shows both property management and guest sections
  // Property owners see BOTH sections, guests see ONLY guest section
  if (isPropertyOwner) {
    // Property owners see their management dashboard
    // (In the future, we can enhance this to show both sections in one view)
    return <PropertyOwnerDashboard />;
  }

  // 4. Default to Guest dashboard for guests/free users without properties
  return <GuestDashboard />;
}
