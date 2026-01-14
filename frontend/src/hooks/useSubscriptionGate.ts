import { useCallback } from 'react';
import { useSubscription } from '@/context/SubscriptionContext';
import type {
  UseSubscriptionGateOptions,
  UseSubscriptionGateReturn,
} from '@/types/subscription-access.types';

/**
 * Hook for gating actions based on subscription status.
 *
 * Usage:
 * ```tsx
 * const { canPerformAction, gatedAction } = useSubscriptionGate({
 *   actionName: 'Create Property',
 * });
 *
 * // Wrap any action to gate it
 * const handleCreate = gatedAction(() => navigate('/properties/new'));
 *
 * // Or check manually
 * if (canPerformAction) {
 *   // Do something
 * } else {
 *   handleRestrictedAction();
 * }
 * ```
 */
export const useSubscriptionGate = (
  options: UseSubscriptionGateOptions = {}
): UseSubscriptionGateReturn => {
  const { accessStatus, openPaymentModal } = useSubscription();

  const canPerformAction = accessStatus?.hasFullAccess ?? false;
  const isReadOnly = accessStatus?.accessMode === 'readonly';

  const handleRestrictedAction = useCallback(() => {
    openPaymentModal(options.actionName);
  }, [openPaymentModal, options.actionName]);

  /**
   * Wraps an action function to gate it based on subscription status.
   * If user has full access, the action is executed normally.
   * If not, the payment modal is shown instead.
   */
  const gatedAction = useCallback(
    <T extends (...args: any[]) => any>(action: T) => {
      return (...args: Parameters<T>): ReturnType<T> | void => {
        if (canPerformAction) {
          return action(...args);
        }
        handleRestrictedAction();
      };
    },
    [canPerformAction, handleRestrictedAction]
  );

  return {
    canPerformAction,
    isReadOnly,
    gatedAction,
    handleRestrictedAction,
  };
};
