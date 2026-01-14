/**
 * Refund Management Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const refundManagementContent: FeaturePageContent = {
  metadata: {
    title: 'Refund Management',
    description: 'Handle refunds, cancellations, and credit notes with full audit trail',
    slug: 'refund-management',
  },

  hero: {
    headline: 'Handle Refunds and Cancellations with Confidence',
    subheadline: 'Process full and partial refunds, issue credit notes, and track every cancellation with a complete audit trail',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: 'Processing 500+ refunds monthly with full transparency',
    illustration: (
      <DashboardIllustration
        title="Refund Manager"
        subtitle="Track all cancellations and refunds"
      >
        {/* Refund List */}
        <div className="space-y-4">
          {/* Pending refund */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">BK-2026-087 • David Brown</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Requested Jan 10, 2026</div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                Pending Review
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Original Amount</div>
                <div className="font-medium text-gray-900 dark:text-white">R 4,200</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Refund Amount</div>
                <div className="font-medium text-orange-600">R 3,150</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Policy</div>
                <div className="font-medium text-gray-900 dark:text-white">Moderate</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Reason: Family emergency, cannot travel
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg">
                Approve Refund
              </button>
              <button className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
                Request More Info
              </button>
            </div>
          </div>

          {/* Processed refund */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">BK-2026-062 • Lisa Adams</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Processed Jan 9, 2026</div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Completed
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-2">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Original Amount</div>
                <div className="font-medium text-gray-900 dark:text-white">R 3,600</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Refunded</div>
                <div className="font-medium text-green-600">R 3,240</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Deduction</div>
                <div className="font-medium text-gray-600">R 360 (10%)</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Reason: COVID-19 travel restrictions • Credit note issued
            </div>
          </div>

          {/* Rejected cancellation */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">BK-2026-051 • John Smith</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Rejected Jan 8, 2026</div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                Non-Refundable
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-2">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Original Amount</div>
                <div className="font-medium text-gray-900 dark:text-white">R 5,400</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Refund Amount</div>
                <div className="font-medium text-red-600">R 0</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Policy</div>
                <div className="font-medium text-gray-900 dark:text-white">Strict</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Cancellation within 48 hours of check-in • No refund per policy
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Refund Disputes Drain Time and Damage Reputation',
      painPoints: [
        'Manual calculations for partial refunds based on cancellation policies',
        'No paper trail for who approved refunds and when',
        'Guests disputing refund amounts with no documentation',
        'Processing refunds through multiple payment platforms manually',
      ],
    },
    solution: {
      before: 'Calculating refunds in a spreadsheet, manually initiating refunds in payment gateways, and losing hours to guest disputes',
      after: 'Automatic refund calculations based on your policies, one-click processing, and complete audit trails that prevent disputes',
    },
  },

  keyFeatures: {
    title: 'Complete Refund Control',
    features: [
      {
        icon: 'calculator',
        name: 'Policy-Based Calculations',
        description: 'Automatically calculate refund amounts based on your flexible, moderate, or strict policies',
      },
      {
        icon: 'split',
        name: 'Partial Refunds',
        description: 'Issue partial refunds for shortened stays, late cancellations, or policy deductions',
      },
      {
        icon: 'document',
        name: 'Credit Notes',
        description: 'Generate credit notes for future bookings instead of cash refunds',
      },
      {
        icon: 'clock',
        name: 'Refund Timeline',
        description: 'See full cancellation and refund timeline with timestamps and status updates',
      },
      {
        icon: 'audit',
        name: 'Complete Audit Trail',
        description: 'Track who requested, approved, and processed every refund with full history',
      },
      {
        icon: 'gateway',
        name: 'Multi-Gateway Processing',
        description: 'Process refunds to original payment method via Paystack, Stripe, or PayPal',
      },
      {
        icon: 'chat',
        name: 'Guest Communication',
        description: 'Send refund confirmation emails with breakdown and expected timeline',
      },
      {
        icon: 'reports',
        name: 'Refund Analytics',
        description: 'Track refund rates, reasons, and amounts to identify booking patterns',
      },
    ],
  },

  benefits: {
    title: 'Fair Refunds, Happy Guests',
    stats: [
      {
        value: '85% Faster',
        label: 'Refund Processing',
        description: 'Process refunds in 2 minutes instead of 30 minutes per request',
      },
      {
        value: 'Zero',
        label: 'Payment Disputes',
        description: 'Complete audit trails eliminate he-said-she-said refund disputes',
      },
      {
        value: '4.8/5',
        label: 'Guest Satisfaction',
        description: 'Fast, transparent refunds maintain high guest satisfaction ratings',
      },
    ],
    testimonial: {
      quote: 'Refunds used to be my biggest headache. Now Vilo calculates everything based on my policies, I can approve with one click, and the audit trail prevents any disputes. Game changer.',
      author: 'Sipho Khumalo',
      business: 'Garden Route Escapes',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Streamline Your Refund Process?',
    subtext: 'Start your 14-day free trial today. No credit card required. Set up your cancellation policies in under 5 minutes.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
