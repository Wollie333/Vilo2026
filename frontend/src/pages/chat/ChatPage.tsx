/**
 * ChatPage
 * Main chat page with conversation list and message thread
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChatConversations, useChatMessages } from '@/context/ChatContext';
import {
  ChatLayout,
  ConversationList,
  MessageThread,
  ChatInput,
  ChatHeader,
  ChatEmpty,
  WhatsAppReplyInput,
} from '@/components/features/Chat';
import { Modal, Input, Select, Button, Spinner } from '@/components/ui';
import { chatService } from '@/services/chat.service';
import { supportService } from '@/services/support.service';
import { promotionsService } from '@/services/promotions.service';
import { propertyService } from '@/services/property.service';
import type { Conversation, ChatMessage, ConversationType } from '@/types/chat.types';
import type { TicketPriority, TicketCategory } from '@/types/support.types';

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

// New Ticket Modal
interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subject: string;
    description: string;
    priority: TicketPriority;
    category: TicketCategory;
  }) => Promise<void>;
}

function NewTicketModal({ isOpen, onClose, onSubmit }: NewTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ subject, description, priority, category });
      onClose();
      setSubject('');
      setDescription('');
      setPriority('normal');
      setCategory('general');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Support Ticket" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of the issue"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the issue..."
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            options={[
              { value: 'general', label: 'General' },
              { value: 'technical', label: 'Technical' },
              { value: 'billing', label: 'Billing' },
              { value: 'feature_request', label: 'Feature Request' },
              { value: 'bug_report', label: 'Bug Report' },
            ]}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || !subject.trim() || !description.trim()}
          >
            {isSubmitting ? <Spinner size="sm" /> : 'Create Ticket'}
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
    archiveConversation,
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
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSendingPromo, setIsSendingPromo] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showCloseTicketModal, setShowCloseTicketModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Debug: Log conversations when they change
  useEffect(() => {
    console.log('[CHAT PAGE] Conversations updated:', conversations.length, 'conversations');
    if (conversations.length > 0) {
      console.log('[CHAT PAGE] Conversation IDs:', conversations.map(c => ({ id: c.id, type: c.type, title: c.title })));
    }
  }, [conversations]);

  // Fetch messages and mark as read when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      setIsMobileContentOpen(true);

      // Mark conversation as read (call service directly to avoid infinite loop)
      chatService.markAsRead(conversationId).catch(console.error);
    }
  }, [conversationId, fetchMessages]);

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === conversationId) || null;

  // Debug: Log active conversation state
  useEffect(() => {
    if (conversationId) {
      console.log('[CHAT PAGE] Looking for conversation:', conversationId);
      console.log('[CHAT PAGE] Active conversation found:', activeConversation ? 'YES' : 'NO');
      if (!activeConversation && conversations.length > 0) {
        console.log('[CHAT PAGE] Available conversation IDs:', conversations.map(c => c.id));
      }
    }
  }, [conversationId, activeConversation, conversations]);

  // Handlers
  const handleSelectConversation = useCallback(
    (conversation: Conversation) => {
      navigate(`/manage/chat/conversations/${conversation.id}`);
    },
    [navigate]
  );

  const handleBack = useCallback(() => {
    setIsMobileContentOpen(false);
    navigate('/manage/chat/conversations');
  }, [navigate]);

  const handleNewConversation = useCallback(
    async (data: { title?: string; type: ConversationType; participant_user_ids: string[] }) => {
      const newConversation = await createConversation(data);
      if (newConversation) {
        navigate(`/manage/chat/conversations/${newConversation.id}`);
      }
    },
    [createConversation, navigate]
  );

  const handleNewTicket = useCallback(
    async (data: {
      subject: string;
      description: string;
      priority: TicketPriority;
      category: TicketCategory;
    }) => {
      try {
        const ticket = await supportService.createTicket({
          subject: data.subject,
          initial_message: data.description,
          priority: data.priority,
          category: data.category,
        });

        console.log('[NEW TICKET] Created ticket:', ticket);
        console.log('[NEW TICKET] Conversation ID:', ticket.conversation_id);

        // Navigate directly - the page will fetch the conversation when it loads
        const targetPath = `/manage/chat/conversations/${ticket.conversation_id}`;
        console.log('[NEW TICKET] Navigating to:', targetPath);
        navigate(targetPath);
      } catch (error) {
        console.error('[NEW TICKET] Failed to create ticket:', error);
        throw error;
      }
    },
    [navigate]
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

  const handleDelete = useCallback((message: ChatMessage) => {
    setMessageToDelete(message);
  }, []);

  const confirmDeleteMessage = useCallback(async () => {
    if (!messageToDelete) return;

    try {
      await deleteMessage(messageToDelete.id);
      setMessageToDelete(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    }
  }, [messageToDelete, deleteMessage]);

  const handleReact = useCallback(
    async (messageId: string, emoji: string) => {
      await addReaction(messageId, emoji);
    },
    [addReaction]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleArchive = useCallback(() => {
    setShowArchiveModal(true);
  }, []);

  const confirmArchive = useCallback(async () => {
    if (!conversationId) return;

    try {
      await archiveConversation(conversationId);
      setShowArchiveModal(false);

      // Navigate back to conversation list
      navigate('/manage/chat/conversations');
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      alert('Failed to archive conversation. Please try again.');
    }
  }, [conversationId, archiveConversation, navigate]);

  const handleCloseTicket = useCallback(() => {
    setShowCloseTicketModal(true);
  }, []);

  const confirmCloseTicket = useCallback(async () => {
    if (!activeConversation?.support_ticket) return;

    try {
      await supportService.closeTicket(activeConversation.support_ticket.id, true);
      setShowCloseTicketModal(false);

      // Refresh conversations to update status
      await fetchConversations();

      // Navigate back to conversation list
      navigate('/manage/chat/conversations');
    } catch (error) {
      console.error('Failed to close ticket:', error);
      alert('Failed to close ticket. Please try again.');
    }
  }, [activeConversation, fetchConversations, navigate]);

  const handleSendPromoCode = useCallback(async () => {
    console.log('[SEND PROMO] Button clicked');

    if (!activeConversation || !conversationId) {
      console.error('[SEND PROMO] No active conversation or conversation ID');
      return;
    }

    console.log('[SEND PROMO] Conversation:', {
      id: conversationId,
      title: activeConversation.title,
      property_id: activeConversation.property_id,
    });

    // Check if this is a promo claim conversation (title starts with "Promo Claim: ")
    if (!activeConversation.title?.startsWith('Promo Claim: ')) {
      console.error('[SEND PROMO] Not a promo claim conversation. Title:', activeConversation.title);
      alert('This is not a promo claim conversation.');
      return;
    }

    // Extract promotion name from title (format: "Promo Claim: {promo_name}")
    const promoName = activeConversation.title.replace('Promo Claim: ', '');
    console.log('[SEND PROMO] Extracted promo name:', promoName);

    if (!promoName || !activeConversation.property_id) {
      console.error('[SEND PROMO] Missing data:', {
        promoName,
        property_id: activeConversation.property_id,
      });
      alert('Could not extract promo name or property ID.');
      return;
    }

    // Show loading modal
    setIsSendingPromo(true);

    try {
      console.log('[SEND PROMO] Fetching promotions for property:', activeConversation.property_id);

      // Fetch all promotions for this property and find the matching one
      const allPromos = await promotionsService.listAllPromotions(activeConversation.property_id);
      console.log('[SEND PROMO] Found promotions:', allPromos.length);

      const promo = allPromos.find(p => p.name === promoName);
      console.log('[SEND PROMO] Matching promo:', promo);

      if (!promo) {
        console.error('[SEND PROMO] Promo not found. Available:', allPromos.map(p => p.name));
        setIsSendingPromo(false);
        alert('Could not find the promotion. It may have been deleted.');
        return;
      }

      // Fetch room assignments for this promotion
      console.log('[SEND PROMO] Fetching room assignments...');
      let roomAssignments = [];
      try {
        roomAssignments = await promotionsService.getPromotionAssignments(promo.id);
        console.log('[SEND PROMO] Room assignments:', roomAssignments);
      } catch (error) {
        console.warn('[SEND PROMO] Failed to fetch room assignments:', error);
        // Continue without room assignments - promo may be property-wide
      }

      // Fetch property details to get slug for booking URL
      console.log('[SEND PROMO] Fetching property details...');
      const property = await propertyService.getProperty(activeConversation.property_id);
      console.log('[SEND PROMO] Property:', property);

      // Create template message
      const discountText =
        promo.discount_type === 'percentage'
          ? `${promo.discount_value}% OFF`
          : promo.discount_type === 'fixed_amount'
          ? `$${promo.discount_value} OFF`
          : `${promo.discount_value} Free Nights`;

      // Format room names (if any)
      const roomsText = Array.isArray(roomAssignments) && roomAssignments.length > 0
        ? `\n**Applicable Rooms:** ${roomAssignments.map(r => r.room_name).join(', ')}`
        : '';

      // Construct booking link using property slug - direct to checkout
      const bookingUrl = `${window.location.origin}/accommodation/${property.slug}/book`;

      const message = `Thank you for your interest! Here's your exclusive promo code:

**Promo Code:** ${promo.code}

**How to use:**
1. Click the booking link below to start your reservation
2. Select your dates and room
3. Enter the promo code at checkout
4. Enjoy your discount!

**Discount:** ${discountText}${roomsText}${
        promo.valid_until
          ? `\n**Valid until:** ${new Date(promo.valid_until).toLocaleDateString()}`
          : ''
      }${promo.min_nights ? `\n**Minimum stay:** ${promo.min_nights} nights` : ''}

**Book Now:** ${bookingUrl}

Looking forward to hosting you!`;

      console.log('[SEND PROMO] Sending message...');

      // Send message
      await sendMessage({
        conversation_id: conversationId,
        content: message,
      });

      console.log('[SEND PROMO] Message sent successfully!');
      setIsSendingPromo(false);
    } catch (error) {
      console.error('[SEND PROMO] Failed to send promo code:', error);
      setIsSendingPromo(false);
      alert('Failed to send promo code. Please try again.');
    }
  }, [activeConversation, conversationId, sendMessage]);

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
      currentUserId={user?.id}
      onSearch={handleSearch}
      onNewConversation={() => setShowNewModal(true)}
      onNewTicket={() => setShowNewTicketModal(true)}
      isLoading={isLoadingConversations}
    />
  );

  // Main content
  const content = activeConversation ? (
    <div className="flex flex-col h-full">
      <ChatHeader
        conversation={activeConversation}
        currentUserId={user?.id}
        onBack={handleBack}
        onArchive={handleArchive}
        onCloseTicket={handleCloseTicket}
        onSendPromoCode={handleSendPromoCode}
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

      {/* Conditional input based on conversation type */}
      {activeConversation.guest_phone_number ? (
        <WhatsAppReplyInput
          conversationId={activeConversation.id}
          recipientPhone={activeConversation.guest_phone_number}
          onSent={() => {
            // Refresh messages after sending
            fetchMessages(activeConversation.id);
          }}
        />
      ) : (
        <ChatInput
          onSend={handleSendMessage}
          onTyping={handleTyping}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
        />
      )}
    </div>
  ) : (
    <ChatEmpty type="no-conversation" onNewConversation={() => setShowNewModal(true)} />
  );

  return (
    <>
      <ChatLayout sidebar={sidebar} content={content} isMobileContentOpen={isMobileContentOpen} />

      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleNewConversation}
      />

      <NewTicketModal
        isOpen={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        onSubmit={handleNewTicket}
      />

      {/* Loading modal for sending promo code */}
      <Modal
        isOpen={isSendingPromo}
        onClose={() => {}} // Don't allow closing while sending
        title="Sending Promo Code"
        size="sm"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
            We are sending the promo code...
            <br />
            One moment please.
          </p>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Archive Conversation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to archive this conversation? You can view it later in the Archived tab.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowArchiveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmArchive}>
              Archive
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close Ticket Confirmation Modal */}
      <Modal
        isOpen={showCloseTicketModal}
        onClose={() => setShowCloseTicketModal(false)}
        title="Close Support Ticket"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to close this support ticket? This will also archive the conversation.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCloseTicketModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmCloseTicket}>
              Close Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Message Confirmation Modal */}
      <Modal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        title="Delete Message"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setMessageToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmDeleteMessage}
              className="!bg-red-600 hover:!bg-red-700 !text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
