/**
 * useSubscriptionAccess Hook
 *
 * Fetches and manages user's subscription access status
 * Returns flags for paused/cancelled state and write access
 */

import { useState, useEffect, useCallback } from 'react';
import { billingService } from '@/services';
import type { SubscriptionAccessStatus } from '@/types/subscription-access.types';

export interface UseSubscriptionAccessOptions {
  /** Whether to automatically fetch on mount (default: true) */
  autoFetch?: boolean;
  /** Polling interval in milliseconds (0 = no polling) */
  pollInterval?: number;
}

export interface UseSubscriptionAccessReturn {
  /** Full subscription access status */
  accessStatus: SubscriptionAccessStatus | null;
  /** Whether subscription is paused */
  isPaused: boolean;
  /** Whether subscription is cancelled */
  isCancelled: boolean;
  /** Whether user has write access (not in read-only mode) */
  hasWriteAccess: boolean;
  /** Whether to show the paused account modal */
  showPausedModal: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Manually refresh subscription access */
  refresh: () => Promise<void>;
}

/**
 * Hook to check user's subscription access status
 *
 * @example
 * ```tsx
 * const { isPaused, hasWriteAccess, showPausedModal, refresh } = useSubscriptionAccess();
 *
 * if (isPaused) {
 *   return <PausedAccountModal isOpen={showPausedModal} ... />;
 * }
 * ```
 */
export const useSubscriptionAccess = (
  options: UseSubscriptionAccessOptions = {}
): UseSubscriptionAccessReturn => {
  const { autoFetch = true, pollInterval = 0 } = options;

  const [accessStatus, setAccessStatus] = useState<SubscriptionAccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription access status
  const fetchAccessStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const status = await billingService.getMySubscriptionAccess();
      setAccessStatus(status);
    } catch (err: any) {
      console.error('Error fetching subscription access:', err);
      setError(err.message || 'Failed to fetch subscription access');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAccessStatus();
    }
  }, [autoFetch, fetchAccessStatus]);

  // Setup polling if enabled
  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchAccessStatus();
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [pollInterval, fetchAccessStatus]);

  // Derived state
  const isPaused = accessStatus?.subscriptionStatus === 'paused';
  const isCancelled = accessStatus?.subscriptionStatus === 'cancelled';
  const hasWriteAccess = accessStatus?.accessMode === 'full';

  // Show paused modal if:
  // 1. Subscription is paused, AND
  // 2. User doesn't have full access (read-only mode)
  const showPausedModal = isPaused && !hasWriteAccess;

  return {
    accessStatus,
    isPaused,
    isCancelled,
    hasWriteAccess,
    showPausedModal,
    isLoading,
    error,
    refresh: fetchAccessStatus,
  };
};
