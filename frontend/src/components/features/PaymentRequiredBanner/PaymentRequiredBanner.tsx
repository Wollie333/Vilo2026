import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import type { PaymentRequiredBannerProps } from './PaymentRequiredBanner.types';

const WarningIcon = () => (
  <svg
    className="w-4 h-4 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-4 h-4 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const PaymentRequiredBanner: React.FC<PaymentRequiredBannerProps> = ({
  message,
  trialDaysRemaining,
  checkoutUrl = '/pricing',
  hasPendingCheckout = false,
  supportEmail = 'support@vilo.app',
  onDismiss,
}) => {
  const navigate = useNavigate();

  // Handle pending checkout - special case
  if (hasPendingCheckout) {
    const pendingMessage = message || 'Your payment is pending. As soon as your payment is approved, your account will be active. We\'ll let you know.';

    return (
      <div
        className="border-b px-4 py-2.5 flex items-center justify-between bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
      >
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <span className="text-blue-500">
            <ClockIcon />
          </span>
          <span>{pendingMessage}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = `mailto:${supportEmail}`}
          >
            Contact Support
          </Button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-400 transition-colors"
              aria-label="Dismiss banner"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Determine message based on trial status
  const displayMessage = message || (
    trialDaysRemaining != null && trialDaysRemaining > 0
      ? `Your trial ends in ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''}. Subscribe now to keep full access.`
      : 'Complete payment to unlock all features'
  );

  // Determine banner style based on urgency
  const isUrgent = trialDaysRemaining != null && trialDaysRemaining <= 3;
  const isTrial = trialDaysRemaining != null && trialDaysRemaining > 0;

  const bannerClasses = isUrgent
    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    : isTrial
    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
    : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';

  const textClasses = isUrgent
    ? 'text-red-700 dark:text-red-300'
    : isTrial
    ? 'text-blue-700 dark:text-blue-300'
    : 'text-amber-700 dark:text-amber-300';

  const iconClasses = isUrgent
    ? 'text-red-500'
    : isTrial
    ? 'text-blue-500'
    : 'text-amber-500';

  return (
    <div
      className={`border-b px-4 py-2.5 flex items-center justify-between ${bannerClasses}`}
    >
      <div className={`flex items-center gap-2 text-sm ${textClasses}`}>
        <span className={iconClasses}>
          <WarningIcon />
        </span>
        <span>{displayMessage}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => navigate(checkoutUrl)}
        >
          Subscribe Now
        </Button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`p-1 rounded transition-colors ${
              isUrgent
                ? 'hover:bg-red-100 dark:hover:bg-red-800/30 text-red-600 dark:text-red-400'
                : isTrial
                ? 'hover:bg-blue-100 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-400'
                : 'hover:bg-amber-100 dark:hover:bg-amber-800/30 text-amber-600 dark:text-amber-400'
            }`}
            aria-label="Dismiss banner"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
};
