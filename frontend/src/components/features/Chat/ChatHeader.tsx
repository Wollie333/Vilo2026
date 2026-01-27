/**
 * ChatHeader Component
 * Conversation header with title, participants, and actions
 */

import { useState } from 'react';
import { Avatar, Badge, Button, Modal } from '@/components/ui';
import type { Conversation, ChatParticipant } from '@/types/chat.types';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId?: string;
  onBack?: () => void;
  onArchive?: () => void;
  onCloseTicket?: () => void;
  onViewParticipants?: () => void;
  onSendPromoCode?: () => void;
  showBackButton?: boolean;
}

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
    />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const ArchiveIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
    />
  </svg>
);

function ParticipantsModal({
  isOpen,
  onClose,
  participants,
}: {
  isOpen: boolean;
  onClose: () => void;
  participants: ChatParticipant[];
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Participants" size="sm">
      <div className="space-y-3">
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center gap-3">
            <Avatar
              src={participant.user.avatar_url ?? undefined}
              name={participant.user.full_name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {participant.user.full_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{participant.user.email}</p>
            </div>
            <Badge
              variant={
                participant.role === 'owner'
                  ? 'primary'
                  : participant.role === 'admin'
                    ? 'warning'
                    : 'default'
              }
              size="sm"
            >
              {participant.role}
            </Badge>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function ChatHeader({
  conversation,
  currentUserId,
  onBack,
  onArchive,
  onCloseTicket,
  onSendPromoCode,
  showBackButton = false,
}: ChatHeaderProps) {
  const [showParticipants, setShowParticipants] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Check if conversation is a promo claim (by checking title prefix)
  const isPromoClaim = conversation.title?.startsWith('Promo Claim: ');

  // Get display name
  const displayName =
    conversation.title ||
    conversation.property?.name ||
    conversation.participants.map((p) => p.user.full_name).join(', ') ||
    'New Conversation';

  // Get subtitle based on type
  const getSubtitle = () => {
    switch (conversation.type) {
      case 'guest_inquiry':
        return conversation.property?.name || 'Guest Inquiry';
      case 'team':
        return 'Team Chat';
      case 'support':
        return 'Support';
      default:
        return `${conversation.participants.length} participants`;
    }
  };

  // Get type badge
  const getTypeBadge = () => {
    switch (conversation.type) {
      case 'guest_inquiry':
        return (
          <Badge variant="primary" size="sm">
            Guest
          </Badge>
        );
      case 'team':
        return (
          <Badge variant="info" size="sm">
            Team
          </Badge>
        );
      case 'support':
        return (
          <Badge variant="warning" size="sm">
            Support
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get priority badge for support tickets
  const getPriorityBadge = () => {
    if (conversation.type !== 'support' || !conversation.support_ticket) return null;

    const priority = conversation.support_ticket.priority;
    const priorityConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'error'; icon: string }> = {
      urgent: { variant: 'error', icon: '🔥' },
      high: { variant: 'warning', icon: '⚠️' },
      normal: { variant: 'default', icon: '📋' },
      low: { variant: 'success', icon: '📌' },
    };

    const config = priorityConfig[priority] || priorityConfig.normal;
    return (
      <Badge variant={config.variant} size="sm">
        <span className="mr-1">{config.icon}</span>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  // Get category badge for support tickets
  const getCategoryBadge = () => {
    if (conversation.type !== 'support' || !conversation.support_ticket?.category) return null;

    const category = conversation.support_ticket.category;
    const displayName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <Badge variant="default" size="sm">
        {displayName}
      </Badge>
    );
  };

  // Get avatar display (other participant - not current user)
  const getAvatarInfo = () => {
    if (conversation.participants.length > 0 && currentUserId) {
      // Find the participant who is NOT the current user
      const otherParticipant = conversation.participants.find(
        (p) => p.user_id !== currentUserId
      );
      return {
        src: otherParticipant?.user.avatar_url ?? undefined,
        name: otherParticipant?.user.full_name || displayName,
      };
    }
    // Fallback: if no currentUserId, try using created_by logic
    if (conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(
        (p) => p.user_id !== conversation.created_by
      );
      return {
        src: otherParticipant?.user.avatar_url ?? undefined,
        name: otherParticipant?.user.full_name || displayName,
      };
    }
    return { src: undefined, name: displayName };
  };

  const avatarInfo = getAvatarInfo();

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg">
        {/* Back button (mobile) */}
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 md:hidden"
          >
            <BackIcon />
          </button>
        )}

        {/* Avatar */}
        <Avatar src={avatarInfo.src} name={avatarInfo.name} size="md" />

        {/* Title and subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
            {getTypeBadge()}
            {getPriorityBadge()}
            {getCategoryBadge()}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {conversation.support_ticket?.ticket_number && (
              <span className="font-mono mr-2">#{conversation.support_ticket.ticket_number}</span>
            )}
            {getSubtitle()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Send Promo Code button (only for promo claims) */}
          {isPromoClaim && onSendPromoCode && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSendPromoCode}
              className="!px-3 !py-2"
              title="Send promo code to guest"
            >
              <TagIcon />
              <span className="ml-1.5 hidden sm:inline">Send Promo Code</span>
            </Button>
          )}

          {/* Participants button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(true)}
            className="!p-2"
            title="View participants"
          >
            <UsersIcon />
          </Button>

          {/* More menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="!p-2"
            >
              <MoreIcon />
            </Button>

            {showMenu && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />

                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      setShowParticipants(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border rounded-t-lg"
                  >
                    <UsersIcon />
                    View Participants
                  </button>

                  {/* Close Ticket (only for support conversations) */}
                  {conversation.type === 'support' && onCloseTicket && (
                    <button
                      onClick={() => {
                        onCloseTicket();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-dark-border"
                    >
                      <CheckCircleIcon />
                      Close & Archive Ticket
                    </button>
                  )}

                  {onArchive && (
                    <button
                      onClick={() => {
                        onArchive();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border rounded-b-lg"
                    >
                      <ArchiveIcon />
                      Archive Conversation
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Participants Modal */}
      <ParticipantsModal
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        participants={conversation.participants}
      />
    </>
  );
}
