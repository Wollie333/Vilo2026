/**
 * PendingUpgradeNotification Component Types
 *
 * Banner notification shown when admin has requested an upgrade for the user
 */

export interface PendingUpgradeNotificationProps {
  /** The pending upgrade request data */
  upgradeRequest: {
    id: string;
    requested_by_admin: {
      id: string;
      full_name: string;
    };
    target_plan: {
      id: string;
      name: string;
      display_name: string;
      pricing_tiers: {
        monthly?: { price_cents: number };
        annual?: { price_cents: number };
      };
    };
    current_plan: {
      id: string;
      name: string;
      display_name: string;
      current_price_cents: number;
    };
    admin_notes: string | null;
    expires_at: string;
    requested_at: string;
  };
  /** Callback when user accepts the upgrade */
  onAccept: (requestId: string) => void;
  /** Callback when user declines the upgrade */
  onDecline: (requestId: string) => void;
  /** Callback when user dismisses the banner */
  onDismiss: () => void;
}
