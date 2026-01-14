import type { RefundStatus } from '@/types/refund.types';

export interface RefundStatusBadgeProps {
  status: RefundStatus;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}
