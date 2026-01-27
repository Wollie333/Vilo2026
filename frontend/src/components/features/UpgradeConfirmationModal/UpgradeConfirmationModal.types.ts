/**
 * UpgradeConfirmationModal Component Types
 *
 * Modal for user to confirm acceptance of an upgrade request from admin
 */

export interface UpgradeConfirmationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The upgrade request data */
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
      description: string | null;
      pricing_tiers: {
        monthly?: { price_cents: number };
        annual?: { price_cents: number };
      };
      limits: Record<string, any>;
    };
    current_plan: {
      id: string;
      name: string;
      display_name: string;
      current_price_cents: number;
      billing_interval: 'monthly' | 'annual' | 'one_off' | null;
    };
    admin_notes: string | null;
    next_billing_date: string | null;
  };
  /** Callback when user confirms acceptance */
  onConfirm: (requestId: string, userNotes?: string) => Promise<void>;
}
