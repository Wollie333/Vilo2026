/**
 * Promotions & Discounts Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const promotionsContent: FeaturePageContent = {
  metadata: {
    title: 'Promotions & Discounts - Fill Empty Dates Automatically | Vilo',
    description: 'Stop watching empty dates on your calendar. Create promo codes, seasonal rates, early bird discounts, and last-minute deals that fill slow periods automatically. R 8M+ promotional revenue last year.',
    slug: 'promotions',
  },

  hero: {
    featureName: 'Promotions & Discounts',
    headline: 'Empty Dates Earn You R 0. Fill Them Automatically.',
    subheadline: 'Automated promo codes, seasonal rates, early bird discounts, and last-minute deals. Fill slow season and maximize revenue.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: 'R 8M+ promotional bookings • 28% higher occupancy • 45% more direct bookings',
    illustration: (
      <DashboardIllustration
        title="Promotions"
        subtitle="Active offers and discounts"
      >
        {/* Promotions List */}
        <div className="space-y-3">
          {/* Active promotion */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-4 border-2 border-green-500/30">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">SUMMER25</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Early Bird Summer Special</div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-500 text-white font-medium">
                Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs mb-3">
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-0.5">Discount</div>
                <div className="font-bold text-green-700 dark:text-green-400 text-lg">25% OFF</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-0.5">Used</div>
                <div className="font-semibold text-gray-900 dark:text-white">12 times</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-0.5">Revenue</div>
                <div className="font-semibold text-gray-900 dark:text-white">R 18,400</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Valid: Dec 1, 2025 - Feb 28, 2026
              </div>
              <button className="text-xs text-green-700 dark:text-green-400 font-medium hover:underline">
                Edit
              </button>
            </div>
          </div>

          {/* Scheduled promotion */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-3 border border-blue-200 dark:border-blue-900/30">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">LASTMIN</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Last Minute Deals</div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                Scheduled
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Discount</div>
                <div className="font-medium text-gray-900 dark:text-white">15% OFF</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Starts</div>
                <div className="font-medium text-gray-900 dark:text-white">Jan 20</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Min Booking</div>
                <div className="font-medium text-gray-900 dark:text-white">2 nights</div>
              </div>
            </div>
          </div>

          {/* Seasonal rate */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-3 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Peak Season Rates</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">December Holiday Premium</div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                Seasonal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Price Increase</div>
                <div className="font-medium text-gray-900 dark:text-white">+40%</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Period</div>
                <div className="font-medium text-gray-900 dark:text-white">Dec 15-31</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Bookings</div>
                <div className="font-medium text-gray-900 dark:text-white">24</div>
              </div>
            </div>
          </div>

          {/* Performance stats */}
          <div className="bg-gradient-to-r from-primary/5 to-teal-500/5 rounded-lg p-3 border border-primary/20">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">This Month\'s Performance</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-lg font-bold text-primary">48</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">Promo bookings</div>
              </div>
              <div>
                <div className="text-lg font-bold text-teal-600">R 42,800</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">Promo revenue</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">92%</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">Occupancy</div>
              </div>
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Empty dates mean lost revenue',
      subtitle: 'Slow season kills your income. You need a filling strategy.',
      painPoints: [
        'January-February. 40% occupancy. R 36,000 lost revenue. Just sitting empty. Earning nothing.',
        'Guest: "Discount for 3 months advance?" You: "No system." They book elsewhere. Lose R 4,500.',
        'Manual WhatsApp discounts. Calculate 15%. Negotiate 20 minutes. Lose booking. Competitor has instant codes.',
        '30% direct bookings. 70% OTA. Pay 15% commission. They have better promo systems. You don\'t.',
        'Last-minute empty dates. Want to discount. No way to communicate fast. Dates stay empty. Earn R 0.',
        'Peak season. Should charge more. Manually adjust. Miss bookings. Leave money on table.',
      ],
    },
    solution: {
      before: 'Watch empty dates. Negotiate manually. 20 minutes per guest. Lose bookings. Pay OTA commission. Miss opportunities.',
      after: 'SUMMER25 code. Auto-fills slow season. Early bird discounts. Last-minute deals. 45% direct bookings. R 84K extra.',
    },
  },

  keyFeatures: {
    title: 'Strategic Pricing Tools',
    features: [
      {
        icon: 'code',
        name: 'Promo Code Generator',
        description: 'Create unlimited codes with percentage or fixed amount discounts',
      },
      {
        icon: 'calendar',
        name: 'Date-Specific Offers',
        description: 'Set promotions for specific date ranges to target slow periods',
      },
      {
        icon: 'early',
        name: 'Early Bird Discounts',
        description: 'Reward guests who book X months in advance with automatic discounts',
      },
      {
        icon: 'lightning',
        name: 'Last-Minute Deals',
        description: 'Auto-discount dates within 7 days to fill empty inventory',
      },
      {
        icon: 'season',
        name: 'Seasonal Pricing',
        description: 'Increase prices during peak season or holidays automatically',
      },
      {
        icon: 'minimum',
        name: 'Minimum Stay Rules',
        description: 'Require 3+ night stays during promotions to maximize revenue',
      },
      {
        icon: 'limit',
        name: 'Usage Limits',
        description: 'Cap promo code usage (50 bookings max, one per guest, etc.)',
      },
      {
        icon: 'analytics',
        name: 'Promotion Analytics',
        description: 'Track which promos drive the most bookings and revenue',
      },
    ],
  },

  benefits: {
    title: 'Join Hosts Who Filled Slow Season and Earned R 84K+ Extra Revenue',
    stats: [
      {
        value: '28%',
        label: 'Higher Occupancy',
        description: 'Strategic promotions fill January-February slow season from 40% to 90% occupancy',
      },
      {
        value: 'R 84K',
        label: 'Extra Revenue',
        description: 'Average property earns from promo-driven bookings that would have stayed empty',
      },
      {
        value: '45%',
        label: 'Direct Bookings',
        description: 'Promo codes drive guests to book direct instead of paying 15% OTA commission',
      },
    ],
    testimonial: {
      quote: 'Every year January and February killed me. I had 20% occupancy and watched R 36,000 in potential revenue disappear because I had no strategy. Just empty rooms earning nothing. I tried manually offering discounts but it was too slow and inconsistent. I set up Vilo\'s "SUMMER25" promo code at 25% off for bookings made 3 months in advance. Within 2 weeks I had 18 early bird bookings for those slow months. I also added automatic last-minute deals for dates within 7 days. My January-February occupancy went from 20% to 88%. That\'s R 31,680 in extra revenue I would have lost. The slight discount is absolutely worth it to avoid empty properties. In my first year with strategic promotions, I earned R 94,000 extra from dates that previously sat empty. Game changer.',
      author: 'Pieter van der Merwe',
      business: 'Owner of Stellenbosch Wine Country Villas (3 properties)',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Stop Watching Empty Dates Earn You R 0?',
    subtext: 'Join hosts who filled slow season and earned R 84K+ in extra revenue. See exactly how Vilo\'s promotions work in a personalized 15-minute demo.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
