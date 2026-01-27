export interface PaymentRequiredBannerProps {
  message?: string;
  trialDaysRemaining?: number | null;
  checkoutUrl?: string;
  hasPendingCheckout?: boolean;
  supportEmail?: string;
  onDismiss?: () => void;
}
