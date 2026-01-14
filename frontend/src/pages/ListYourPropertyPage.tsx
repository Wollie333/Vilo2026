/**
 * ListYourPropertyPage
 * Invites property owners to create listings on Vilo
 * Matches ForHostsPage design style
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';

export const ListYourPropertyPage: React.FC = () => {
  return (
    <PublicLayout transparentHeader>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 dark:from-black dark:to-gray-900 pt-32 pb-20">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-primary/20 dark:bg-primary/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-teal-500/15 dark:bg-teal-500/25 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-emerald-400 dark:text-emerald-300 text-sm font-medium mb-8 bg-white/10 dark:bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 dark:bg-emerald-300 rounded-full animate-pulse" />
              <span>List your property today</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-white dark:text-gray-50 mb-8 leading-tight">
              Create your listings.
              <br />
              <span className="text-white/60 dark:text-gray-400">Reach travelers.</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                Grow your business.
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-xl text-white/80 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Showcase your vacation rental to thousands of travelers and manage everything from one powerful platform.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-primary dark:bg-primary text-white px-8 py-4 rounded-full font-medium shadow-lg shadow-primary/25 dark:shadow-primary/40 hover:bg-primary/90 dark:hover:bg-primary/80 transition-all"
              >
                Start Listing for Free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 text-white/90 dark:text-gray-200 px-8 py-4 rounded-full font-medium backdrop-blur-sm border border-white/20 dark:border-gray-600 hover:bg-white/10 dark:hover:bg-white/5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See how it works
              </a>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free to list your property
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Setup in minutes
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No hidden fees
              </span>
            </div>
          </div>

          {/* Property Preview Card */}
          <div className="mt-12 relative max-w-4xl mx-auto">
            <div className="absolute inset-[-0.5rem] bg-gradient-to-r from-primary/20 via-teal-500/20 to-primary/20 dark:from-primary/30 dark:via-teal-500/30 dark:to-primary/30 rounded-2xl blur-2xl opacity-60 dark:opacity-80" />

            {/* Sample Property Listing */}
            <div className="relative bg-white dark:bg-dark-card rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-dark-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Property Image */}
                <div className="aspect-[16/10] md:aspect-auto relative">
                  <img
                    src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"
                    alt="Property example"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    Featured
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-5 flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Cape Town, South Africa</span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 line-clamp-1">
                          Luxury Ocean View Villa
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">4.9</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      Beautiful 4-bedroom villa with stunning ocean views, private pool, and modern amenities.
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        8 guests
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        4 bedrooms
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                        3 bathrooms
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
                    <div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">R3,500</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400"> / night</span>
                    </div>
                    <Link
                      to="/signup"
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      List Like This
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-28 md:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Simple Process</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              List Your Property in 4 Easy Steps
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get your property online and start accepting bookings in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="relative bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-primary mb-4 mt-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create Account
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sign up for free — no credit card required to get started
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-primary mb-4 mt-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Add Property Details
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload photos, describe amenities, and highlight unique features
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-primary mb-4 mt-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Set Your Pricing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure rates, availability, and booking rules that work for you
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                4
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-primary mb-4 mt-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Go Live
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Publish your listing and start receiving bookings from guests
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-medium shadow-lg hover:bg-primary/90 transition-all"
            >
              Get Started Now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center max-w-7xl mx-auto">
            {/* Features List */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Everything Included</p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Powerful tools to manage your property
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Access a complete suite of features designed to help you succeed as a property host.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  'Professional property pages with photo galleries',
                  'Real-time booking calendar and availability',
                  'Secure payment processing and invoicing',
                  'Guest messaging and communication',
                  'Reviews and ratings management',
                  'Pricing and promotional tools',
                  'Analytics and performance insights',
                  'Mobile-friendly dashboard',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gray-800 dark:bg-black rounded-3xl p-10 text-white border border-gray-700 dark:border-gray-800">
              <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">Average host earnings</div>
              <div className="text-5xl font-bold text-emerald-400 dark:text-emerald-300 mb-1">R35,000</div>
              <div className="text-sm text-gray-500 dark:text-gray-600 mb-8">per month with consistent bookings</div>
              <div className="border-t border-gray-700 dark:border-gray-800 pt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 dark:text-gray-500 text-sm">Avg. nightly rate</span>
                  <span className="font-bold text-white">R1,800</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 dark:text-gray-500 text-sm">Occupancy rate</span>
                  <span className="font-bold text-white">75%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 dark:text-gray-500 text-sm">Monthly nights booked</span>
                  <span className="font-bold text-white">~20 nights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 md:py-32 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to list your property?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Join thousands of hosts already earning on Vilo. Create your listing today and start welcoming guests.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full font-medium shadow-lg hover:bg-gray-100 transition-all"
              >
                Start Your Listing
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="mailto:support@vilo.com"
                className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-full font-medium backdrop-blur-sm border border-white/20 hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
            </div>
            <p className="mt-8 text-sm text-white/70">
              Questions? Email us at{' '}
              <a href="mailto:support@vilo.com" className="underline hover:text-white">
                support@vilo.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </PublicLayout>
  );
};
