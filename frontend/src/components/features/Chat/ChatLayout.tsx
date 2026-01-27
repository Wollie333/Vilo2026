/**
 * ChatLayout Component
 * Split-pane layout for chat (conversation list + message thread)
 */

import { ReactNode } from 'react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
  isMobileContentOpen?: boolean;
}

export function ChatLayout({ sidebar, content, isMobileContentOpen = false }: ChatLayoutProps) {
  return (
    <div className="flex h-[600px] bg-gray-50 dark:bg-dark-bg rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
      {/* Conversation List Sidebar */}
      <div
        className={`
          w-full md:w-80 lg:w-96 flex-shrink-0
          border-r border-gray-200 dark:border-dark-border
          bg-white dark:bg-dark-sidebar
          ${isMobileContentOpen ? 'hidden md:flex' : 'flex'}
          flex-col
        `}
      >
        {sidebar}
      </div>

      {/* Message Thread Content */}
      <div
        className={`
          flex-1 flex flex-col bg-white dark:bg-dark-bg
          ${!isMobileContentOpen ? 'hidden md:flex' : 'flex'}
        `}
      >
        {content}
      </div>
    </div>
  );
}
