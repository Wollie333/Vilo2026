import { useEffect } from 'react';
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
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isLoading } = useAuth();

  // Defensive check: redirect to onboarding if not completed
  useEffect(() => {
    if (user && !user.onboarding_completed_at) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate]);

  // Show loading spinner while auth is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  // Determine which dashboard to show based on user role/type
  // Priority: SuperAdmin > Admin > PropertyOwner > Guest

  // 1. Super Admin - Full platform access
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  // 2. Admin - Administrative access
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // 3. Check if user has property-related roles (Property Owner)
  // Property owners have roles like 'property_admin' or 'property_manager'
  // or they have properties assigned to them
  const hasPropertyRole = user?.roles?.some((role) =>
    ['property_admin', 'property_manager'].includes(role.name)
  );
  const hasProperties = user?.properties && user.properties.length > 0;

  if (hasPropertyRole || hasProperties) {
    return <PropertyOwnerDashboard />;
  }

  // 4. Default to Guest dashboard for free users / clients
  return <GuestDashboard />;
}
