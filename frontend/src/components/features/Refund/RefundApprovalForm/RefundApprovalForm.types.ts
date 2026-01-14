/**
 * RefundApprovalForm Component Types
 */

import type { RefundRequest } from '@/types/refund.types';
import type { Booking } from '@/types/booking.types';

export interface RefundApprovalFormProps {
  /**
   * The refund request to approve/reject
   */
  refund: RefundRequest;

  /**
   * Associated booking
   */
  booking: Booking;

  /**
   * Form mode
   */
  mode: 'approve' | 'reject';

  /**
   * Submit handler
   */
  onSubmit: (data: RefundApprovalData) => Promise<void>;

  /**
   * Cancel handler
   */
  onCancel: () => void;
}

export interface RefundApprovalData {
  /**
   * Approved amount (only for approve mode)
   */
  approvedAmount?: number;

  /**
   * Rejection reason (only for reject mode)
   */
  rejectionReason?: string;

  /**
   * Internal admin notes
   */
  internalNotes?: string;

  /**
   * Customer-facing notes
   */
  customerNotes?: string;

  /**
   * Whether to notify the guest
   */
  notifyGuest: boolean;
}
