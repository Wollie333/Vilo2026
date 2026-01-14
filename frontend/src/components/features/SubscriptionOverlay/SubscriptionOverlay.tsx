import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useSubscription } from '@/context/SubscriptionContext';

const LockIcon = () => (
  <svg
    className="w-12 h-12 text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

/**
 * Full-page overlay that blocks dashboard access for users without active subscription.
 * Shows a blurred background with a centered payment CTA.
 * User can dismiss to browse in read-only mode.
 */
export const SubscriptionOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { accessStatus, isLoading, overlayDismissed, dismissOverlay } = useSubscription();

  // Don't show while loading
  if (isLoading) return null;

  // Don't show if user has full access
  if (!accessStatus || accessStatus.hasFullAccess) return null;

  // Only show for readonly mode (no subscription, expired trial, etc.)
  if (accessStatus.accessMode !== 'readonly') return null;

  // Don't show if user dismissed to browse in read-only mode
  if (overlayDismissed) return null;

  const getMessage = () => {
    switch (accessStatus.subscriptionStatus) {
      case 'trial':
        return 'Your trial has expired. Subscribe now to continue using all features.';
      case 'expired':
        return 'Your subscription has expired. Renew now to regain access.';
      case 'past_due':
        return 'Your payment is past due. Please update your payment method.';
      case 'cancelled':
        return 'Your subscription has ended. Subscribe again to unlock all features.';
      default:
        return 'Subscribe to unlock all features and start managing your properties.';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-white/60 dark:bg-gray-900/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Content Card */}
      <div className="relative z-10 max-w-md w-full mx-4 p-8 bg-white dark:bg-dark-card rounded-lg shadow-2xl border border-gray-200 dark:border-dark-border text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
          <LockIcon />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Subscription Required
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {getMessage()}
        </p>

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/pricing')}
          >
            View Plans & Subscribe
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate('/checkout')}
          >
            Complete Payment
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={dismissOverlay}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2"
          >
            Browse in read-only mode
          </button>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            You can explore the dashboard but won't be able to make changes
          </p>
        </div>
      </div>
    </div>
  );
};
