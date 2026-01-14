// ============================================================================
// RefundActionModal Component Types
// ============================================================================

import type { RefundRequest } from '@/types/refund.types';

export interface RefundActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  refund: RefundRequest;
  action: 'approve' | 'reject' | 'process';
  onSuccess: () => void;
}

export interface RefundActionFormData {
  approvedAmount: number;
  reason: string;
  customerNotes: string; // Public notes visible to customer
  internalNotes: string; // Private admin-only notes
  refundMethod: 'manual' | 'eft' | 'credit_memo'; // Future: 'paystack' | 'stripe' | 'paypal'
}
