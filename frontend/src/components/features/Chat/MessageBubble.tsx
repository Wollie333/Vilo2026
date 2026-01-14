/**
 * MessageBubble Component
 * Individual message bubble with actions
 */

import { useState } from 'react';
import { Avatar, Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from '@/components/ui';
import type { ChatMessage } from '@/types/chat.types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  isGrouped?: boolean;
  showAvatar?: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
}

const MoreIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
    />
  </svg>
);

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageBubble({
  message,
  isOwn,
  isGrouped = false,
  showAvatar = true,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group reactions by emoji
  const groupedReactions = message.reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    },
    {} as Record<string, typeof message.reactions>
  );

  return (
    <div
      className={`
        group flex gap-2
        ${isOwn ? 'flex-row-reverse' : 'flex-row'}
        ${isGrouped ? 'mt-0.5' : 'mt-3'}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && !isGrouped ? (
        <Avatar
          src={message.sender.avatar_url ?? undefined}
          name={message.sender.full_name}
          size="sm"
          className="flex-shrink-0 mt-1"
        />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Sender name (for non-own, non-grouped messages) */}
        {!isOwn && !isGrouped && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 ml-1">
            {message.sender.full_name}
          </span>
        )}

        {/* Bubble */}
        <div className="relative flex items-end gap-1">
          <div
            className={`
              px-3 py-2 rounded-2xl text-sm
              ${
                isOwn
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-dark-card text-gray-900 dark:text-white rounded-bl-md'
              }
              ${message.is_deleted ? 'italic opacity-50' : ''}
            `}
          >
            {message.is_deleted ? (
              <span className="text-gray-500">This message was deleted</span>
            ) : (
              <>
                {/* Reply preview */}
                {message.reply_to && (
                  <div
                    className={`
                      text-xs mb-1 pb-1 border-b
                      ${isOwn ? 'border-white/30' : 'border-gray-300 dark:border-dark-border'}
                    `}
                  >
                    <span className="opacity-70">
                      Replying to {message.reply_to.sender.full_name}
                    </span>
                  </div>
                )}

                {/* Content */}
                <p className="whitespace-pre-wrap break-words">{message.content}</p>

                {/* Attachments */}
                {message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                          flex items-center gap-2 text-xs underline
                          ${isOwn ? 'text-white/80' : 'text-primary'}
                        `}
                      >
                        📎 {attachment.file_name}
                      </a>
                    ))}
                  </div>
                )}

                {/* Edited indicator */}
                {message.is_edited && (
                  <span className="text-2xs opacity-60 ml-1">(edited)</span>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          {showActions && !message.is_deleted && (
            <div
              className={`
                absolute top-0 flex items-center gap-1
                ${isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'}
              `}
            >
              {/* Quick reactions */}
              <div className="flex items-center bg-white dark:bg-dark-card rounded-full shadow-md border border-gray-200 dark:border-dark-border px-1">
                {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onReact?.(emoji)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* More actions */}
              <Dropdown>
                <DropdownTrigger asChild>
                  <button className="p-1.5 bg-white dark:bg-dark-card rounded-full shadow-md border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border">
                    <MoreIcon />
                  </button>
                </DropdownTrigger>
                <DropdownContent align={isOwn ? 'end' : 'start'}>
                  <DropdownItem onClick={onReply}>Reply</DropdownItem>
                  {isOwn && <DropdownItem onClick={onEdit}>Edit</DropdownItem>}
                  {isOwn && (
                    <DropdownItem onClick={onDelete} destructive>
                      Delete
                    </DropdownItem>
                  )}
                </DropdownContent>
              </Dropdown>
            </div>
          )}
        </div>

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(emoji)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 dark:bg-dark-card rounded-full text-xs hover:bg-gray-200 dark:hover:bg-dark-border"
                title={reactions.map((r) => r.user.full_name).join(', ')}
              >
                <span>{emoji}</span>
                <span className="text-gray-600 dark:text-gray-400">{reactions.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Time */}
        {!isGrouped && (
          <span className="text-2xs text-gray-400 dark:text-gray-500 mt-0.5 mx-1">
            {formatTime(message.created_at)}
            {message.status === 'sending' && ' · Sending...'}
            {message.status === 'failed' && ' · Failed'}
          </span>
        )}
      </div>
    </div>
  );
}
