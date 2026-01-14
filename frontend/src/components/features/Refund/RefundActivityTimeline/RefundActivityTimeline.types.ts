// ============================================================================
// RefundActivityTimeline Component Types
// ============================================================================

import type { RefundActivity } from '@/types/refund.types';

export interface RefundActivityTimelineProps {
  refundId: string;
}

export interface ActivityItemProps {
  activity: RefundActivity;
  isFirst: boolean;
}
