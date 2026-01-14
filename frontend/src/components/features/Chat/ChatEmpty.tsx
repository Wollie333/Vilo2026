/**
 * ChatEmpty Component
 * Empty states for chat (no conversation selected, no messages)
 */

import { Button } from '@/components/ui';

interface ChatEmptyProps {
  type: 'no-conversation' | 'no-messages';
  onNewConversation?: () => void;
}

const ChatIcon = () => (
  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const InboxIcon = () => (
  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

export function ChatEmpty({ type, onNewConversation }: ChatEmptyProps) {
  if (type === 'no-conversation') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-gray-300 dark:text-gray-600 mb-4">
          <ChatIcon />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Select a conversation
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
          Choose a conversation from the list to start chatting, or start a new one.
        </p>
        {onNewConversation && (
          <Button variant="primary" onClick={onNewConversation}>
            Start New Conversation
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="text-gray-300 dark:text-gray-600 mb-4">
        <InboxIcon />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No messages yet</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        Send a message to start the conversation.
      </p>
    </div>
  );
}
