/**
 * Payment Rules & Automation Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const paymentRulesContent: FeaturePageContent = {
  metadata: {
    title: 'Payment Rules & Automation - Stop Chasing Payments | Vilo',
    description: 'Stop spending 12 hours per week chasing payments. Automated deposit rules, installment plans, and payment reminders that run on autopilot. R 5M+ processed monthly.',
    slug: 'payment-rules',
  },

  hero: {
    featureName: 'Payment Rules & Automation',
    headline: 'Stop Chasing Payments. Automate Everything.',
    subheadline: 'Automated payment rules collect deposits, send reminders, and trigger installments on autopilot. Never manually chase payments again.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: 'R 5M+ automated monthly • 99.2% on-time payments • 12 hours saved weekly',
    illustration: (
      <DashboardIllustration
        title="Payment Rules"
        subtitle="Automate your payment collection"
      >
        {/* Payment Rules List */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">50% Deposit on Booking</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Trigger: Immediately upon booking confirmation</div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Amount</div>
                <div className="font-medium text-gray-900 dark:text-white">50% of total</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Due</div>
                <div className="font-medium text-gray-900 dark:text-white">Immediately</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Applied to</div>
                <div className="font-medium text-gray-900 dark:text-white">All bookings</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Remaining Balance</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Trigger: 7 days before check-in</div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Amount</div>
                <div className="font-medium text-gray-900 dark:text-white">Remaining 50%</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Due</div>
                <div className="font-medium text-gray-900 dark:text-white">7 days before</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Reminders</div>
                <div className="font-medium text-gray-900 dark:text-white">Auto-send</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Extended Stay Installments</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Trigger: Bookings longer than 14 nights</div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                Conditional
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Amount</div>
                <div className="font-medium text-gray-900 dark:text-white">25% each week</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Frequency</div>
                <div className="font-medium text-gray-900 dark:text-white">Weekly</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Applied to</div>
                <div className="font-medium text-gray-900 dark:text-white">14+ night stays</div>
              </div>
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Chasing payments is stealing your time',
      subtitle: '12 hours per week sending reminders. Mistakes cost you money and reviews.',
      painPoints: [
        'WhatsApp every morning. "Hi Sarah, R 2,250 deposit due tomorrow." 15 messages daily. Entire morning gone.',
        'Guest ignores reminder. You forget follow-up. 7 days later they cancel. Lost R 4,500. No escalation.',
        'Excel tracking. 50% deposits vs full amounts. Make mistake. Double-charge guest. Angry review.',
        'Competitor offers 3 installments. You can\'t track multiple schedules. Lose R 6,000 booking.',
        '45 peak season bookings. 3 hours daily. Payment reminders. Check who paid. Create invoices. Drowning.',
        'Guest pays late. No system flags it. They check in. Haven\'t paid balance. Awkward conversation.',
      ],
    },
    solution: {
      before: 'WhatsApp reminders. Manual tracking. Excel errors. No escalation. No installments. 12 hours weekly. Drowning in admin.',
      after: 'Set rules once. 50% now. 50% 7 days before. Auto-reminders. Auto-tracking. Installment plans. Done.',
    },
  },

  keyFeatures: {
    title: 'Flexible Payment Automation',
    features: [
      {
        icon: 'percentage',
        name: 'Deposit Rules',
        description: 'Require 25%, 50%, or custom deposit percentages due immediately or within X days',
      },
      {
        icon: 'calendar',
        name: 'Date-Based Triggers',
        description: 'Schedule payments based on booking date, check-in date, or custom timeframes',
      },
      {
        icon: 'split',
        name: 'Installment Plans',
        description: 'Split payments into 2, 3, or 4 installments with automatic due date calculation',
      },
      {
        icon: 'condition',
        name: 'Conditional Rules',
        description: 'Apply different rules based on booking length, property type, or guest category',
      },
      {
        icon: 'bell',
        name: 'Auto Reminders',
        description: 'Send payment reminders 7, 3, and 1 day before due dates automatically',
      },
      {
        icon: 'link',
        name: 'Payment Links',
        description: 'Guests receive secure payment links via email with one-click checkout',
      },
      {
        icon: 'shield',
        name: 'Late Payment Handling',
        description: 'Automatically escalate overdue payments or cancel unpaid bookings after X days',
      },
      {
        icon: 'stack',
        name: 'Multi-Property Rules',
        description: 'Set different payment rules for each property or apply global defaults',
      },
    ],
  },

  benefits: {
    title: 'Join Hosts Who Saved 12 Hours Per Week Chasing Payments',
    stats: [
      {
        value: '12 Hours',
        label: 'Saved Per Week',
        description: 'Stop manually sending WhatsApp payment reminders and tracking deposits in spreadsheets',
      },
      {
        value: '99.2%',
        label: 'On-Time Payments',
        description: 'Automated 7-day, 3-day, and 1-day reminders ensure guests never forget to pay',
      },
      {
        value: '40% More',
        label: 'Bookings Converted',
        description: 'Offer flexible installment plans that close high-value bookings competitors can\'t',
      },
    ],
    testimonial: {
      quote: 'I was spending 12-15 hours every single week manually sending payment reminders to guests via WhatsApp. "Hi Sarah, your deposit is due tomorrow." I\'d send 15-20 of these messages every day and it consumed my entire morning. I also had to manually track who paid what in an Excel spreadsheet. I made mistakes twice and double-charged guests, leading to angry reviews. During peak season with 45 active bookings, I was drowning in payment admin work. I set up Vilo\'s automated payment rules — 50% deposit due immediately, 50% due 7 days before check-in. The system sends automatic reminders at 7 days, 3 days, and 1 day before due dates. Guests get payment links and pay with one click. I went from spending 12 hours per week to literally zero time on payment reminders. My on-time payment rate went from 76% to 99.2%. In 9 months I\'ve saved over 400 hours. I can finally focus on hosting instead of being a collections agent.',
      author: 'Michael Chen',
      business: 'Owner of Garden Route Getaways (6 properties, 22 rooms)',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Stop Chasing Payments Forever?',
    subtext: 'Join hosts who saved 12+ hours per week with automated payment rules. See exactly how it works in a personalized 15-minute demo.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
