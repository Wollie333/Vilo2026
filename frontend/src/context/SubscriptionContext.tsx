/**
 * Subscription Context
 *
 * Global state management for subscription access status.
 * Determines if user has full access or should be in read-only mode.
 * Manages payment modal state for restricted action attempts.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { billingService } from '@/services/billing.service';
import { useAuth } from './AuthContext';
import type {
  SubscriptionAccessStatus,
  SubscriptionContextValue,
} from '@/types/subscription-access.types';

// ============================================================================
// Context
// ============================================================================

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface SubscriptionProviderProps {
  children: ReactNode;
}

// ============================================================================
// Provider
// ============================================================================

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated, isSuperAdmin } = useAuth();

  // Access status state
  const [accessStatus, setAccessStatus] = useState<SubscriptionAccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [attemptedAction, setAttemptedAction] = useState<string | null>(null);

  // Overlay dismissed state (user chose to browse in read-only mode)
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  // ============================================================================
  // Fetch Access Status
  // ============================================================================

  const fetchAccessStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setAccessStatus(null);
      setIsLoading(false);
      return;
    }

    // Super admins always have full access
    if (isSuperAdmin) {
      setAccessStatus({
        hasActiveSubscription: true,
        hasFullAccess: true,
        accessMode: 'full',
        subscriptionStatus: 'active',
        trialDaysRemaining: null,
        trialEndsAt: null,
        expiresAt: null,
        requiresPayment: false,
        message: '',
        hasPendingCheckout: false,
        pendingCheckoutId: null,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const status = await billingService.getMySubscriptionAccess();
      setAccessStatus(status);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subscription access';
      setError(message);
      console.error('Failed to fetch subscription access:', err);

      // Default to readonly on error for safety
      setAccessStatus({
        hasActiveSubscription: false,
        hasFullAccess: false,
        accessMode: 'readonly',
        subscriptionStatus: null,
        trialDaysRemaining: null,
        trialEndsAt: null,
        expiresAt: null,
        requiresPayment: true,
        message: 'Unable to verify subscription status',
        hasPendingCheckout: false,
        pendingCheckoutId: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isSuperAdmin]);

  // ============================================================================
  // Refresh Access
  // ============================================================================

  const refreshAccess = useCallback(async () => {
    await fetchAccessStatus();
  }, [fetchAccessStatus]);

  // ============================================================================
  // Payment Modal Methods
  // ============================================================================

  const openPaymentModal = useCallback((actionName?: string) => {
    setAttemptedAction(actionName || null);
    setShowPaymentModal(true);
  }, []);

  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setAttemptedAction(null);
  }, []);

  // ============================================================================
  // Overlay Methods
  // ============================================================================

  const dismissOverlay = useCallback(() => {
    setOverlayDismissed(true);
  }, []);

  const showOverlay = useCallback(() => {
    setOverlayDismissed(false);
  }, []);

  // ============================================================================
  // Initial Fetch
  // ============================================================================

  useEffect(() => {
    fetchAccessStatus();
  }, [fetchAccessStatus, user?.id]);

  // Reset when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setAccessStatus(null);
      setShowPaymentModal(false);
      setAttemptedAction(null);
    }
  }, [isAuthenticated]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: SubscriptionContextValue = useMemo(
    () => ({
      accessStatus,
      isLoading,
      error,
      refreshAccess,
      showPaymentModal,
      openPaymentModal,
      closePaymentModal,
      attemptedAction,
      overlayDismissed,
      dismissOverlay,
      showOverlay,
    }),
    [
      accessStatus,
      isLoading,
      error,
      refreshAccess,
      showPaymentModal,
      openPaymentModal,
      closePaymentModal,
      attemptedAction,
      overlayDismissed,
      dismissOverlay,
      showOverlay,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useSubscription = (): SubscriptionContextValue => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// ============================================================================
// Convenience Hook for Access Checks
// ============================================================================

export const useSubscriptionAccess = () => {
  const { accessStatus, isLoading } = useSubscription();

  return {
    isLoading,
    hasFullAccess: accessStatus?.hasFullAccess ?? false,
    isReadOnly: accessStatus?.accessMode === 'readonly',
    requiresPayment: accessStatus?.requiresPayment ?? true,
    trialDaysRemaining: accessStatus?.trialDaysRemaining ?? null,
    message: accessStatus?.message ?? '',
    subscriptionStatus: accessStatus?.subscriptionStatus ?? null,
  };
};
