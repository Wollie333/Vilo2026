/**
 * PaymentStatusBanner Component Types
 */

import type { PaymentStatus, PaymentMethod } from '@/types/booking.types';

export interface PaymentStatusBannerProps {
  /**
   * Current payment status
   */
  paymentStatus: PaymentStatus;

  /**
   * Payment method used
   */
  paymentMethod?: PaymentMethod;

  /**
   * Booking ID for actions
   */
  bookingId: string;

  /**
   * Balance remaining to be paid
   */
  balanceRemaining?: number;

  /**
   * Currency code
   */
  currency?: string;

  /**
   * Whether payment proof is uploaded (for EFT)
   */
  hasUploadedProof?: boolean;

  /**
   * Rejection reason (if payment was rejected)
   */
  rejectionReason?: string;

  /**
   * When checkout failed (for failed_checkout status)
   */
  failedCheckoutAt?: string;

  /**
   * Whether to show action buttons
   */
  showActions?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Whether the banner is visible (for toggle functionality)
   */
  isVisible?: boolean;

  /**
   * Callback when visibility is toggled
   */
  onToggleVisibility?: () => void;
}
