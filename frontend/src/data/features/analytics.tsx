/**
 * Revenue Analytics Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const analyticsContent: FeaturePageContent = {
  metadata: {
    title: 'Revenue Analytics',
    description: 'Track earnings, occupancy rates, and booking trends in real-time',
    slug: 'analytics',
  },

  hero: {
    headline: 'Real-Time Analytics to Grow Your Revenue',
    subheadline: 'Track earnings, occupancy rates, booking trends, and guest demographics with interactive dashboards and exportable reports',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: 'Tracking R 15M+ in booking revenue monthly',
    illustration: (
      <DashboardIllustration
        title="Revenue Analytics"
        subtitle="Your business at a glance"
      >
        {/* Analytics Dashboard */}
        <div className="space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-dark-card rounded-lg p-3 border border-gray-200 dark:border-dark-border">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Revenue</div>
              <div className="text-xl font-bold text-primary">R 142,500</div>
              <div className="text-xs text-green-600 mt-1">↑ 24% vs last month</div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-3 border border-gray-200 dark:border-dark-border">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Occupancy</div>
              <div className="text-xl font-bold text-blue-600">87%</div>
              <div className="text-xs text-green-600 mt-1">↑ 12% vs last month</div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-3 border border-gray-200 dark:border-dark-border">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Booking</div>
              <div className="text-xl font-bold text-purple-600">R 3,158</div>
              <div className="text-xs text-green-600 mt-1">↑ 8% vs last month</div>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">Revenue Trend</div>
              <div className="text-xs text-gray-500">Last 6 months</div>
            </div>
            {/* Simple bar chart */}
            <div className="flex items-end justify-between gap-2 h-24">
              {[65, 72, 58, 85, 92, 100].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-teal-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-[8px] text-gray-500">
                    {['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Property performance */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Top Properties</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <div className="text-gray-900 dark:text-white">Ocean View Villa</div>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">R 58,200</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <div className="text-gray-900 dark:text-white">Mountain Retreat</div>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">R 42,800</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <div className="text-gray-900 dark:text-white">City Apartments</div>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">R 31,500</div>
              </div>
            </div>
          </div>

          {/* Booking sources */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Booking Sources</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">Direct 65%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }} />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">Social 25%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '10%' }} />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">Referral 10%</div>
              </div>
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Flying Blind Without Revenue Insights',
      painPoints: [
        'No clear view of which properties or rooms generate the most revenue',
        'Guessing which months to raise or lower prices',
        'Unable to identify booking trends or seasonal patterns',
        'Manually calculating occupancy rates in spreadsheets',
      ],
    },
    solution: {
      before: 'Downloading transaction reports from multiple platforms and spending hours in Excel calculating revenue and occupancy',
      after: 'Real-time dashboard showing revenue, occupancy, trends, and property performance with zero manual work',
    },
  },

  keyFeatures: {
    title: 'Data-Driven Decision Making',
    features: [
      {
        icon: 'chart',
        name: 'Revenue Dashboard',
        description: 'See total revenue, growth trends, and forecasts in a visual real-time dashboard',
      },
      {
        icon: 'percentage',
        name: 'Occupancy Analytics',
        description: 'Track occupancy rates per property, room type, and time period',
      },
      {
        icon: 'trend',
        name: 'Booking Trends',
        description: 'Identify peak seasons, low periods, and booking lead times to optimize pricing',
      },
      {
        icon: 'compare',
        name: 'Property Comparison',
        description: 'Compare revenue and performance across all properties side-by-side',
      },
      {
        icon: 'guests',
        name: 'Guest Demographics',
        description: 'Understand where your guests come from and what they book most',
      },
      {
        icon: 'source',
        name: 'Booking Source Tracking',
        description: 'See which channels drive the most bookings (direct, social, referrals)',
      },
      {
        icon: 'export',
        name: 'Exportable Reports',
        description: 'Export data to Excel or PDF for accounting, tax filing, or investor reports',
      },
      {
        icon: 'forecast',
        name: 'Revenue Forecasting',
        description: 'Predict future revenue based on confirmed bookings and historical trends',
      },
    ],
  },

  benefits: {
    title: 'Make Smarter Business Decisions',
    stats: [
      {
        value: '32%',
        label: 'Revenue Increase',
        description: 'Data-driven pricing optimization increases annual revenue',
      },
      {
        value: '10 Hours',
        label: 'Saved Per Month',
        description: 'Stop manually building reports in spreadsheets',
      },
      {
        value: '100%',
        label: 'Visibility',
        description: 'See every metric that matters in one real-time dashboard',
      },
    ],
    testimonial: {
      quote: 'I used to guess when to adjust my prices. Now I can see exactly which months are slow, which properties perform best, and where my bookings come from. My revenue is up 32% since I started using data to make decisions.',
      author: 'Nomsa Dlamini',
      business: 'Kruger Gateway Lodges',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Understand Your Business Better?',
    subtext: 'Start your 14-day free trial today. No credit card required. See your first analytics dashboard in under 2 minutes.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
