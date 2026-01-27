/**
 * UnifiedChatPage
 * Unified interface for all messaging features:
 * - Conversations (Guest & Team Chat)
 * - Support Tickets
 * - WhatsApp Settings
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Card } from '@/components/ui';

// Tab type
type ChatTab = 'conversations' | 'support' | 'whatsapp';

// Icons
const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SupportIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-0.297-0.149-1.758-0.867-2.03-0.967-0.273-0.099-0.471-0.148-0.67 0.15-0.197 0.297-0.767 0.966-0.941 1.164-0.173 0.199-0.347 0.223-0.644 0.075-0.297-0.15-1.255-0.463-2.39-1.475-0.883-0.788-1.48-1.761-1.653-2.059-0.173-0.297-0.018-0.458 0.13-0.606 0.134-0.133 0.298-0.347 0.446-0.521 0.149-0.173 0.198-0.297 0.298-0.497 0.099-0.198 0.05-0.371-0.025-0.52-0.075-0.149-0.669-1.612-0.916-2.207-0.242-0.579-0.487-0.5-0.669-0.51-0.173-0.008-0.371-0.01-0.57-0.01-0.198 0-0.52 0.074-0.792 0.372-0.272 0.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074 0.149 0.198 2.096 3.2 5.077 4.487 0.709 0.306 1.262 0.489 1.694 0.625 0.712 0.227 1.36 0.195 1.871 0.118 0.571-0.085 1.758-0.719 2.006-1.413 0.248-0.694 0.248-1.289 0.173-1.413-0.074-0.124-0.272-0.198-0.57-0.347m-5.421 7.403h-0.004a9.87 9.87 0 01-5.031-1.378l-0.361-0.214-3.741 0.982 0.998-3.648-0.235-0.374a9.86 9.86 0 01-1.51-5.26c0.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-0.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 0.16 5.335 0.157 11.892c0 2.096 0.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h0.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366" />
  </svg>
);

export function UnifiedChatPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL
  const getActiveTabFromPath = (): ChatTab => {
    if (location.pathname.startsWith('/chat/support')) return 'support';
    if (location.pathname.startsWith('/chat/whatsapp')) return 'whatsapp';
    return 'conversations';
  };

  const [activeTab, setActiveTab] = useState<ChatTab>(getActiveTabFromPath());

  const handleTabChange = (tab: ChatTab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'conversations':
        navigate('/chat');
        break;
      case 'support':
        navigate('/chat/support');
        break;
      case 'whatsapp':
        navigate('/chat/whatsapp');
        break;
    }
  };

  const tabs = [
    {
      id: 'conversations' as ChatTab,
      label: 'Conversations',
      icon: <ChatIcon />,
      description: 'Guest inquiries and team chat',
    },
    {
      id: 'support' as ChatTab,
      label: 'Support Tickets',
      icon: <SupportIcon />,
      description: 'Get help from Vilo support team',
    },
    {
      id: 'whatsapp' as ChatTab,
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      description: 'Configure WhatsApp templates',
    },
  ];

  return (
    <AuthenticatedLayout
      title="Messages & Support"
      subtitle="Manage all your communications in one place"
    >
      {/* Tab Navigation */}
      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${
                    activeTab === tab.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      flex-shrink-0 p-2 rounded-lg
                      ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-dark-bg-secondary text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    {tab.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`
                        text-base font-semibold mb-1
                        ${
                          activeTab === tab.id
                            ? 'text-primary'
                            : 'text-gray-900 dark:text-white'
                        }
                      `}
                    >
                      {tab.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tab.description}
                    </p>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Content will be rendered by nested routes */}
        <div className="text-center py-12 text-gray-500">
          {activeTab === 'conversations' && (
            <div>
              <p className="mb-4">Select a tab to view conversations, support tickets, or WhatsApp settings.</p>
              <button
                onClick={() => navigate('/chat/conversations')}
                className="text-primary hover:underline"
              >
                Go to Conversations →
              </button>
            </div>
          )}
          {activeTab === 'support' && (
            <div>
              <p className="mb-4">View and manage support tickets.</p>
              <button
                onClick={() => navigate('/chat/support')}
                className="text-primary hover:underline"
              >
                View Support Tickets →
              </button>
            </div>
          )}
          {activeTab === 'whatsapp' && (
            <div>
              <p className="mb-4">Configure WhatsApp message templates.</p>
              <button
                onClick={() => navigate('/chat/whatsapp')}
                className="text-primary hover:underline"
              >
                Configure WhatsApp →
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
