/**
 * Guest Portal Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const guestPortalContent: FeaturePageContent = {
  metadata: {
    title: 'Guest Portal',
    description: 'Branded portal for guests to view bookings, make payments, and chat',
    slug: 'guest-portal',
  },

  hero: {
    headline: 'Give Guests a Branded Self-Service Portal',
    subheadline: 'Your guests get a personalized portal to view bookings, make payments, download invoices, and message you — all branded with your logo',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: '10,000+ guests using portals daily',
    illustration: (
      <DashboardIllustration
        title="Guest Portal"
        subtitle="Welcome back, Sarah!"
      >
        {/* Guest Portal View */}
        <div className="space-y-4">
          {/* Upcoming booking card */}
          <div className="bg-gradient-to-br from-primary/10 to-teal-500/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Upcoming Stay</div>
                <div className="font-bold text-gray-900 dark:text-white">Ocean View Villa</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cape Town, South Africa</div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-primary text-white">
                Confirmed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">Check-in</div>
                <div className="font-medium text-gray-900 dark:text-white">Jan 22, 2026</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">Check-out</div>
                <div className="font-medium text-gray-900 dark:text-white">Jan 25, 2026</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-primary/20">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Paid</div>
                <div className="font-bold text-primary">R 3,600</div>
              </div>
              <button className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg">
                View Details
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white dark:bg-dark-card rounded-lg p-3 border border-gray-200 dark:border-dark-border text-left hover:border-primary transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">Message Host</div>
              <div className="text-[10px] text-gray-500">1 unread</div>
            </button>

            <button className="bg-white dark:bg-dark-card rounded-lg p-3 border border-gray-200 dark:border-dark-border text-left hover:border-primary transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">Download Invoice</div>
              <div className="text-[10px] text-gray-500">PDF ready</div>
            </button>
          </div>

          {/* Payment status */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Payment Status</div>
              <span className="text-xs text-green-600">Fully Paid</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Deposit (50%)</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">R 1,800</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Final Payment</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">R 1,800</span>
              </div>
            </div>
          </div>

          {/* Property info */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Check-in Instructions</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Self check-in available from 2:00 PM. The key safe code is 1234. WiFi password: OceanView2026
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Guests Bombarding You with Basic Questions',
      painPoints: [
        'Answering the same questions repeatedly: "What\'s my check-in time?" "Where\'s my invoice?"',
        'Guests losing booking confirmation emails and asking for details',
        'No centralized place for guests to view their booking information',
        'Payment links sent via email that guests can\'t find later',
      ],
    },
    solution: {
      before: 'Responding to 20+ guest messages per day asking for booking details, invoices, payment links, and check-in instructions',
      after: 'Guests have 24/7 access to all their booking info, invoices, payment options, and messages in one branded portal',
    },
  },

  keyFeatures: {
    title: 'Self-Service for Guests, Peace for You',
    features: [
      {
        icon: 'brand',
        name: 'Custom Branding',
        description: 'Add your logo, colors, and business name to create a professional branded experience',
      },
      {
        icon: 'booking',
        name: 'Booking Overview',
        description: 'Guests see all their bookings (past, current, upcoming) in one dashboard',
      },
      {
        icon: 'payment',
        name: 'Payment Management',
        description: 'View payment history, make outstanding payments, and download receipts',
      },
      {
        icon: 'invoice',
        name: 'Invoice Downloads',
        description: 'Download invoices and receipts as PDFs anytime without asking you',
      },
      {
        icon: 'chat',
        name: 'Direct Messaging',
        description: 'Message you directly from the portal with conversation history saved',
      },
      {
        icon: 'info',
        name: 'Property Information',
        description: 'Check-in instructions, WiFi passwords, house rules, and local recommendations',
      },
      {
        icon: 'calendar',
        name: 'Booking Modifications',
        description: 'Request date changes, add-ons, or cancellations directly through the portal',
      },
      {
        icon: 'mobile',
        name: 'Mobile Responsive',
        description: 'Works perfectly on phones, tablets, and desktops for guests on the go',
      },
    ],
  },

  benefits: {
    title: 'Happier Guests, Less Support Work',
    stats: [
      {
        value: '70% Fewer',
        label: 'Support Messages',
        description: 'Guests find answers themselves instead of asking you',
      },
      {
        value: '24/7',
        label: 'Self-Service',
        description: 'Guests access info anytime without waiting for your response',
      },
      {
        value: '4.9/5',
        label: 'Guest Rating',
        description: 'Professional portal increases perceived property quality',
      },
    ],
    testimonial: {
      quote: 'I used to get 30 messages a day asking "What\'s my booking number?" or "Can you send my invoice again?". Now guests log into their portal and find everything themselves. I save 2 hours every single day.',
      author: 'Lerato Moloi',
      business: 'Sandton Executive Suites',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Give Guests a Professional Experience?',
    subtext: 'Start your 14-day free trial today. No credit card required. Set up your branded guest portal in under 10 minutes.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
