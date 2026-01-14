/**
 * Invoicing & Receipts Feature Page Content
 */

import { FeaturePageContent } from '@/pages/features/FeaturePage.types';
import { DashboardIllustration } from '@/components/features/FeaturePageSections';

export const invoicingContent: FeaturePageContent = {
  metadata: {
    title: 'Invoicing & Receipts',
    description: 'Professional PDF invoices with your branding and bank details',
    slug: 'invoicing',
  },

  hero: {
    headline: 'Professional Invoices & Receipts in Seconds',
    subheadline: 'Auto-generate branded PDF invoices with your logo, bank details, and tax information. Send instantly or download for records',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
    trustBadge: '50,000+ invoices generated monthly',
    illustration: (
      <DashboardIllustration
        title="Invoice Manager"
        subtitle="Professional invoicing made simple"
      >
        {/* Invoice Preview */}
        <div className="space-y-4">
          {/* Invoice Document Preview */}
          <div className="bg-white dark:bg-dark-card rounded-lg border-2 border-gray-200 dark:border-dark-border overflow-hidden">
            {/* Header with company branding */}
            <div className="bg-gradient-to-r from-primary/5 to-teal-500/5 p-4 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Ocean View Villa</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Cape Town, South Africa</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Invoice #</div>
                  <div className="font-mono text-sm font-medium text-gray-900 dark:text-white">INV-2026-001</div>
                </div>
              </div>
            </div>

            {/* Invoice details */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Bill To:</div>
                  <div className="font-medium text-gray-900 dark:text-white">Sarah Johnson</div>
                  <div className="text-gray-600 dark:text-gray-400">sarah@email.com</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Invoice Date:</div>
                  <div className="font-medium text-gray-900 dark:text-white">Jan 11, 2026</div>
                  <div className="text-gray-500 dark:text-gray-400">Due: Jan 18, 2026</div>
                </div>
              </div>

              {/* Line items */}
              <div className="border-t border-gray-200 dark:border-dark-border pt-3">
                <div className="text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Ocean View Suite</div>
                      <div className="text-gray-500">3 nights × R 1,200</div>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">R 3,600</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600 dark:text-gray-400">Cleaning Fee</div>
                    <div className="font-medium text-gray-900 dark:text-white">R 300</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600 dark:text-gray-400">Tourism Levy (2%)</div>
                    <div className="font-medium text-gray-900 dark:text-white">R 72</div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-300 dark:border-dark-border pt-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-bold text-gray-900 dark:text-white">Total Amount</div>
                  <div className="text-xl font-bold text-primary">R 3,972</div>
                </div>
              </div>

              {/* Payment status */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                  Paid
                </span>
                <span className="text-gray-500">via Paystack • Jan 11, 2026</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button className="px-3 py-2 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
              Download PDF
            </button>
            <button className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              Send to Guest
            </button>
            <button className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Duplicate
            </button>
          </div>
        </div>
      </DashboardIllustration>
    ),
  },

  problemSolution: {
    problem: {
      title: 'Manual invoicing wastes time and looks unprofessional',
      subtitle: '20 minutes per booking. Word docs. Inconsistent. Guests notice.',
      painPoints: [
        'Word template. Excel calculations. Copy booking details. Format. Save as PDF. Email guest. 20 minutes gone.',
        'Inconsistent formatting. Some invoices have tax. Some don\'t. Logo missing. Looks amateur.',
        'Email manually. Track who got what. Which invoice version? Spreadsheet mess. Confusion.',
        'Guest pays. Need receipt. Create manually. Email separately. More admin work.',
        'Peak season. 15 bookings daily. 5 hours just doing invoices. Can\'t scale. Drowning.',
        'Want tax compliance. Need proper invoices. Manual system. Mistakes happen. Audit risk.',
      ],
    },
    solution: {
      before: 'Open Word. Copy booking. Calculate totals. Format. PDF. Email. Track. 20 minutes. Repeat 15 times daily.',
      after: 'Click button. Professional invoice. Auto-branded. Auto-emailed. Done in 10 seconds. Or fully automatic.',
    },
  },

  keyFeatures: {
    title: 'Professional Invoicing Made Easy',
    features: [
      {
        icon: 'wand',
        name: 'Auto-Generation',
        description: 'Invoices are created automatically when bookings are confirmed or payments are received',
      },
      {
        icon: 'palette',
        name: 'Custom Branding',
        description: 'Add your logo, colors, and business details to every invoice',
      },
      {
        icon: 'document',
        name: 'PDF Export',
        description: 'Download professional PDFs instantly for your records or to send to guests',
      },
      {
        icon: 'calculator',
        name: 'Tax & VAT Handling',
        description: 'Automatic tax calculations and VAT compliance for South African regulations',
      },
      {
        icon: 'itemize',
        name: 'Line Item Breakdown',
        description: 'Show room rates, add-ons, cleaning fees, and taxes as separate line items',
      },
      {
        icon: 'email',
        name: 'Auto-Send to Guests',
        description: 'Email invoices automatically when bookings are confirmed or payments are due',
      },
      {
        icon: 'receipt',
        name: 'Payment Receipts',
        description: 'Generate payment receipts instantly when guests complete payments',
      },
      {
        icon: 'bank',
        name: 'Bank Details',
        description: 'Include your bank account details for EFT payments directly on invoices',
      },
    ],
  },

  benefits: {
    title: 'Save Time, Look Professional',
    stats: [
      {
        value: '95% Faster',
        label: 'Invoice Creation',
        description: 'Generate invoices in 5 seconds instead of 20 minutes',
      },
      {
        value: '100%',
        label: 'Tax Compliant',
        description: 'Automatic VAT calculations and SARS-compliant formatting',
      },
      {
        value: '8 Hours',
        label: 'Saved Per Month',
        description: 'Stop manually creating invoices for 40+ bookings monthly',
      },
    ],
    testimonial: {
      quote: 'Creating invoices used to take me hours every week. Now Vilo generates beautiful, professional invoices automatically. My guests love how organized I am, and I save 10 hours a month.',
      author: 'Priya Naidoo',
      business: 'Umhlanga Beachfront Suites',
      rating: 5,
    },
  },

  cta: {
    headline: 'Ready for Professional Invoicing?',
    subtext: 'Start your 14-day free trial today. No credit card required. Create your first invoice in under 1 minute.',
    primaryCTA: {
      text: 'Book Demo',
      href: '/contact',
    },
  },
};
