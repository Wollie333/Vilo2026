/**
 * PaymentProofActions Component Types
 */

export interface PaymentProofActionsProps {
  /**
   * Booking ID
   */
  bookingId: string;

  /**
   * Current payment status
   */
  paymentStatus: string;

  /**
   * Whether proof has been verified
   */
  isVerified: boolean;

  /**
   * Whether the current user can verify (is property owner)
   */
  canVerify: boolean;

  /**
   * Callback when verification is successful
   */
  onVerificationSuccess?: () => void;

  /**
   * Callback when verification fails
   */
  onVerificationError?: (error: string) => void;

  /**
   * Optional CSS class name
   */
  className?: string;
}
