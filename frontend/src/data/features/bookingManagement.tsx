/**
 * Booking Management Feature Content Configuration
 * Enhanced with StoryBrand Framework & Close.com inspiration
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration, NotificationToast } from '@/components/features/FeaturePageSections';

export const bookingManagementContent: FeaturePageContent = {
  metadata: {
    title: 'Booking Management System - Manage All Your Bookings in One Place | Vilo',
    description:
      'Streamline your booking workflow with a real-time dashboard. Track bookings, payments, and guest info in one place. Automated confirmations and reminders save hours every week.',
    slug: 'booking-management',
  },
  hero: {
    featureName: 'Booking Management System',
    headline: 'Manage all your bookings in one place',
    subheadline:
      'Stop juggling spreadsheets, emails, and messages. See all your bookings, payments, and guest info in a single dashboard that updates in real-time.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: 'Used by 500+ property managers • Average time saved: 12 hours per week',
    illustration: (
      <DashboardIllustration
        title="Booking Dashboard"
        subtitle="Manage all your bookings in real-time"
        showNotification
        notificationContent={
          <NotificationToast
            type="success"
            title="New Booking Confirmed"
            message="Sarah Johnson booked Ocean View Suite for 3 nights • R 4,500 paid"
          />
        }
      >
        {/* Enhanced Booking Dashboard */}
        <div className="space-y-4">
          {/* Quick Stats - More Visual */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-900/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Pending</div>
                <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-yellow-600 animate-pulse-slow">12</div>
              <div className="text-xs text-yellow-600 mt-1">Needs action</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-green-200 dark:border-green-900/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-green-700 dark:text-green-400">Confirmed</div>
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-primary animate-pulse-slow">45</div>
              <div className="text-xs text-green-600 mt-1">All set</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-900/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-400">Checked-in</div>
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-blue-600 animate-pulse-slow">8</div>
              <div className="text-xs text-blue-600 mt-1">Active guests</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-900/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-orange-700 dark:text-orange-400">Payment Due</div>
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-orange-600 animate-pulse-slow">6</div>
              <div className="text-xs text-orange-600 mt-1">Follow up needed</div>
            </div>
          </div>

          {/* Sample Booking Cards - More Detailed */}
          <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-200 dark:border-dark-border hover:border-primary dark:hover:border-primary transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform">
                  SJ
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-gray-900 dark:text-white">Sarah Johnson</div>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium">
                      Confirmed
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">BK-2026-001 • Ocean View Suite</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Booked 3 days ago via Direct Website</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary animate-pulse-slow">R 4,500</div>
                <div className="text-xs text-green-600">Paid in full</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm pt-3 border-t border-gray-200 dark:border-dark-border">
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Check-in</div>
                <div className="font-medium text-gray-900 dark:text-white">Jan 22, 2026</div>
                <div className="text-xs text-gray-500">2:00 PM</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Check-out</div>
                <div className="font-medium text-gray-900 dark:text-white">Jan 25, 2026</div>
                <div className="text-xs text-gray-500">11:00 AM</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Guests</div>
                <div className="font-medium text-gray-900 dark:text-white">2 adults</div>
                <div className="text-xs text-gray-500">No children</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Nights</div>
                <div className="font-medium text-gray-900 dark:text-white">3 nights</div>
                <div className="text-xs text-gray-500">R 1,500/night</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-yellow-200 dark:border-yellow-900/30 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 flex items-center justify-center text-yellow-700 dark:text-yellow-400 font-bold group-hover:scale-110 transition-transform">
                  DB
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-gray-900 dark:text-white">David Brown</div>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 font-medium">
                      Pending Payment
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">BK-2026-002 • Mountain Retreat</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Booked 1 day ago • Reminder sent today</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-600 animate-pulse-slow">R 3,600</div>
                <div className="text-xs text-orange-600 animate-bounce-subtle">R 1,800 due</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm pt-3 border-t border-yellow-200 dark:border-yellow-900/30">
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Check-in</div>
                <div className="font-medium text-gray-900 dark:text-white">Feb 5, 2026</div>
                <div className="text-xs text-gray-500">3:00 PM</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Check-out</div>
                <div className="font-medium text-gray-900 dark:text-white">Feb 8, 2026</div>
                <div className="text-xs text-gray-500">10:00 AM</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Guests</div>
                <div className="font-medium text-gray-900 dark:text-white">4 adults</div>
                <div className="text-xs text-gray-500">2 children</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Payment</div>
                <div className="font-medium text-orange-600">50% paid</div>
                <div className="text-xs text-gray-500">Due Jan 29</div>
              </div>
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },
  problemSolution: {
    problem: {
      title: 'Managing bookings shouldn\'t be this hard',
      subtitle: 'You\'re wasting hours on tasks that could happen automatically.',
      painPoints: [
        'Triple data entry. Update Excel, update calendar, send confirmation email.',
        'Late responses lose bookings. Guest inquiries while you\'re out go unanswered.',
        'Payment confusion. Check bank app, check spreadsheet, still not sure who paid.',
        'Manual reminders. Copy-paste payment reminders to every guest before check-in.',
        'Repeat questions. "WiFi password?" "Parking?" Asked by every single guest.',
        'Double-booking panic. One mistake in your spreadsheet equals two angry guests.',
      ],
    },
    solution: {
      before: 'Excel for bookings. Docs for payments. WhatsApp for messages. Email templates. Wall calendar. All disconnected.',
      after: 'One dashboard. Log once. Auto-updates. Auto-confirms. See everything. No switching apps.',
    },
  },
  featureShowcase: [
    // Section 1: Real-Time Booking Calendar
    {
      headline: 'See every booking across all 24 rooms in one glance',
      description:
        'No more juggling 3 spreadsheets and a paper calendar. One real-time calendar shows exactly which rooms are booked, available, or blocked across all your properties. Auto-updates the second you confirm a booking.',
      subFeatures: [
        {
          icon: 'calendar',
          title: 'Visual Calendar View',
          description: 'Month, week, or day view with color-coded booking statuses.',
        },
        {
          icon: 'lock',
          title: 'Auto-Blocking',
          description: 'Dates lock instantly when you confirm — zero chance of double-booking.',
        },
        {
          icon: 'layers',
          title: 'Multi-Property Support',
          description: 'See all 8 properties side-by-side or switch between them with one click.',
        },
        {
          icon: 'mobile',
          title: 'Mobile Access',
          description: 'Check availability from your phone while away from your desk.',
        },
      ],
      illustration: (
        <DashboardIllustration title="Booking Calendar" subtitle="January 2026">
          {/* Calendar Grid - same as we use in calendar feature */}
          <div className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center py-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {[1, 2, 3, 4, 5, 6, 7].map((date) => (
                <div key={date} className="aspect-square p-2 border-b border-r border-gray-200 dark:border-dark-border">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{date}</div>
                  <div className="mt-1">
                    {date === 2 && <div className="h-1 w-full bg-primary rounded animate-pulse-slow" title="Booked" />}
                    {date === 5 && <div className="h-1 w-full bg-yellow-500 rounded animate-pulse-slow" title="Pending" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardIllustration>
      ),
      imagePosition: 'left',
    },

    // Section 2: Automated Confirmations
    {
      headline: 'Stop manually sending 45 confirmation emails every week',
      description:
        'Professional confirmation emails auto-send in 2 minutes with booking number, payment details, check-in instructions, and WiFi password. You tap "Confirm." System does the rest.',
      subFeatures: [
        {
          icon: 'email',
          title: 'Instant Confirmations',
          description: 'Guests receive confirmation within 2 minutes of booking — no manual copy-paste.',
        },
        {
          icon: 'clock',
          title: 'Payment Reminders',
          description: 'Automatic reminders at 7 days, 3 days, and 1 day before payment due.',
        },
        {
          icon: 'message',
          title: 'Check-in Instructions',
          description: 'Pre-arrival emails with directions, WiFi, parking info sent automatically.',
        },
        {
          icon: 'custom',
          title: 'Branded Templates',
          description: 'Professional emails with your logo and custom messaging.',
        },
      ],
      illustration: (
        <DashboardIllustration title="Automated Emails" subtitle="Confirmation sent">
          <div className="space-y-4">
            {/* Email Preview */}
            <div className="bg-white dark:bg-dark-card rounded-lg p-5 border border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-dark-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Booking Confirmed!</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Sent to sarah.johnson@email.com</div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium animate-scale-in">
                  Sent
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="font-medium text-gray-900 dark:text-white">Hi Sarah,</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Your booking at Ocean View Suite is confirmed!
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 dark:bg-dark-bg rounded">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Booking #</div>
                    <div className="font-semibold">BK-2026-001</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Check-in</div>
                    <div className="font-semibold">Jan 22, 2:00 PM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Reminders */}
            <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Scheduled Reminders</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-slow"></div>
                  <span className="text-gray-600 dark:text-gray-400">Payment reminder: Jan 15</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-slow"></div>
                  <span className="text-gray-600 dark:text-gray-400">Pre-arrival info: Jan 20</span>
                </div>
              </div>
            </div>
          </div>
        </DashboardIllustration>
      ),
      imagePosition: 'right',
    },

    // Section 3: Payment Tracking
    {
      headline: 'Know who paid and who didn\'t in 2 seconds',
      description:
        'Green "Paid in full" badges. Orange "R 1,800 due in 3 days" badges. No more opening 3 files at 11 PM to check if someone paid. Everything visual, everything instant.',
      subFeatures: [
        {
          icon: 'check',
          title: 'Payment Status at a Glance',
          description: 'Color-coded badges show paid, pending, or overdue instantly.',
        },
        {
          icon: 'filter',
          title: 'Filter by Payment Status',
          description: 'Click "Payment Due" and see exactly which 6 guests need follow-up today.',
        },
        {
          icon: 'history',
          title: 'Payment History',
          description: 'Full transaction log shows every deposit, balance, and refund.',
        },
        {
          icon: 'reminder',
          title: 'Overdue Alerts',
          description: 'Get notified when payments are overdue so nothing slips through.',
        },
      ],
      illustration: (
        <DashboardIllustration title="Payment Dashboard" subtitle="Recent transactions">
          <div className="space-y-4">
            {/* Payment Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-green-200 dark:border-green-900/30">
                <div className="text-2xl font-bold text-primary animate-pulse-slow">R24,500</div>
                <div className="text-xs text-green-600">Received this month</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-900/30">
                <div className="text-2xl font-bold text-orange-600 animate-pulse-slow">R3,200</div>
                <div className="text-xs text-orange-600">Pending</div>
              </div>
              <div className="bg-white dark:bg-dark-card rounded-lg p-3 border border-gray-200 dark:border-dark-border">
                <div className="text-2xl font-bold text-gray-900 dark:text-white animate-pulse-slow">12</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Processed</div>
              </div>
            </div>

            {/* Payment List */}
            <div className="space-y-2">
              <div className="bg-white dark:bg-dark-card rounded-lg p-3 border border-gray-200 dark:border-dark-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Sarah Johnson</div>
                  <div className="text-xs text-gray-500">BK-2026-001 • Jan 10</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary animate-pulse-slow">R4,500</div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 animate-scale-in">
                    Paid
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-card rounded-lg p-3 border border-yellow-200 dark:border-yellow-900/30 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">David Brown</div>
                  <div className="text-xs text-gray-500">BK-2026-002 • Jan 11</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600 animate-pulse-slow">R1,800</div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 animate-bounce-subtle">
                    Due Jan 29
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DashboardIllustration>
      ),
      imagePosition: 'left',
    },

    // Section 4: Guest Management
    {
      headline: 'Remember every guest without the memory game',
      description:
        'Complete guest profiles show their last 3 stays, room preferences, dietary requirements, and special requests. Deliver personalized service without sticky notes.',
      subFeatures: [
        {
          icon: 'user',
          title: 'Complete Guest History',
          description: 'See their past bookings, spending, and preferences in one profile.',
        },
        {
          icon: 'notes',
          title: 'Custom Notes',
          description: 'Add notes like "Allergic to shellfish" or "Prefers ground floor rooms."',
        },
        {
          icon: 'star',
          title: 'VIP Tagging',
          description: 'Tag repeat guests and high-spenders for special treatment.',
        },
        {
          icon: 'search',
          title: 'Instant Search',
          description: 'Type "Johnson" and instantly pull up all their bookings and details.',
        },
      ],
      illustration: (
        <DashboardIllustration title="Guest Profile" subtitle="Sarah Johnson">
          <div className="bg-white dark:bg-dark-card rounded-lg p-5 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center text-primary font-bold text-xl">
                SJ
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-gray-900 dark:text-white">Sarah Johnson</div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 animate-pulse-slow">
                    VIP Guest
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">sarah.johnson@email.com</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">+27 82 345 6789</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 dark:bg-dark-bg rounded">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Stays</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white animate-pulse-slow">3</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Spent</div>
                <div className="text-lg font-bold text-primary animate-pulse-slow">R13,500</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</div>
                <div className="text-lg font-bold text-yellow-600 animate-pulse-slow">4.9★</div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-dark-border pt-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Preferences</div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div>• Prefers ocean view rooms</div>
                <div>• Always books for 3 nights</div>
                <div>• Vegetarian diet</div>
              </div>
            </div>
          </div>
        </DashboardIllustration>
      ),
      imagePosition: 'right',
    },
  ],
  keyFeatures: {
    title: 'Everything you need to manage bookings efficiently',
    features: [
      {
        icon: 'calendar',
        name: 'Real-time booking calendar',
        description: 'See which rooms are available, booked, or blocked across all your properties. Calendar updates automatically when you confirm a booking.',
      },
      {
        icon: 'automation',
        name: 'Automated confirmations',
        description: 'Confirmation emails send automatically with booking details, payment info, check-in instructions, and property information.',
      },
      {
        icon: 'payments',
        name: 'Payment tracking',
        description: 'See at a glance who\'s paid in full, who still owes money, and when payments are due. Track deposits and final payments easily.',
      },
      {
        icon: 'multichannel',
        name: 'Multi-channel bookings',
        description: 'Whether guests book via phone, WhatsApp, email, or your website, everything goes into one system so nothing gets lost.',
      },
      {
        icon: 'guests',
        name: 'Guest profiles',
        description: 'Keep notes on each guest - their preferences, past stays, and special requests - so you can provide better service.',
      },
      {
        icon: 'workflow',
        name: 'Status filters',
        description: 'Quickly filter bookings by status - pending, confirmed, checked-in, or completed - to stay on top of what needs attention.',
      },
      {
        icon: 'filter',
        name: 'Quick search',
        description: 'Find any booking instantly by searching for the guest name, booking number, or room. No more scrolling through spreadsheets.',
      },
      {
        icon: 'mobile',
        name: 'Mobile access',
        description: 'Check bookings and confirm reservations from your phone when you\'re away from your desk.',
      },
    ],
  },
  benefits: {
    title: 'Save time and reduce stress',
    stats: [
      {
        value: '12 Hours',
        label: 'Average Time Saved',
        description: 'Most property managers save around 12 hours per week by automating confirmations, reminders, and status updates.',
      },
      {
        value: '500+',
        label: 'Active Properties',
        description: 'Property managers across South Africa use Vilo to manage their bookings and reduce double-booking risks.',
      },
      {
        value: 'Under 1 Min',
        label: 'To Log a Booking',
        description: 'Enter guest details, select dates and room, confirm. The system handles confirmations and calendar updates.',
      },
    ],
    testimonial: {
      quote: 'I manage 8 properties in Knysna and was using Excel spreadsheets for everything. Every booking meant updating the spreadsheet, then my paper calendar, then sending a confirmation email from my template. It took forever. I also made a few mistakes - including one double-booking that was really embarrassing. Since switching to Vilo, everything\'s in one place. When a booking comes in, I log it once and the system handles the rest. The calendar updates automatically, the confirmation email goes out, and I can see payment status without checking my bank statement. It\'s saved me a ton of time, especially during peak season. The dashboard makes it easy to see what\'s coming up and what needs attention. Wish I\'d found this sooner.',
      author: 'Thabo M.',
      business: 'Property Manager, Knysna',
      rating: 5,
    },
  },
  cta: {
    headline: 'Ready to simplify your booking management?',
    subtext:
      'See how Vilo can help you save time and stay organized. Book a demo to learn how the system works for your properties.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
