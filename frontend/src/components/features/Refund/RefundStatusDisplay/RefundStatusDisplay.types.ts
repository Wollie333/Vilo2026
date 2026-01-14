import type { RefundRequestWithDetails } from '@/types/refund.types';

export interface RefundStatusDisplayProps {
  refundRequest: RefundRequestWithDetails;
  currency?: string;
  className?: string;
}
