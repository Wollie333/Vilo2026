import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // For checkout routes, redirect to signup instead of login (new users)
    // Preserve the destination and query params for after authentication
    const isCheckoutRoute = location.pathname.startsWith('/checkout');
    const redirectTo = isCheckoutRoute ? '/signup' : '/login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user is pending approval
  if (user?.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  // Check if user needs to complete onboarding
  const isOnboardingPage = location.pathname === '/onboarding';
  const isCheckoutPage = location.pathname.startsWith('/checkout');
  const hasCompletedOnboarding = user?.onboarding_completed_at !== null;

  // Redirect to onboarding if not completed (unless already on onboarding or checkout)
  // Allow checkout to complete first before onboarding
  if (!isOnboardingPage && !isCheckoutPage && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
