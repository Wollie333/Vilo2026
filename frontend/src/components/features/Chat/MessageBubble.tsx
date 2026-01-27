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

const WhatsAppIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CheckmarkIcon = ({ double = false, isRead = false }: { double?: boolean; isRead?: boolean }) => (
  <svg
    className={`w-3.5 h-3.5 ${isRead ? 'text-blue-500' : 'text-gray-400'}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {double ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 13l4 4L23 7" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    )}
  </svg>
);

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// Utility function to convert URLs in text to clickable links
const linkifyText = (text: string, isOwn: boolean) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline hover:opacity-80 ${isOwn ? 'text-white' : 'text-primary dark:text-blue-400'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

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

  // Render WhatsApp delivery status
  const renderWhatsAppStatus = () => {
    if (!message.whatsapp_metadata) return null;

    const { status, sent_at, delivered_at, read_at, failure_reason } = message.whatsapp_metadata;

    let statusIcon;
    let tooltipText = '';

    switch (status) {
      case 'sent':
        statusIcon = <CheckmarkIcon />;
        tooltipText = `Sent ${sent_at ? formatTime(sent_at) : ''}`;
        break;
      case 'delivered':
        statusIcon = <CheckmarkIcon double />;
        tooltipText = `Delivered ${delivered_at ? formatTime(delivered_at) : ''}`;
        break;
      case 'read':
        statusIcon = <CheckmarkIcon double isRead />;
        tooltipText = `Read ${read_at ? formatTime(read_at) : ''}`;
        break;
      case 'failed':
        return (
          <span className="text-red-500 text-2xs" title={failure_reason || 'Failed to send'}>
            ⚠ Failed
          </span>
        );
      case 'queued':
        return <span className="text-gray-400 text-2xs">Queued...</span>;
      default:
        return null;
    }

    return (
      <span className="inline-flex items-center" title={tooltipText}>
        {statusIcon}
      </span>
    );
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
                <p className="whitespace-pre-wrap break-words">{linkifyText(message.content, isOwn)}</p>

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

        {/* Time & Status */}
        {!isGrouped && (
          <div className="flex items-center gap-1.5 text-2xs text-gray-400 dark:text-gray-500 mt-0.5 mx-1">
            {/* WhatsApp Channel Indicator */}
            {message.message_channel === 'whatsapp' && (
              <div
                className="flex items-center gap-0.5 text-[#25D366]"
                title="Sent via WhatsApp"
              >
                <WhatsAppIcon />
                <span className="text-2xs">WhatsApp</span>
              </div>
            )}

            {/* Time */}
            <span>{formatTime(message.created_at)}</span>

            {/* Regular status (for non-WhatsApp messages) */}
            {!message.whatsapp_metadata && (
              <>
                {message.status === 'sending' && <span>· Sending...</span>}
                {message.status === 'failed' && <span className="text-red-500">· Failed</span>}
              </>
            )}

            {/* WhatsApp delivery status */}
            {isOwn && message.whatsapp_metadata && (
              <>
                <span>·</span>
                {renderWhatsAppStatus()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
