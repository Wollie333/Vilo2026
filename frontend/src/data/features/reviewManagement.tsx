/**
 * Review Management Feature Content Configuration
 * Content for the Reviews & Ratings feature page
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration, NotificationToast } from '@/components/features/FeaturePageSections';

export const reviewManagementContent: FeaturePageContent = {
  metadata: {
    title: 'Reviews & Ratings Manager - Build Trust That Converts | Vilo',
    description:
      'Stop losing bookings to properties with more reviews. Automated review collection system with verified stays, photo uploads, and 6-category ratings. 3-4x higher conversion rates.',
    slug: 'reviews',
  },
  hero: {
    featureName: 'Reviews & Ratings Management',
    headline: 'Zero Reviews. Zero Trust. Zero Bookings.',
    subheadline:
      'Automated review collection with verified stays, photo uploads, and 6-category ratings. 87% response rate. 3-4x higher conversions.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: '10,000+ verified reviews • 87% response rate • 3-4x conversions',
    illustration: (
      <DashboardIllustration
        title="Review Manager"
        subtitle="Manage and showcase guest reviews"
        showNotification
        notificationContent={
          <NotificationToast
            type="success"
            title="New 5-Star Review"
            message="Emma Wilson left a glowing review for Ocean View Suite"
          />
        }
      >
        {/* Demo Review Cards */}
        <div className="space-y-4">
          {/* Review Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-3xl font-bold text-yellow-500">4.8</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall Rating</div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <div className="text-3xl font-bold text-primary mb-2">248</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
            </div>
          </div>

          {/* Sample Review Card */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-5 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  EW
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Emma Wilson</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">2 days ago</div>
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
              "Absolutely stunning property with breathtaking ocean views. The host was incredibly responsive and helpful. Would definitely stay again!"
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Ocean View Suite</span>
              <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded">Verified Stay</span>
            </div>
          </div>

          {/* Category Ratings */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-5 border border-gray-200 dark:border-dark-border">
            <div className="font-semibold text-gray-900 dark:text-white mb-4">Category Ratings</div>
            <div className="space-y-3">
              {[
                { name: 'Cleanliness', score: 4.9 },
                { name: 'Communication', score: 5.0 },
                { name: 'Check-in', score: 4.8 },
                { name: 'Accuracy', score: 4.7 },
                { name: 'Location', score: 4.9 },
                { name: 'Value', score: 4.6 },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{cat.name}</div>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(cat.score / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white w-8">{cat.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },
  problemSolution: {
    problem: {
      title: 'No reviews means no bookings',
      subtitle: 'Prospects trust competitors with reviews over your superior property.',
      painPoints: [
        'Gorgeous ocean views. Premium property. Zero reviews. Prospects scroll past. Competitors win.',
        'Manual WhatsApp begging. "Sure, I\'ll leave a review!" They never do. 1 review per 20 bookings.',
        'Ask on checkout day. Guests rushing. Forget instantly. Walk out door. No review.',
        '4.8-star cleanliness. Excellent communication. No proof. Blank listing. Prospects assume worst.',
        'Direct website. Zero reviews. OTA has reviews. Guests trust Airbnb. Pay 15% commission.',
        'New property launch. Zero social proof. 2 inquiries per month. Can\'t compete. Desperate.',
      ],
    },
    solution: {
      before: 'WhatsApp every guest. Manual reminders. "Please review!" Get ignored. 1 in 20 responds. No social proof.',
      after: 'Auto-request 48 hours after checkout. 87% respond. Verified reviews with photos. Conversions triple.',
    },
  },
  keyFeatures: {
    title: 'Everything You Need to Build Trust Through Reviews',
    features: [
      {
        icon: 'checkCircle',
        name: 'Verified Reviews Only',
        description:
          'Only guests with completed stays can leave reviews. Eligibility window: 48 hours after check-in, within 90 days of checkout.',
      },
      {
        icon: 'chart',
        name: '6 Category Ratings',
        description:
          'Guests rate properties across cleanliness, communication, check-in, accuracy, location, and value for detailed insights.',
      },
      {
        icon: 'calendar',
        name: 'Photo Reviews',
        description:
          'Guests can upload up to 5 photos with their review, adding visual social proof that converts browsers into bookers.',
      },
      {
        icon: 'bell',
        name: 'Automated Review Requests',
        description:
          'Automatic email reminders sent to guests after checkout, making review collection effortless and consistent.',
      },
      {
        icon: 'users',
        name: 'Review Moderation',
        description:
          'Monitor all reviews, handle inappropriate content, and manage withdrawal requests with full audit trail.',
      },
      {
        icon: 'chart',
        name: 'Rating Analytics',
        description:
          'Track overall rating trends, category breakdowns, rating distribution, and compare performance over time.',
      },
      {
        icon: 'refresh',
        name: 'Edit Window',
        description:
          'Guests have 24 hours to edit their review after submission, reducing disputes and ensuring accuracy.',
      },
      {
        icon: 'mobile',
        name: 'Public Display Widget',
        description:
          'Showcase reviews on property detail pages with filtering, sorting, and photo galleries to build trust.',
      },
    ],
  },
  benefits: {
    title: 'Join Hosts Who 3-4x Their Bookings With Social Proof',
    stats: [
      {
        value: '3-4x',
        label: 'Higher Conversion',
        description: 'Properties with 20+ verified reviews convert 3-4x better than those with zero',
      },
      {
        value: '87%',
        label: 'Review Response Rate',
        description: 'Automated post-checkout requests get 87% response rate vs 5% for manual asks',
      },
      {
        value: '4.8★',
        label: 'Average Rating',
        description: 'Vilo hosts maintain exceptional ratings with detailed 6-category feedback',
      },
    ],
    testimonial: {
      quote:
        'My new property had zero reviews and I was getting maybe 2 inquiries per month. I was desperate. I tried manually asking guests for reviews but got maybe 1 review per 20 bookings. It was hopeless. I set up Vilo\'s automated review system and within 3 months I had 18 verified reviews with photos. My inquiry rate went from 2 per month to 15 per month. My conversion rate tripled. Now I have 64 verified reviews with a 4.9-star rating and I\'m fully booked 3 months in advance. The automated system sends requests 48 hours after checkout and 87% of my guests actually leave reviews. I don\'t do anything — it\'s completely automatic. Reviews literally transformed my business from struggling to thriving.',
      author: 'Lindiwe Ndlovu',
      business: 'Owner of Cape Town Luxury Stays (3 properties, 12 rooms)',
      rating: 5,
    },
  },
  cta: {
    headline: 'Start Building Trust With Verified Reviews',
    subtext:
      'Join thousands of property owners who boosted conversions with authentic guest reviews. 14-day free trial, no credit card required.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
