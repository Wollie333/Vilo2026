/**
 * Live Chat & Messaging Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const chatContent: FeaturePageContent = {
  metadata: {
    title: 'Live Chat & Messaging',
    description: 'Real-time communication with guests before, during, and after stays',
    slug: 'chat',
  },

  hero: {
    headline: 'Stay Connected with Guests in Real-Time',
    subheadline: 'Built-in messaging system to answer guest questions instantly, send check-in reminders, and provide support throughout their stay',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: '5,000+ conversations happening daily',
    illustration: (
      <DashboardIllustration
        title="Messages"
        subtitle="3 unread conversations"
      >
        {/* Chat Interface */}
        <div className="space-y-3">
          {/* Conversation list */}
          <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
            {/* Active conversation */}
            <div className="flex items-start gap-3 p-3 bg-primary/5 border-l-4 border-primary cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                SJ
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Sarah Johnson</div>
                  <div className="text-xs text-gray-500">2m ago</div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  What time is check-in available?
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">BK-2026-087</span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              </div>
            </div>

            {/* Other conversations */}
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-bg cursor-pointer border-t border-gray-200 dark:border-dark-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                DB
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">David Brown</div>
                  <div className="text-xs text-gray-500">1h ago</div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  Thanks for the quick response!
                </div>
                <div className="text-xs text-gray-500 mt-1">BK-2026-062</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-bg cursor-pointer border-t border-gray-200 dark:border-dark-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                LA
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Lisa Adams</div>
                  <div className="text-xs text-gray-500">3h ago</div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  Can I add an extra night to my booking?
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">BK-2026-051</span>
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Message thread preview */}
          <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-3">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-dark-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                SJ
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm">Sarah Johnson</div>
                <div className="text-xs text-gray-500">Booking #BK-2026-087</div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-2 mb-3">
              {/* Guest message */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-dark-bg rounded-lg p-2 text-xs text-gray-900 dark:text-white inline-block max-w-[85%]">
                    Hi! I\'m arriving on Jan 22nd. What time is check-in available?
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">10:23 AM</div>
                </div>
              </div>

              {/* Your message */}
              <div className="flex gap-2 justify-end">
                <div className="flex-1 text-right">
                  <div className="bg-primary text-white rounded-lg p-2 text-xs inline-block max-w-[85%]">
                    Hi Sarah! Check-in is available from 2:00 PM. I\'ll send you the access code closer to your arrival date. Looking forward to hosting you!
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">10:25 AM</div>
                </div>
              </div>
            </div>

            {/* Message input */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-dark-border">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 text-xs px-2 py-1.5 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded"
                disabled
              />
              <button className="px-2 py-1.5 bg-primary text-white rounded text-xs font-medium">
                Send
              </button>
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Scattered Messages Across Multiple Platforms',
      painPoints: [
        'Juggling WhatsApp, email, SMS, and platform messages from different guests',
        'Missing important guest messages buried in your inbox',
        'No conversation history to reference past discussions',
        'Guests can\'t reach you quickly when they have urgent questions',
      ],
    },
    solution: {
      before: 'Checking 4 different apps and platforms throughout the day to find and respond to guest messages',
      after: 'All guest conversations in one inbox with full history, real-time notifications, and instant responses',
    },
  },

  keyFeatures: {
    title: 'Unified Communication Hub',
    features: [
      {
        icon: 'inbox',
        name: 'Centralized Inbox',
        description: 'All guest messages from all properties in one place with no switching between apps',
      },
      {
        icon: 'realtime',
        name: 'Real-Time Messaging',
        description: 'Instant message delivery and push notifications so you never miss a guest question',
      },
      {
        icon: 'history',
        name: 'Full Conversation History',
        description: 'Every message saved and searchable, linked to the specific booking',
      },
      {
        icon: 'templates',
        name: 'Quick Reply Templates',
        description: 'Save common responses for check-in times, WiFi passwords, directions, etc.',
      },
      {
        icon: 'files',
        name: 'File Sharing',
        description: 'Send photos, PDFs, maps, and documents directly in the chat',
      },
      {
        icon: 'status',
        name: 'Read Receipts',
        description: 'See when guests have read your messages to know they received important info',
      },
      {
        icon: 'automate',
        name: 'Automated Messages',
        description: 'Send automatic check-in reminders, thank you messages, and review requests',
      },
      {
        icon: 'mobile',
        name: 'Mobile App',
        description: 'Respond to guests on the go with iOS and Android apps',
      },
    ],
  },

  benefits: {
    title: 'Faster Responses, Happier Guests',
    stats: [
      {
        value: '5 Minutes',
        label: 'Avg Response Time',
        description: 'Respond to guests 10x faster with all messages in one place',
      },
      {
        value: '100%',
        label: 'Message History',
        description: 'Never lose important conversations or guest requests',
      },
      {
        value: '4.9/5',
        label: 'Communication Rating',
        description: 'Fast responses lead to better reviews and repeat bookings',
      },
    ],
    testimonial: {
      quote: 'Before Vilo, I was constantly switching between WhatsApp, email, and Airbnb messages. Now everything is in one inbox. I respond faster, guests are happier, and I\'m way less stressed.',
      author: 'Zanele Sithole',
      business: 'Durban Beachfront Rentals',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Streamline Guest Communication?',
    subtext: 'Start your 14-day free trial today. No credit card required. Start messaging guests in under 2 minutes.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
