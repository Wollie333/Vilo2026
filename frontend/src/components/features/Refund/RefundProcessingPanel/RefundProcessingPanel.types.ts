/**
 * RefundProcessingPanel Component Types
 */

import type { RefundRequest, RefundBreakdownItem } from '@/types/refund.types';
import type { BookingPayment } from '@/types/booking.types';

export interface RefundProcessingPanelProps {
  /**
   * The refund request
   */
  refund: RefundRequest;

  /**
   * Payment methods used for the booking
   */
  paymentMethods: BookingPayment[];

  /**
   * Handler to process a specific payment method
   */
  onProcess: (methodId: string) => Promise<void>;

  /**
   * Optional loading state for specific method
   */
  processingMethodId?: string | null;
}
