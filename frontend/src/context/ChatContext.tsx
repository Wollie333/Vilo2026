/**
 * Chat Context
 * Chat System - Global state management for chat with Supabase Realtime
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { supabase } from '@/config/supabase';
import { chatService } from '@/services/chat.service';
import { useAuth } from './AuthContext';
import type {
  Conversation,
  ChatMessage,
  ConversationListParams,
  CreateConversationData,
  SendMessageData,
  TypingEvent,
  ChatState,
  ChatContextValue,
} from '@/types/chat.types';

// ============================================================================
// Context
// ============================================================================

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface ChatProviderProps {
  children: ReactNode;
}

// ============================================================================
// Provider
// ============================================================================

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingEvent[]>>({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to access latest conversations in callbacks without triggering effects
  const conversationsRef = useRef<Conversation[]>(conversations);

  // Keep ref in sync with state
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // ============================================================================
  // Conversation Operations
  // ============================================================================

  const fetchConversations = useCallback(
    async (params: ConversationListParams = {}) => {
      if (!isAuthenticated) return;

      setIsLoadingConversations(true);
      setError(null);

      try {
        const response = await chatService.getConversations(params);
        setConversations(response.conversations);

        // Calculate total unread
        const unread = response.conversations.reduce(
          (sum, conv) => sum + conv.unread_count,
          0
        );
        setTotalUnreadCount(unread);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch conversations';
        setError(message);
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsLoadingConversations(false);
      }
    },
    [isAuthenticated]
  );

  const createConversation = useCallback(
    async (data: CreateConversationData): Promise<Conversation> => {
      if (!isAuthenticated) throw new Error('Not authenticated');

      try {
        const response = await chatService.createConversation(data);

        // Add to conversations list
        setConversations((prev) => [response.conversation, ...prev]);

        // If there was an initial message, add it
        if (response.message) {
          setMessages((prev) => ({
            ...prev,
            [response.conversation.id]: [response.message!],
          }));
        }

        return response.conversation;
      } catch (err) {
        console.error('Failed to create conversation:', err);
        throw err;
      }
    },
    [isAuthenticated]
  );

  const archiveConversation = useCallback(
    async (id: string) => {
      if (!isAuthenticated) return;

      try {
        await chatService.archiveConversation(id);

        // Remove from active list
        setConversations((prev) => prev.filter((c) => c.id !== id));

        // Clear active if it was archived
        if (activeConversationId === id) {
          setActiveConversationId(null);
        }
      } catch (err) {
        console.error('Failed to archive conversation:', err);
        throw err;
      }
    },
    [isAuthenticated, activeConversationId]
  );

  const setActiveConversation = useCallback(
    (id: string | null) => {
      setActiveConversationId(id);

      // Auto-mark as read when selecting
      if (id && isAuthenticated) {
        chatService.markAsRead(id).catch(console.error);

        // Update local unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
        );

        // Recalculate total
        setTotalUnreadCount((prev) => {
          const conv = conversations.find((c) => c.id === id);
          return Math.max(0, prev - (conv?.unread_count || 0));
        });
      }
    },
    [isAuthenticated, conversations]
  );

  // ============================================================================
  // Message Operations
  // ============================================================================

  const fetchMessages = useCallback(
    async (conversationId: string, before?: string) => {
      if (!isAuthenticated) return;

      setIsLoadingMessages(true);

      try {
        const response = await chatService.getMessages(conversationId, { before });

        setMessages((prev) => {
          const existing = prev[conversationId] || [];

          if (before) {
            // Appending older messages
            return {
              ...prev,
              [conversationId]: [...response.messages, ...existing],
            };
          }

          // Fresh load
          return {
            ...prev,
            [conversationId]: response.messages,
          };
        });
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [isAuthenticated]
  );

  const sendMessage = useCallback(
    async (data: SendMessageData): Promise<ChatMessage> => {
      if (!isAuthenticated || !user) throw new Error('Not authenticated');

      // Optimistic update with temporary message
      const tempId = `temp-${Date.now()}`;
      const tempMessage: ChatMessage = {
        id: tempId,
        conversation_id: data.conversation_id,
        sender_id: user.id,
        content: data.content,
        message_type: 'text',
        reply_to_id: data.reply_to_id || null,
        is_edited: false,
        edited_at: null,
        is_deleted: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: {
          id: user.id,
          full_name: user.full_name || user.email || 'You',
          avatar_url: user.avatar_url || null,
        },
        reply_to: null,
        attachments: [],
        reactions: [],
        status: 'sending',
      };

      // Add to messages
      setMessages((prev) => ({
        ...prev,
        [data.conversation_id]: [...(prev[data.conversation_id] || []), tempMessage],
      }));

      try {
        let message: ChatMessage;

        if (data.attachments && data.attachments.length > 0) {
          message = await chatService.sendMessageWithAttachments(
            data.conversation_id,
            data.content,
            data.attachments,
            data.reply_to_id
          );
        } else {
          message = await chatService.sendMessage(
            data.conversation_id,
            data.content,
            data.reply_to_id
          );
        }

        // Replace temp message with real one
        setMessages((prev) => ({
          ...prev,
          [data.conversation_id]: prev[data.conversation_id].map((m) =>
            m.id === tempId ? { ...message, status: 'sent' } : m
          ),
        }));

        // Update conversation's last message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === data.conversation_id
              ? { ...c, last_message: message, last_message_at: message.created_at }
              : c
          )
        );

        return message;
      } catch (err) {
        // Mark as failed
        setMessages((prev) => ({
          ...prev,
          [data.conversation_id]: prev[data.conversation_id].map((m) =>
            m.id === tempId ? { ...m, status: 'failed' } : m
          ),
        }));
        throw err;
      }
    },
    [isAuthenticated, user]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!isAuthenticated) return;

      try {
        const updated = await chatService.updateMessage(messageId, { content });

        // Update in messages
        setMessages((prev) => {
          const newMessages = { ...prev };
          Object.keys(newMessages).forEach((convId) => {
            newMessages[convId] = newMessages[convId].map((m) =>
              m.id === messageId ? updated : m
            );
          });
          return newMessages;
        });
      } catch (err) {
        console.error('Failed to edit message:', err);
        throw err;
      }
    },
    [isAuthenticated]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!isAuthenticated) return;

      try {
        await chatService.deleteMessage(messageId);

        // Remove from messages
        setMessages((prev) => {
          const newMessages = { ...prev };
          Object.keys(newMessages).forEach((convId) => {
            newMessages[convId] = newMessages[convId].filter((m) => m.id !== messageId);
          });
          return newMessages;
        });
      } catch (err) {
        console.error('Failed to delete message:', err);
        throw err;
      }
    },
    [isAuthenticated]
  );

  // ============================================================================
  // Reaction Operations
  // ============================================================================

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!isAuthenticated) return;

      try {
        const reaction = await chatService.addReaction(messageId, emoji);

        // Update message reactions
        setMessages((prev) => {
          const newMessages = { ...prev };
          Object.keys(newMessages).forEach((convId) => {
            newMessages[convId] = newMessages[convId].map((m) =>
              m.id === messageId
                ? { ...m, reactions: [...m.reactions, reaction] }
                : m
            );
          });
          return newMessages;
        });
      } catch (err) {
        console.error('Failed to add reaction:', err);
        throw err;
      }
    },
    [isAuthenticated]
  );

  const removeReaction = useCallback(
    async (messageId: string, reactionId: string) => {
      if (!isAuthenticated) return;

      try {
        await chatService.removeReaction(messageId, reactionId);

        // Update message reactions
        setMessages((prev) => {
          const newMessages = { ...prev };
          Object.keys(newMessages).forEach((convId) => {
            newMessages[convId] = newMessages[convId].map((m) =>
              m.id === messageId
                ? { ...m, reactions: m.reactions.filter((r) => r.id !== reactionId) }
                : m
            );
          });
          return newMessages;
        });
      } catch (err) {
        console.error('Failed to remove reaction:', err);
        throw err;
      }
    },
    [isAuthenticated]
  );

  // ============================================================================
  // Read Receipts
  // ============================================================================

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated) return;

      try {
        await chatService.markAsRead(conversationId);

        // Update local state
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
        );

        // Recalculate total
        setTotalUnreadCount((prev) => {
          const conv = conversations.find((c) => c.id === conversationId);
          return Math.max(0, prev - (conv?.unread_count || 0));
        });
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    },
    [isAuthenticated, conversations]
  );

  // ============================================================================
  // Typing Indicators
  // ============================================================================

  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!isAuthenticated) return;

      // Fire and forget
      chatService.setTyping(conversationId, isTyping).catch(console.error);
    },
    [isAuthenticated]
  );

  // ============================================================================
  // Search
  // ============================================================================

  const searchMessages = useCallback(
    async (query: string, conversationId?: string): Promise<ChatMessage[]> => {
      if (!isAuthenticated) return [];

      try {
        const response = await chatService.searchMessages({
          q: query,
          conversation_id: conversationId,
        });
        return response.messages;
      } catch (err) {
        console.error('Failed to search messages:', err);
        return [];
      }
    },
    [isAuthenticated]
  );

  // ============================================================================
  // Refresh Unread Count
  // ============================================================================

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const stats = await chatService.getStats();
      setTotalUnreadCount(stats.total_unread);
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
    }
  }, [isAuthenticated]);

  // ============================================================================
  // Initial Fetch & Realtime Subscription
  // ============================================================================

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setConversations([]);
      setMessages({});
      setTotalUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchConversations();

    // Subscribe to realtime updates for messages
    const messagesChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage & { sender_id: string };

          // Skip own messages (already added optimistically)
          if (newMessage.sender_id === user.id) return;

          // Check if we're a participant in this conversation (use ref for latest value)
          const conv = conversationsRef.current.find((c) => c.id === newMessage.conversation_id);
          if (!conv) {
            // Might be a new conversation - refresh list
            fetchConversations();
            return;
          }

          // Fetch full message with relations
          try {
            const response = await chatService.getMessages(newMessage.conversation_id, {
              limit: 1,
            });
            if (response.messages.length > 0) {
              const fullMessage = response.messages[response.messages.length - 1];

              // Add to messages
              setMessages((prev) => ({
                ...prev,
                [newMessage.conversation_id]: [
                  ...(prev[newMessage.conversation_id] || []),
                  fullMessage,
                ],
              }));

              // Update conversation
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === newMessage.conversation_id
                    ? {
                        ...c,
                        last_message: fullMessage,
                        last_message_at: fullMessage.created_at,
                        unread_count:
                          activeConversationId === c.id
                            ? c.unread_count
                            : c.unread_count + 1,
                      }
                    : c
                )
              );

              // Update unread count if not active
              if (activeConversationId !== newMessage.conversation_id) {
                setTotalUnreadCount((prev) => prev + 1);
              }
            }
          } catch (err) {
            console.error('Failed to fetch new message:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;

          // Update in messages
          setMessages((prev) => {
            const newMessages = { ...prev };
            if (newMessages[updatedMessage.conversation_id]) {
              newMessages[updatedMessage.conversation_id] = newMessages[
                updatedMessage.conversation_id
              ].map((m) => (m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m));
            }
            return newMessages;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;

          // Remove from messages
          setMessages((prev) => {
            const newMessages = { ...prev };
            Object.keys(newMessages).forEach((convId) => {
              newMessages[convId] = newMessages[convId].filter((m) => m.id !== deletedId);
            });
            return newMessages;
          });
        }
      )
      .subscribe();

    // Subscribe to typing indicators via broadcast
    const typingChannel = supabase
      .channel('chat-typing')
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const event = payload as TypingEvent;

        if (event.user_id === user.id) return; // Ignore own typing

        setTypingUsers((prev) => {
          const convTyping = prev[event.conversation_id] || [];

          if (event.is_typing) {
            // Add or update typing user
            const exists = convTyping.some((t) => t.user_id === event.user_id);
            if (exists) return prev;

            return {
              ...prev,
              [event.conversation_id]: [...convTyping, event],
            };
          } else {
            // Remove typing user
            return {
              ...prev,
              [event.conversation_id]: convTyping.filter(
                (t) => t.user_id !== event.user_id
              ),
            };
          }
        });

        // Auto-clear after 5 seconds
        setTimeout(() => {
          setTypingUsers((prev) => ({
            ...prev,
            [event.conversation_id]: (prev[event.conversation_id] || []).filter(
              (t) => t.user_id !== event.user_id
            ),
          }));
        }, 5000);
      })
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
    // Note: conversations is accessed in the callback but shouldn't be a dependency
    // Adding it would cause infinite loop since fetchConversations updates it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, fetchConversations, activeConversationId]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const state: ChatState = useMemo(
    () => ({
      conversations,
      activeConversationId,
      messages,
      typingUsers,
      totalUnreadCount,
      isLoadingConversations,
      isLoadingMessages,
      error,
    }),
    [
      conversations,
      activeConversationId,
      messages,
      typingUsers,
      totalUnreadCount,
      isLoadingConversations,
      isLoadingMessages,
      error,
    ]
  );

  const value: ChatContextValue = useMemo(
    () => ({
      ...state,
      fetchConversations,
      createConversation,
      archiveConversation,
      setActiveConversation,
      fetchMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      addReaction,
      removeReaction,
      markConversationAsRead,
      setTyping,
      searchMessages,
      refreshUnreadCount,
    }),
    [
      state,
      fetchConversations,
      createConversation,
      archiveConversation,
      setActiveConversation,
      fetchMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      addReaction,
      removeReaction,
      markConversationAsRead,
      setTyping,
      searchMessages,
      refreshUnreadCount,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// ============================================================================
// Convenience Hooks
// ============================================================================

export const useChatConversations = () => {
  const {
    conversations,
    activeConversationId,
    totalUnreadCount,
    isLoadingConversations,
    fetchConversations,
    createConversation,
    archiveConversation,
    setActiveConversation,
  } = useChat();

  return {
    conversations,
    activeConversationId,
    totalUnreadCount,
    isLoading: isLoadingConversations,
    fetchConversations,
    createConversation,
    archiveConversation,
    setActiveConversation,
  };
};

export const useChatMessages = (conversationId: string | null) => {
  const {
    messages,
    typingUsers,
    isLoadingMessages,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    setTyping,
  } = useChat();

  const conversationMessages = conversationId ? messages[conversationId] || [] : [];
  const conversationTyping = conversationId ? typingUsers[conversationId] || [] : [];

  // Memoize functions to prevent infinite loops
  const stableFetchMessages = useCallback(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  const stableFetchMoreMessages = useCallback((before: string) => {
    if (conversationId) {
      fetchMessages(conversationId, before);
    }
  }, [conversationId, fetchMessages]);

  const stableSetTyping = useCallback((isTyping: boolean) => {
    if (conversationId) {
      setTyping(conversationId, isTyping);
    }
  }, [conversationId, setTyping]);

  return {
    messages: conversationMessages,
    typingUsers: conversationTyping,
    isLoading: isLoadingMessages,
    fetchMessages: stableFetchMessages,
    fetchMoreMessages: stableFetchMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    setTyping: stableSetTyping,
  };
};
