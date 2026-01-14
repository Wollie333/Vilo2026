/**
 * PaymentProofUpload Component Types
 */

export interface PaymentProofUploadProps {
  /**
   * Booking ID for the payment proof upload
   */
  bookingId: string;

  /**
   * Callback when upload is successful
   */
  onUploadSuccess?: (data: {
    file_url: string;
    file_name: string;
    payment_status: string;
  }) => void;

  /**
   * Callback when upload fails
   */
  onUploadError?: (error: string) => void;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Disable upload functionality
   */
  disabled?: boolean;

  /**
   * Show upload instructions
   */
  showInstructions?: boolean;
}

export interface UploadedFileInfo {
  file: File;
  preview: string | null;
  name: string;
  size: number;
  type: string;
}
