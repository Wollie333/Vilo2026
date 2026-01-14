/**
 * Calendar & Availability Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const calendarContent: FeaturePageContent = {
  metadata: {
    title: 'Availability Calendar - Eliminate Double-Bookings Forever | Vilo',
    description: 'Stop double-booking nightmares. Real-time visual calendar with automatic blocking, multi-property sync, and instant availability checks. Zero double-bookings guaranteed.',
    slug: 'calendar',
  },

  hero: {
    featureName: 'Calendar & Availability Management',
    headline: 'Never Double-Book Again. Ever.',
    subheadline: 'Real-time visual calendar auto-blocks dates the instant bookings confirm. Check availability in 10 seconds instead of checking 3 spreadsheets.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: '2,000+ rooms • Zero double-bookings • 95% occupancy rates',
    illustration: (
      <DashboardIllustration
        title="Availability Calendar"
        subtitle="January 2026"
      >
        {/* Calendar View */}
        <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {/* Week 1 */}
            {[29, 30, 31, 1, 2, 3, 4].map((date, i) => (
              <div
                key={`w1-${date}`}
                className={`aspect-square p-2 border-b border-r border-gray-200 dark:border-dark-border ${
                  i < 3 ? 'bg-gray-50/50 dark:bg-dark-bg/50 text-gray-400' : 'bg-white dark:bg-dark-card'
                }`}
              >
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{date}</div>
                {i >= 3 && (
                  <div className="mt-1">
                    {date === 2 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                    {date === 3 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                  </div>
                )}
              </div>
            ))}

            {/* Week 2 */}
            {[5, 6, 7, 8, 9, 10, 11].map((date) => (
              <div
                key={`w2-${date}`}
                className="aspect-square p-2 border-b border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card"
              >
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{date}</div>
                <div className="mt-1">
                  {date === 8 && <div className="h-1 w-full bg-yellow-500 rounded mb-0.5" title="Pending" />}
                  {date === 9 && <div className="h-1 w-full bg-yellow-500 rounded mb-0.5" title="Pending" />}
                  {date === 10 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                  {date === 11 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                </div>
              </div>
            ))}

            {/* Week 3 */}
            {[12, 13, 14, 15, 16, 17, 18].map((date) => (
              <div
                key={`w3-${date}`}
                className="aspect-square p-2 border-b border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card"
              >
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{date}</div>
                <div className="mt-1">
                  {date === 15 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                  {date === 16 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                  {date === 17 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                  {date === 18 && <div className="h-1 w-full bg-gray-400 rounded mb-0.5" title="Blocked" />}
                </div>
              </div>
            ))}

            {/* Week 4 */}
            {[19, 20, 21, 22, 23, 24, 25].map((date) => (
              <div
                key={`w4-${date}`}
                className="aspect-square p-2 border-b border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card"
              >
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{date}</div>
                <div className="mt-1">
                  {date === 22 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                  {date === 23 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                  {date === 24 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                  {date === 25 && <div className="h-1 w-full bg-primary rounded mb-0.5" title="Booked" />}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 py-3 bg-gray-50 dark:bg-dark-bg text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-primary rounded" />
              <span className="text-gray-600 dark:text-gray-400">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-400 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Blocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-white dark:bg-dark-card border border-gray-300 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Available</span>
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Tracking availability manually is costing you bookings',
      subtitle: 'Every double-booking costs you refunds, reviews, and trust.',
      painPoints: [
        'WhatsApp booking confirmed. Forgot to mark Excel. Double-booked. R 4,500 refund.',
        'Guest asks "Available Feb 10-15?" Open 3 calendars. Cross-reference. 5 minutes. They book elsewhere.',
        'Phone booking. Marked calendar. Forgot to update spreadsheet. Two families. Same day. Same room.',
        'Peak season. Can\'t see gaps visually. Miss bookings. Leave money on table.',
        'Manual blocking after every booking. One slip. Entire month chaos. Refunds. Reviews. Stress.',
        'Excel says available. Google Calendar says booked. Which is right? Guess wrong. Disaster.',
      ],
    },
    solution: {
      before: 'Open Excel. Check Google Calendar. Cross-reference Airbnb. Still not 100% sure. Guess wrong. Issue refund.',
      after: 'Open calendar. See everything. Auto-blocked. Answer in 10 seconds. Always accurate.',
    },
  },

  keyFeatures: {
    title: 'Smart Calendar Management',
    features: [
      {
        icon: 'calendar',
        name: 'Real-Time Availability',
        description: 'See live availability across all properties and rooms in monthly, weekly, or daily views',
      },
      {
        icon: 'lock',
        name: 'Automatic Blocking',
        description: 'Dates are instantly blocked across all channels when a booking is confirmed',
      },
      {
        icon: 'layers',
        name: 'Multi-Property View',
        description: 'Switch between properties or view all calendars side-by-side for quick comparison',
      },
      {
        icon: 'ban',
        name: 'Manual Date Blocking',
        description: 'Block dates for maintenance, personal use, or seasonal closures with one click',
      },
      {
        icon: 'arrows',
        name: 'Drag & Drop Booking',
        description: 'Create or move bookings by dragging date ranges directly on the calendar',
      },
      {
        icon: 'filter',
        name: 'Smart Filtering',
        description: 'Filter by property, room type, booking status, or guest name instantly',
      },
      {
        icon: 'bell',
        name: 'Availability Alerts',
        description: 'Get notified when rooms become available or dates are about to be blocked',
      },
      {
        icon: 'sync',
        name: 'iCal Integration',
        description: 'Export to Google Calendar, Airbnb, or Booking.com to keep all platforms synced',
      },
    ],
  },

  benefits: {
    title: 'Join 500+ Hosts Who Eliminated Double-Bookings Forever',
    stats: [
      {
        value: 'Zero',
        label: 'Double-Bookings',
        description: 'Automatic blocking the instant a booking confirms — human error eliminated',
      },
      {
        value: '10 Seconds',
        label: 'Availability Check',
        description: 'Answer "Are you available?" in 10 seconds instead of 5 minutes',
      },
      {
        value: '95%',
        label: 'Occupancy Rate',
        description: 'Visual calendar helps spot and fill empty dates faster than spreadsheets',
      },
    ],
    testimonial: {
      quote: 'I double-booked twice in one month using my Excel spreadsheet system. One mistake cost me R 4,500 in refunds plus two 1-star reviews that hurt my reputation for months. I was terrified of my own calendar. Since switching to Vilo, I\'ve had zero double-bookings in 8 months. The calendar automatically blocks dates across all my platforms the second a booking comes in. I answer availability questions in 10 seconds with absolute confidence. I used to spend 15 minutes every day manually updating calendars — now it\'s automatic. The peace of mind alone is worth it. My occupancy went from 78% to 94% because I can instantly see gaps and fill them with promotions.',
      author: 'Thandi Mkhize',
      business: 'Owner of Durban Beach Rentals (4 properties, 16 rooms)',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Sleep Soundly Without Fear of Double-Bookings?',
    subtext: 'Join 500+ hosts who eliminated double-bookings and saved hours every week. See exactly how Vilo\'s calendar works in a personalized 15-minute demo.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
