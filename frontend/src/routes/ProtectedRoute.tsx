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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is pending approval
  if (user?.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  // Check if user needs to complete onboarding
  const isOnboardingPage = location.pathname === '/onboarding';
  const hasCompletedOnboarding = user?.onboarding_completed_at !== null;

  // Redirect to onboarding if not completed (unless already there)
  if (!isOnboardingPage && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
