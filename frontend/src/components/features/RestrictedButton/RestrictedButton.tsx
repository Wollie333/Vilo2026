import { Button } from '@/components/ui/Button';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import type { RestrictedButtonProps } from './RestrictedButton.types';

const LockIcon = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

/**
 * A Button wrapper that gates actions based on subscription status.
 * If the user doesn't have full access, clicking shows the payment modal.
 *
 * Usage:
 * ```tsx
 * <RestrictedButton
 *   actionName="Create Property"
 *   variant="primary"
 *   onClick={() => navigate('/properties/new')}
 * >
 *   Add Property
 * </RestrictedButton>
 * ```
 */
export const RestrictedButton: React.FC<RestrictedButtonProps> = ({
  actionName,
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  leftIcon,
  rightIcon,
}) => {
  const { canPerformAction, gatedAction } = useSubscriptionGate({ actionName });

  const handleClick = gatedAction(() => {
    onClick?.();
  });

  return (
    <Button
      variant={variant}
      size={size}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      leftIcon={leftIcon}
      rightIcon={!canPerformAction ? <LockIcon /> : rightIcon}
      className={`${className} ${!canPerformAction ? 'opacity-90' : ''}`}
    >
      {children}
    </Button>
  );
};
