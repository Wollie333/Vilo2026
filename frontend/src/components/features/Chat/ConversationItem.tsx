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
  currentUserId?: string;
}

const WhatsAppIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function ConversationItem({ conversation, isActive, onClick, currentUserId }: ConversationItemProps) {
  // Get other participant (not current user)
  const otherParticipant = currentUserId
    ? conversation.participants.find((p) => p.user_id !== currentUserId)
    : conversation.participants.find((p) => p.user_id !== conversation.created_by);

  // Get display name - prioritize showing the guest/other person's name
  // For property owners, show the guest they're talking to
  const displayName =
    otherParticipant?.user.full_name ||
    conversation.participants.find((p) => p.user_id !== currentUserId)?.user.full_name ||
    conversation.title ||
    conversation.property?.name ||
    'New Conversation';

  // Get avatar info
  const avatarUrl = otherParticipant?.user.avatar_url ?? undefined;
  const avatarName = otherParticipant?.user.full_name || displayName;

  // Check if conversation is a promo claim (by title prefix)
  const isPromoClaim = conversation.title?.startsWith('Promo Claim: ');
  const isNewLead = isPromoClaim; // All promo claims are new leads

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
          <div className="flex flex-col min-w-0 flex-1">
            <span
              className={`
                text-sm truncate
                ${conversation.unread_count > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}
              `}
            >
              {displayName}
            </span>
            {/* Show property name as subtitle if available and different from display name */}
            {conversation.property?.name && conversation.property.name !== displayName && (
              <span className="text-2xs text-gray-500 dark:text-gray-400 truncate">
                {conversation.property.name}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {/* WhatsApp indicator */}
            {conversation.last_message?.message_channel === 'whatsapp' && (
              <WhatsAppIcon className="w-3 h-3 text-[#25D366] flex-shrink-0" />
            )}
            <p
              className={`
                text-xs truncate
                ${conversation.unread_count > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}
              `}
            >
              {truncatedPreview}
            </p>
          </div>
          {conversation.unread_count > 0 && (
            <Badge variant="primary" size="sm" className="flex-shrink-0">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </Badge>
          )}
        </div>

        {/* Support Ticket Metadata or Type indicator */}
        {conversation.type === 'support' && conversation.support_ticket ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center text-2xs text-gray-400 dark:text-gray-500 font-mono">
              #{conversation.support_ticket.ticket_number}
            </span>
            <Badge
              variant={
                conversation.support_ticket.priority === 'urgent'
                  ? 'error'
                  : conversation.support_ticket.priority === 'high'
                    ? 'warning'
                    : 'default'
              }
              size="sm"
              className="text-2xs"
            >
              {conversation.support_ticket.priority}
            </Badge>
            {conversation.support_ticket.sla_breached && (
              <span className="text-2xs text-red-500">⚠️ SLA</span>
            )}
          </div>
        ) : (isNewLead || isPromoClaim) ? (
          <div className="flex items-center gap-2 mt-1">
            {isNewLead && (
              <Badge variant="info" size="sm" className="text-2xs">
                New Lead
              </Badge>
            )}
            {isPromoClaim && (
              <Badge variant="success" size="sm" className="text-2xs">
                Promo Claim
              </Badge>
            )}
          </div>
        ) : conversation.type !== 'guest_inquiry' && (
          <span className="inline-flex items-center mt-1 text-2xs text-gray-400 dark:text-gray-500">
            {conversation.type === 'team' ? 'Team' : 'Support'}
          </span>
        )}
      </div>
    </button>
  );
}
