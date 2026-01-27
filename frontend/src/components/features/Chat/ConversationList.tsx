/**
 * ConversationList Component
 * Sidebar list of conversations with search and filters
 */

import { useState } from 'react';
import { Input, Button, Spinner } from '@/components/ui';
import { ConversationItem } from './ConversationItem';
import type { Conversation, ConversationListParams, ConversationType } from '@/types/chat.types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conversation: Conversation) => void;
  currentUserId?: string;
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: ConversationListParams) => void;
  onNewConversation?: () => void;
  onNewTicket?: () => void;
  isLoading?: boolean;
}

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  currentUserId,
  onSearch,
  onFilterChange,
  onNewConversation,
  onNewTicket,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ConversationType | 'all' | 'archived'>('all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterChange = (filter: ConversationType | 'all' | 'archived') => {
    setActiveFilter(filter);

    if (filter === 'archived') {
      onFilterChange?.({ archived: true });
    } else {
      onFilterChange?.({
        type: filter === 'all' ? undefined : filter,
        archived: false,
      });
    }
  };

  const filteredConversations =
    activeFilter === 'archived'
      ? conversations.filter((c) => c.is_archived)
      : activeFilter === 'all'
        ? conversations.filter((c) => !c.is_archived)
        : conversations.filter((c) => c.type === activeFilter && !c.is_archived);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
          <div className="flex gap-2">
            {onNewTicket && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNewTicket}
                leftIcon={<PlusIcon />}
                title="Create a new support ticket"
              >
                New Ticket
              </Button>
            )}
            {onNewConversation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewConversation}
                leftIcon={<PlusIcon />}
                title="Start a new conversation"
              >
                New Chat
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            leftIcon={<SearchIcon />}
            size="sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3 flex-wrap">
          {(['all', 'guest_inquiry', 'team', 'support', 'archived'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`
                px-3 py-1 text-xs font-medium rounded-full transition-colors
                ${
                  activeFilter === filter
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-card dark:text-gray-400 dark:hover:bg-dark-border'
                }
              `}
            >
              {filter === 'all'
                ? 'All'
                : filter === 'guest_inquiry'
                  ? 'Guests'
                  : filter === 'team'
                    ? 'Team'
                    : filter === 'support'
                      ? 'Support'
                      : 'Archived'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner size="md" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No conversations found</p>
            {onNewConversation && (
              <Button variant="ghost" size="sm" onClick={onNewConversation} className="mt-2 text-primary">
                Start a new conversation
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeId}
                onClick={() => onSelect(conversation)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
