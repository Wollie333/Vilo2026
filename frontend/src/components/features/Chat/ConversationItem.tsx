/**
 * ConversationItem Component
 * Single conversation row in the list
 */

import { Avatar, Badge } from '@/components/ui';
import type { Conversation } from '@/types/chat.types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  // Get display name (title, property, or first participant)
  const displayName =
    conversation.title ||
    conversation.property?.name ||
    conversation.participants
      .filter((p) => p.user_id !== conversation.created_by)
      .map((p) => p.user.full_name)
      .join(', ') ||
    'New Conversation';

  // Get avatar info
  const otherParticipant = conversation.participants.find(
    (p) => p.user_id !== conversation.created_by
  );
  const avatarUrl = otherParticipant?.user.avatar_url ?? undefined;
  const avatarName = otherParticipant?.user.full_name || displayName;

  // Format last message time
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Truncate message preview
  const messagePreview = conversation.last_message?.content || 'No messages yet';
  const truncatedPreview =
    messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 p-3 text-left
        transition-colors duration-150
        ${
          isActive
            ? 'bg-primary/10 dark:bg-primary/20'
            : 'hover:bg-gray-50 dark:hover:bg-dark-card'
        }
      `}
    >
      {/* Avatar */}
      <Avatar
        src={avatarUrl}
        name={avatarName}
        size="md"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`
              text-sm truncate
              ${conversation.unread_count > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}
            `}
          >
            {displayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`
              text-xs truncate
              ${conversation.unread_count > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}
            `}
          >
            {truncatedPreview}
          </p>
          {conversation.unread_count > 0 && (
            <Badge variant="primary" size="sm" className="flex-shrink-0">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </Badge>
          )}
        </div>

        {/* Type indicator */}
        {conversation.type !== 'guest_inquiry' && (
          <span className="inline-flex items-center mt-1 text-2xs text-gray-400 dark:text-gray-500">
            {conversation.type === 'team' ? 'Team' : 'Support'}
          </span>
        )}
      </div>
    </button>
  );
}
