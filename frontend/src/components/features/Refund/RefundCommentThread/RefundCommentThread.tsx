import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { refundService } from '@/services/refund.service';
import type { RefundCommentThreadProps, CommentBubbleProps } from './RefundCommentThread.types';

/**
 * RefundCommentThread Component
 *
 * Two-way comment system between users and admins for refund requests.
 * Follows industry best practices with chat-style interface.
 *
 * Features:
 * - Immutable comments (no editing/deletion)
 * - 2000 character limit with counter
 * - Internal notes toggle for admins
 * - Role badges and visual distinction
 * - Mobile-responsive layout
 */
export const RefundCommentThread: React.FC<RefundCommentThreadProps> = ({
  refundId,
  comments,
  onCommentAdded,
  currentUserId,
  isAdmin,
}) => {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    // Validate character limit
    if (newComment.length > 2000) {
      setError('Comment exceeds maximum length of 2000 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const comment = await refundService.addComment(refundId, {
        comment_text: newComment,
        is_internal: isAdmin ? isInternal : false,
      });

      onCommentAdded(comment);
      setNewComment('');
      setIsInternal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remainingChars = 2000 - newComment.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="space-y-4">
      {/* Comment List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No comments yet. Start the conversation below.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              isOwnComment={comment.user_id === currentUserId}
            />
          ))
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border-gray-200 dark:border-dark-border pt-4">
        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment... (Ctrl+Enter to submit)"
          rows={3}
          className="mb-2"
          maxLength={2000}
        />

        {/* Character Counter */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className={isOverLimit ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
              {remainingChars}
            </span>{' '}
            characters remaining
          </div>

          {/* Admin Internal Toggle */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="internal-comment"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300 dark:border-dark-border text-primary focus:ring-primary"
              />
              <label
                htmlFor="internal-comment"
                className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                Internal note (admin only)
              </label>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isOverLimit || isSubmitting}
            isLoading={isSubmitting}
          >
            Post Comment
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * CommentBubble Component
 *
 * Individual comment display with user info and role badges.
 * Own comments appear on right with primary color.
 * Other comments appear on left with neutral styling.
 */
const CommentBubble: React.FC<CommentBubbleProps> = ({ comment, isOwnComment }) => {
  const userName = comment.user
    ? `${comment.user.first_name} ${comment.user.last_name}`
    : 'Unknown User';

  const userRole = comment.user?.user_type || 'guest';
  const isAdminUser = ['admin', 'super_admin'].includes(userRole);

  return (
    <div className={`flex gap-3 ${isOwnComment ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user?.profile_picture_url ? (
          <img
            src={comment.user.profile_picture_url}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
              isAdminUser ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'
            }`}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className={`flex-1 max-w-lg ${isOwnComment ? 'text-right' : ''}`}>
        {/* User Info & Badges */}
        <div className={`flex items-center gap-2 mb-1 ${isOwnComment ? 'justify-end' : ''}`}>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {userName}
          </span>
          {isAdminUser && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
              Admin
            </span>
          )}
          {comment.is_internal && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
              Internal
            </span>
          )}
        </div>

        {/* Comment Bubble */}
        <div
          className={`rounded-lg px-3 py-2 ${
            isOwnComment
              ? 'bg-primary text-white'
              : comment.is_internal
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
              : 'bg-gray-100 dark:bg-dark-hover text-gray-900 dark:text-white'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{comment.comment_text}</p>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};
