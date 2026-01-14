/**
 * Property & Room Management Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const propertyManagementContent: FeaturePageContent = {
  metadata: {
    title: 'Property & Room Management - Centralize Your Portfolio | Vilo',
    description: 'Stop juggling spreadsheets and scattered data. Manage unlimited properties, rooms, pricing, and amenities from one centralized dashboard. Save 8+ hours per week.',
    slug: 'property-management',
  },

  hero: {
    featureName: 'Property & Room Management',
    headline: 'Stop Juggling Spreadsheets Across 5 Platforms',
    subheadline: 'One dashboard for all properties, rooms, pricing, amenities, and photos. Update everything in seconds instead of hunting through scattered files.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: '500+ property owners • 2,000+ rooms managed • 8 hours saved weekly',
    illustration: (
      <DashboardIllustration
        title="Properties"
        subtitle="Manage all your properties and rooms"
      >
        {/* Property Cards */}
        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Properties</div>
              <div className="text-2xl font-bold text-primary">5</div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Rooms</div>
              <div className="text-2xl font-bold text-blue-600">24</div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Occupancy</div>
              <div className="text-2xl font-bold text-green-600">87%</div>
            </div>
          </div>

          {/* Sample Property Cards */}
          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Ocean View Villa</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cape Town, Western Cape</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">6 rooms • WiFi • Pool • Parking</div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t border-gray-200 dark:border-dark-border">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Base Price</div>
                <div className="font-medium text-gray-900 dark:text-white">R 1,200/night</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Bookings</div>
                <div className="font-medium text-gray-900 dark:text-white">45 total</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Revenue</div>
                <div className="font-medium text-gray-900 dark:text-white">R 54,000</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg p-4 border border-gray-200 dark:border-dark-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Mountain Retreat</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Drakensberg, KwaZulu-Natal</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">4 rooms • WiFi • Fireplace • Hiking</div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t border-gray-200 dark:border-dark-border">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Base Price</div>
                <div className="font-medium text-gray-900 dark:text-white">R 950/night</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Bookings</div>
                <div className="font-medium text-gray-900 dark:text-white">32 total</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Revenue</div>
                <div className="font-medium text-gray-900 dark:text-white">R 30,400</div>
              </div>
            </div>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Managing scattered property data shouldn\'t be this hard',
      subtitle: 'You\'re wasting hours hunting through files that could be in one place.',
      painPoints: [
        'Property details in Excel. Photos in Google Drive. Pricing in WhatsApp. Amenities in Word docs.',
        'Sunday mornings updating 24 rooms manually. Spreadsheet formulas break. Miss rooms. Lose money.',
        'Guest asks about amenities. Open 4 files to answer. They book elsewhere in the meantime.',
        'List WiFi by mistake. Guest arrives. No WiFi. 1-star review. Full refund.',
        'Team updates description. Forgets photos. Guest expects different room. Another bad review.',
        'Seasonal pricing changes. 8 hours to update everything. Still make mistakes that cost bookings.',
      ],
    },
    solution: {
      before: 'Open Excel. Check Google Drive. Find photos. Update WhatsApp notes. Copy to listing. Repeat for each room.',
      after: 'Open dashboard. Update room. Live everywhere. Team sees changes. Done in 30 seconds.',
    },
  },

  keyFeatures: {
    title: 'Everything You Need to Organize Your Properties',
    features: [
      {
        icon: 'building',
        name: 'Multi-Property Management',
        description: 'Add unlimited properties with their own branding, contact details, and settings',
      },
      {
        icon: 'door',
        name: 'Room Type Configuration',
        description: 'Create room types with bed configurations, capacity limits, and custom amenities',
      },
      {
        icon: 'currency',
        name: 'Dynamic Pricing Control',
        description: 'Set base prices, seasonal rates, and special pricing rules per room or property',
      },
      {
        icon: 'sparkles',
        name: 'Amenities & Features',
        description: 'Tag rooms with WiFi, AC, kitchen, parking, and custom amenities for guest filtering',
      },
      {
        icon: 'image',
        name: 'Photo Galleries',
        description: 'Upload unlimited high-quality photos with drag-and-drop ordering and captions',
      },
      {
        icon: 'map',
        name: 'Location & Directions',
        description: 'Add addresses, GPS coordinates, and custom directions for each property',
      },
      {
        icon: 'document',
        name: 'Property Descriptions',
        description: 'Rich text editor for detailed descriptions, house rules, and check-in instructions',
      },
      {
        icon: 'duplicate',
        name: 'Clone & Template System',
        description: 'Duplicate properties or rooms to quickly add similar listings',
      },
    ],
  },

  benefits: {
    title: 'Join 500+ Property Owners Who Saved 8+ Hours Every Week',
    stats: [
      {
        value: '8 Hours',
        label: 'Saved Per Week',
        description: 'No more hunting through spreadsheets or manually updating prices across platforms',
      },
      {
        value: '30 Seconds',
        label: 'To Update Rooms',
        description: 'Change prices, amenities, or photos instantly instead of spending hours with spreadsheets',
      },
      {
        value: 'Zero',
        label: 'Mismatched Info',
        description: 'Single source of truth eliminates costly mistakes from scattered data',
      },
    ],
    testimonial: {
      quote: 'I was managing 5 properties with 24 rooms using 3 different Excel files, a Google Drive folder, and sticky notes everywhere. When peak season pricing hit, it took me 8 hours to update everything and I still made mistakes that cost me bookings. Now I update all 24 rooms in under 10 minutes from one dashboard. I can answer guest questions in seconds instead of scrambling through files. In 6 months, I\'ve had zero mismatched information issues and saved over 200 hours of admin work. This system has literally changed how I run my business.',
      author: 'Sarah Botha',
      business: 'Owner of Cape Coastal Properties (5 properties, 24 rooms)',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready to Stop Juggling Spreadsheets?',
    subtext: 'Join 500+ property owners who centralized their portfolio and saved 8+ hours per week. See exactly how Vilo works in a personalized 15-minute demo.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
