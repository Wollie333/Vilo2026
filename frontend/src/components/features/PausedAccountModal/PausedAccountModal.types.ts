/**
 * PausedAccountModal Component Types
 *
 * Modal shown when a user's account is paused
 * Non-dismissible modal that requires user action
 */

export interface PausedAccountModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Optional reason for the pause (from admin) */
  pauseReason?: string | null;
  /** Admin who paused the account */
  pausedByAdmin?: { id: string; full_name: string } | null;
  /** Callback when user clicks "Pay Subscription" */
  onPaySubscription: () => void;
  /** Callback when user clicks "Contact Support" */
  onContactSupport: () => void;
}
