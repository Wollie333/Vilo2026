// ============================================================================
// Subscription Access Status Types (for paywall/read-only mode)
// ============================================================================

import type { SubscriptionStatus } from './billing.types';

export type AccessMode = 'full' | 'readonly';

export interface SubscriptionAccessStatus {
  hasActiveSubscription: boolean;
  hasFullAccess: boolean;
  accessMode: AccessMode;
  subscriptionStatus: SubscriptionStatus | null;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  expiresAt: string | null;
  requiresPayment: boolean;
  message: string;
  // Pending checkout info
  hasPendingCheckout: boolean;
  pendingCheckoutId: string | null;
}

// ============================================================================
// Subscription Context Types
// ============================================================================

export interface SubscriptionContextValue {
  accessStatus: SubscriptionAccessStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshAccess: () => Promise<void>;
  showPaymentModal: boolean;
  openPaymentModal: (actionName?: string) => void;
  closePaymentModal: () => void;
  attemptedAction: string | null;
  overlayDismissed: boolean;
  dismissOverlay: () => void;
  showOverlay: () => void;
}

export interface SubscriptionProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface PaymentRequiredBannerProps {
  message?: string;
  trialDaysRemaining?: number | null;
  checkoutUrl?: string;
  hasPendingCheckout?: boolean;
  supportEmail?: string;
}

export interface PaymentRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string | null;
}

export interface RestrictedButtonProps {
  actionName: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseSubscriptionGateOptions {
  actionName?: string;
}

export interface UseSubscriptionGateReturn {
  canPerformAction: boolean;
  isReadOnly: boolean;
  gatedAction: <T extends (...args: any[]) => any>(
    action: T
  ) => (...args: Parameters<T>) => ReturnType<T> | void;
  handleRestrictedAction: () => void;
}
