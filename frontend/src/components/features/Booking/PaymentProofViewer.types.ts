/**
 * PaymentProofViewer Component Types
 */

export interface PaymentProofViewerProps {
  /**
   * URL of the payment proof file
   */
  proofUrl: string;

  /**
   * File name
   */
  fileName?: string;

  /**
   * Upload timestamp
   */
  uploadedAt?: string;

  /**
   * Whether proof has been verified
   */
  isVerified?: boolean;

  /**
   * Verification timestamp
   */
  verifiedAt?: string;

  /**
   * Who verified the proof
   */
  verifiedBy?: string;

  /**
   * Rejection reason (if rejected)
   */
  rejectionReason?: string;

  /**
   * Show full screen viewer
   */
  allowFullScreen?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}
