/**
 * PaymentProofBadge Types
 *
 * Badge component for displaying EFT payment proof verification status
 */

export type PaymentProofStatus = 'pending' | 'verified' | 'rejected' | 'none';

export interface PaymentProofBadgeProps {
  /** Current status of payment proof */
  status: PaymentProofStatus;
  /** Compact mode - shows icon only */
  compact?: boolean;
  /** Optional uploaded timestamp */
  uploadedAt?: string | null;
  /** Optional verified timestamp */
  verifiedAt?: string | null;
  /** Optional rejection reason */
  rejectionReason?: string | null;
  /** Additional CSS classes */
  className?: string;
}
