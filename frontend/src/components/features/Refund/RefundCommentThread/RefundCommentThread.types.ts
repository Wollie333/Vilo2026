// ============================================================================
// RefundCommentThread Component Types
// ============================================================================

import type { RefundComment } from '@/types/refund.types';

export interface RefundCommentThreadProps {
  refundId: string;
  comments: RefundComment[];
  onCommentAdded: (comment: RefundComment) => void;
  currentUserId: string;
  isAdmin: boolean;
}

export interface CommentBubbleProps {
  comment: RefundComment;
  isOwnComment: boolean;
}
