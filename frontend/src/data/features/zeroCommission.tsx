/**
 * Zero Commission Payments Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const zeroCommissionContent: FeaturePageContent = {
  metadata: {
    title: 'Zero Commission Payments',
    description: 'Process payments via Paystack, PayPal, Stripe with 0% Vilo fees',
    slug: 'zero-commission',
  },

  hero: {
    headline: 'Keep 100% of Your Revenue. Zero Commission. Forever.',
    subheadline: 'Connect your own Paystack, PayPal, or Stripe account. Process unlimited payments without Vilo taking a single cent in commissions',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: 'Property owners saved R 2.8M in commissions last year',
    illustration: (
      <DashboardIllustration
        title="Payment Gateway"
        subtitle="Your money, your account"
      >
        {/* Payment Gateway Cards */}
        <div className="space-y-4">
          {/* Revenue Comparison */}
          <div className="bg-gradient-to-r from-primary/10 to-teal-500/10 rounded-lg p-4 border border-primary/20">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Monthly Revenue</div>
            <div className="text-3xl font-bold text-primary mb-1">R 45,000</div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              R 0 in commissions • You keep it all
            </div>
          </div>

          {/* Payment Gateway Status */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-gray-900 dark:text-white">Connected Payment Gateways</div>
              <button className="text-xs text-primary hover:underline">+ Add Gateway</button>
            </div>

            {/* Paystack */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  PS
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Paystack</div>
                  <div className="text-xs text-gray-500">South African payments</div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Connected
              </span>
            </div>

            {/* Stripe */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  ST
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Stripe</div>
                  <div className="text-xs text-gray-500">International payments</div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Connected
              </span>
            </div>

            {/* PayPal */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  PP
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">PayPal</div>
                  <div className="text-xs text-gray-500">Global payments</div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                Not Connected
              </span>
            </div>
          </div>

          {/* Recent Transaction */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Recent Payment</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Booking #BK-2026-045</div>
                <div className="text-xs text-gray-500">Sarah Johnson • Jan 11, 2026</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">R 2,400</div>
                <div className="text-xs text-gray-500">Via Paystack</div>
              </div>
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Platform commissions are stealing 20% of your income',
      subtitle: 'Every month. R 9,000. Gone. Not anymore.',
      painPoints: [
        'R 45,000 revenue. Airbnb takes 15%. That\'s R 6,750. Gone. Every single month.',
        'Booking.com takes 18%. Even more. R 8,100 gone. You did the work. They take the money.',
        'Transaction fees on top. Pay commissions. Then pay more fees. Double hit.',
        'Platform holds funds. Your money. Sitting there. Days. Weeks. Can\'t access it.',
        'Want refund? Need platform approval. Takes days. Guest angry. You can\'t help.',
        'No control. Platform rules. Platform timeline. Platform fees. Your business. Their terms.',
      ],
    },
    solution: {
      before: 'Pay Airbnb R 6,750. Pay Booking.com R 8,100. Wait for payouts. Need platform approval. Not your money.',
      after: 'Keep R 45,000. Your gateway. Direct deposits. Instant refunds. Your control. 100% yours.',
    },
  },

  keyFeatures: {
    title: 'Direct Payments, Zero Middleman',
    features: [
      {
        icon: 'zero',
        name: '0% Vilo Commission',
        description: 'Unlike Airbnb or Booking.com, Vilo never takes a percentage of your bookings',
      },
      {
        icon: 'wallet',
        name: 'Your Payment Gateway',
        description: 'Connect your own Paystack, Stripe, or PayPal account - funds go directly to you',
      },
      {
        icon: 'zap',
        name: 'Instant Deposits',
        description: 'Money hits your bank account based on your gateway settings, not platform holding periods',
      },
      {
        icon: 'globe',
        name: 'Multi-Currency Support',
        description: 'Accept payments in ZAR, USD, EUR, GBP, and 135+ other currencies',
      },
      {
        icon: 'cards',
        name: 'All Payment Methods',
        description: 'Credit cards, debit cards, EFT, mobile money, and local payment methods',
      },
      {
        icon: 'shield',
        name: 'Secure & PCI Compliant',
        description: 'Bank-grade encryption and security with your trusted payment provider',
      },
      {
        icon: 'refund',
        name: 'Direct Refund Control',
        description: 'Issue refunds instantly from your gateway without platform approval delays',
      },
      {
        icon: 'analytics',
        name: 'Real Revenue Analytics',
        description: 'See your actual revenue without commission deductions clouding the numbers',
      },
    ],
  },

  benefits: {
    title: 'More Money in Your Pocket',
    stats: [
      {
        value: '100%',
        label: 'Revenue Retained',
        description: 'Keep every cent of your bookings with zero commission fees',
      },
      {
        value: 'R 108K',
        label: 'Saved Annually',
        description: 'Average property saves on R 45K/month revenue vs 20% platforms',
      },
      {
        value: '24 Hours',
        label: 'Faster Payouts',
        description: 'Money reaches your account based on your gateway, not platform holds',
      },
    ],
    testimonial: {
      quote: 'I was paying Airbnb R 12,000 every month in commissions. With Vilo, that R 12,000 stays in my pocket. Same bookings, same revenue, but I actually keep the money I earn.',
      author: 'James Ndlovu',
      business: 'Joburg City Apartments',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Keep 100% of Your Revenue?',
    subtext: 'Start your 14-day free trial today. No credit card required. Connect your payment gateway in under 5 minutes.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
