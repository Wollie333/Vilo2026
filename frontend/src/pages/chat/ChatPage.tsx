/**
 * ChatPage
 * Main chat page with conversation list and message thread
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChatConversations, useChatMessages } from '@/context/ChatContext';
import { AuthenticatedLayout } from '@/components/layout';
import {
  ChatLayout,
  ConversationList,
  MessageThread,
  ChatInput,
  ChatHeader,
  ChatEmpty,
} from '@/components/features/Chat';
import { Modal, Input, Select, Button, Spinner } from '@/components/ui';
import type { Conversation, ChatMessage, ConversationType } from '@/types/chat.types';

// New Conversation Modal
interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title?: string; type: ConversationType; participant_user_ids: string[] }) => void;
}

function NewConversationModal({ isOpen, onClose, onSubmit }: NewConversationModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ConversationType>('guest_inquiry');
  const [participantEmail, setParticipantEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In real implementation, you'd look up user by email
      await onSubmit({
        title: title || undefined,
        type,
        participant_user_ids: [], // Would be populated from email lookup
      });
      onClose();
      setTitle('');
      setParticipantEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Conversation" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter conversation title"
        />

        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as ConversationType)}
          options={[
            { value: 'guest_inquiry', label: 'Guest Inquiry' },
            { value: 'team', label: 'Team Chat' },
            { value: 'support', label: 'Support' },
          ]}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Participant Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <Input
              type="email"
              value={participantEmail}
              onChange={(e) => setParticipantEmail(e.target.value)}
              placeholder="Enter participant's email"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || !participantEmail}>
            {isSubmitting ? <Spinner size="sm" /> : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    conversations,
    isLoading: isLoadingConversations,
    fetchConversations,
    createConversation,
  } = useChatConversations();

  const {
    messages,
    typingUsers,
    isLoading: isLoadingMessages,
    fetchMessages,
    fetchMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    setTyping,
  } = useChatMessages(conversationId || null);

  const [isMobileContentOpen, setIsMobileContentOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      setIsMobileContentOpen(true);
    }
  }, [conversationId, fetchMessages]);

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === conversationId) || null;

  // Handlers
  const handleSelectConversation = useCallback(
    (conversation: Conversation) => {
      navigate(`/chat/${conversation.id}`);
    },
    [navigate]
  );

  const handleBack = useCallback(() => {
    setIsMobileContentOpen(false);
    navigate('/chat');
  }, [navigate]);

  const handleNewConversation = useCallback(
    async (data: { title?: string; type: ConversationType; participant_user_ids: string[] }) => {
      const newConversation = await createConversation(data);
      if (newConversation) {
        navigate(`/chat/${newConversation.id}`);
      }
    },
    [createConversation, navigate]
  );

  const handleSendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!conversationId) return;

      if (editingMessage) {
        await editMessage(editingMessage.id, content);
        setEditingMessage(null);
      } else {
        await sendMessage({
          conversation_id: conversationId,
          content,
          reply_to_id: replyTo?.id,
          attachments,
        });
        setReplyTo(null);
      }
    },
    [conversationId, editingMessage, replyTo, sendMessage, editMessage]
  );

  const handleTyping = useCallback(() => {
    if (conversationId) {
      setTyping(true);
    }
  }, [conversationId, setTyping]);

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message);
    setEditingMessage(null);
  }, []);

  const handleEdit = useCallback((message: ChatMessage) => {
    setEditingMessage(message);
    setReplyTo(null);
  }, []);

  const handleDelete = useCallback(
    async (message: ChatMessage) => {
      if (confirm('Are you sure you want to delete this message?')) {
        await deleteMessage(message.id);
      }
    },
    [deleteMessage]
  );

  const handleReact = useCallback(
    async (messageId: string, emoji: string) => {
      await addReaction(messageId, emoji);
    },
    [addReaction]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Filter conversations by search
  const filteredConversations = searchQuery
    ? conversations.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.participants.some((p) =>
            p.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : conversations;

  // Sidebar content
  const sidebar = (
    <ConversationList
      conversations={filteredConversations}
      activeId={conversationId || null}
      onSelect={handleSelectConversation}
      onSearch={handleSearch}
      onNewConversation={() => setShowNewModal(true)}
      isLoading={isLoadingConversations}
    />
  );

  // Main content
  const content = activeConversation ? (
    <div className="flex flex-col h-full">
      <ChatHeader
        conversation={activeConversation}
        onBack={handleBack}
        showBackButton={isMobileContentOpen}
      />

      {isLoadingMessages && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : messages.length === 0 ? (
        <ChatEmpty type="no-messages" />
      ) : (
        <MessageThread
          messages={messages}
          currentUserId={user?.id || ''}
          typingUsers={typingUsers.map((t) => ({ user_id: t.user_id, full_name: t.user_name }))}
          isLoading={isLoadingMessages}
          onLoadMore={() => fetchMoreMessages('')}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReact={handleReact}
        />
      )}

      <ChatInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
      />
    </div>
  ) : (
    <ChatEmpty type="no-conversation" onNewConversation={() => setShowNewModal(true)} />
  );

  return (
    <AuthenticatedLayout title="Chat">
      <ChatLayout sidebar={sidebar} content={content} isMobileContentOpen={isMobileContentOpen} />

      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleNewConversation}
      />
    </AuthenticatedLayout>
  );
}
