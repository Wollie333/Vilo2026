import React from 'react';
import { StatusBadge, StatusType } from '../StatusBadge/StatusBadge';
import type { RefundStatus } from '@/types/refund.types';

export interface RefundStatusBadgeProps {
  status: RefundStatus;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

// Map refund statuses to badge types and labels
const refundStatusConfig: Record<
  RefundStatus,
  { type: StatusType; label: string; icon?: string }
> = {
  requested: {
    type: 'info',
    label: 'Requested',
  },
  under_review: {
    type: 'warning',
    label: 'Under Review',
  },
  approved: {
    type: 'success',
    label: 'Approved',
  },
  rejected: {
    type: 'error',
    label: 'Rejected',
  },
  processing: {
    type: 'pending',
    label: 'Processing',
  },
  completed: {
    type: 'success',
    label: 'Completed',
  },
  failed: {
    type: 'error',
    label: 'Failed',
  },
  withdrawn: {
    type: 'default',
    label: 'Withdrawn',
  },
};

export const RefundStatusBadge: React.FC<RefundStatusBadgeProps> = ({
  status,
  size = 'md',
  dot = false,
  className = '',
}) => {
  const config = refundStatusConfig[status];

  return (
    <StatusBadge status={config.type} size={size} dot={dot} className={className}>
      {config.label}
    </StatusBadge>
  );
};
