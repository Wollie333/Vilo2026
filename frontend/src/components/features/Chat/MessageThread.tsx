/**
 * MessageThread Component
 * Scrollable message list with load-more and date dividers
 */

import { useRef, useEffect, useCallback } from 'react';
import { Spinner } from '@/components/ui';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage } from '@/types/chat.types';

interface MessageThreadProps {
  messages: ChatMessage[];
  currentUserId: string;
  typingUsers?: Array<{ user_id: string; full_name: string }>;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

// Group messages by date
function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';

  messages.forEach((message) => {
    const messageDate = new Date(message.created_at).toLocaleDateString();
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groups.push({ date: messageDate, messages: [message] });
    } else {
      groups[groups.length - 1].messages.push(message);
    }
  });

  return groups;
}

// Format date for divider display
function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

// Check if messages should be grouped (same sender, within 2 minutes)
function shouldGroupMessages(current: ChatMessage, previous: ChatMessage | null): boolean {
  if (!previous) return false;
  if (current.sender_id !== previous.sender_id) return false;

  const timeDiff =
    new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
  return timeDiff < 2 * 60 * 1000; // 2 minutes
}

export function MessageThread({
  messages,
  currentUserId,
  typingUsers = [],
  hasMore = false,
  isLoading = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // New message added
      const isOwnMessage =
        messages.length > 0 && messages[messages.length - 1].sender_id === currentUserId;

      if (isOwnMessage) {
        // Always scroll for own messages
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Only scroll if already near bottom
        const container = containerRef.current;
        if (container) {
          const { scrollHeight, scrollTop, clientHeight } = container;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
          if (isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, currentUserId]);

  // Intersection observer for infinite scroll (load more)
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: containerRef.current,
      rootMargin: '100px',
      threshold: 0,
    });

    if (topRef.current) {
      observer.observe(topRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-2">
      {/* Load more trigger */}
      <div ref={topRef} className="h-1" />

      {/* Loading indicator at top */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" />
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            Loading messages...
          </span>
        </div>
      )}

      {/* Message groups by date */}
      {messageGroups.map((group) => (
        <div key={group.date}>
          {/* Date divider */}
          <div className="flex items-center justify-center py-4">
            <div className="flex-1 border-t border-gray-200 dark:border-dark-border" />
            <span className="px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {formatDateDivider(group.date)}
            </span>
            <div className="flex-1 border-t border-gray-200 dark:border-dark-border" />
          </div>

          {/* Messages */}
          {group.messages.map((message, index) => {
            const previousMessage = index > 0 ? group.messages[index - 1] : null;
            const isGrouped = shouldGroupMessages(message, previousMessage);
            const isOwn = message.sender_id === currentUserId;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                isGrouped={isGrouped}
                showAvatar={!isOwn}
                onReply={() => onReply?.(message)}
                onEdit={isOwn ? () => onEdit?.(message) : undefined}
                onDelete={isOwn ? () => onDelete?.(message) : undefined}
                onReact={(emoji) => onReact?.(message.id, emoji)}
              />
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}

      {/* Bottom anchor for scrolling */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
