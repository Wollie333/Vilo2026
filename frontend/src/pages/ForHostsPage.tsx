/**
 * ForHostsPage Component
 * Marketing page for property hosts showcasing zero commission platform
 * Duplicates design from vilo-for-hosts-FINAL.html
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';

export const ForHostsPage: React.FC = () => {
  return (
    <PublicLayout transparentHeader menuType="for-hosts">
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
              <span>Zero commission fees ever</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-white dark:text-gray-50 mb-8 leading-tight">
              Your bookings.
              <br />
              <span className="text-white/60 dark:text-gray-400">Your guests.</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                Your revenue.
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-xl text-white/80 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Manage properties, accept payments, and build guest relationships — all without OTA commission fees.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-primary dark:bg-primary text-white px-8 py-4 rounded-full font-medium shadow-lg shadow-primary/25 dark:shadow-primary/40 hover:bg-primary/90 dark:hover:bg-primary/80 transition-all"
              >
                Get Started
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
                No Fees ever, keep 100% profits
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Setup in 10 minutes
              </span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-[-1rem] bg-gradient-to-r from-primary/20 via-teal-500/20 to-primary/20 dark:from-primary/30 dark:via-teal-500/30 dark:to-primary/30 rounded-3xl blur-3xl opacity-60 dark:opacity-80" />

            {/* Notification Toast - Desktop Only - Matches Real Design */}
            <div className="hidden xl:block absolute -top-8 -right-4 w-96 z-50 animate-[fadeSlideIn_0.8s_ease-out_0.5s_forwards,float_4s_ease-in-out_1.3s_infinite] opacity-0">
              <div className="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-2xl border border-gray-200 dark:border-dark-border">
                {/* Notification Item - Matches real notification style */}
                <div className="p-4 border-l-4 border-primary bg-emerald-50/50 dark:bg-emerald-900/10">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          New Booking Confirmed
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Just now</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        John Davis booked your Deluxe Suite for 3 nights
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-sm font-bold text-primary dark:text-emerald-400">
                          +R2,400.00
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Jan 15-18, 2026
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Card - Matches Real PropertyOwnerDashboard */}
            <div className="relative bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-dark-border">
              {/* Dashboard Header - Matches AuthenticatedLayout */}
              <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Property Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitor your properties and bookings</p>
              </div>

              {/* Dashboard Body */}
              <div className="bg-gray-50 dark:bg-dark-bg p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Stat Card 1 - Total Bookings */}
                  <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Total Bookings
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          156
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs font-medium text-success dark:text-success">
                            +12%
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            this month
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Stat Card 2 - Revenue (Success variant with green) */}
                  <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Revenue
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          R245,800
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs font-medium text-success dark:text-success">
                            +23%
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            this month
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-success-light dark:bg-success/20">
                        <svg className="w-5 h-5 text-success dark:text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Stat Card 3 - Occupancy */}
                  <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Occupancy Rate
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          87%
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs font-medium text-success dark:text-success">
                            +5%
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            this month
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Stat Card 4 - Properties */}
                  <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Active Properties
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          3
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            All listings active
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zero Commission Highlight Banner */}
                <div className="mt-6 bg-gradient-to-r from-primary/10 to-emerald-500/10 dark:from-primary/20 dark:to-emerald-500/20 border-2 border-primary dark:border-primary/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          100% of revenue is yours — R0 in commission fees
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          Unlike Airbnb or Booking.com charging 15-20% per booking
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full whitespace-nowrap">
                      0% FEES
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Section */}
      <section id="features" className="py-28 md:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Platform Impact</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Real Results, Real Savings
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Every rand processed through Vilo stays with our hosts. No hidden fees, no commission cuts.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Stat 1 - Total Revenue */}
            <div className="relative bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</span>
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">R0</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue generated for users</p>
              <div className="absolute top-6 right-6 bg-emerald-50 dark:bg-emerald-900/20 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                100% to hosts
              </div>
            </div>

            {/* Stat 2 - Fees Saved (Featured) */}
            <div className="relative bg-gradient-to-br from-primary to-primary/80 text-white p-6 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-emerald-200 uppercase tracking-wider">Fees Saved</span>
              </div>
              <div className="text-4xl font-bold mb-1">R0</div>
              <p className="text-sm text-emerald-200">Based on 15% OTA industry average</p>
              <div className="absolute top-6 right-6 bg-white text-primary text-xs font-semibold px-2 py-1 rounded-full">
                0% Vilo fees
              </div>
            </div>

            {/* Stat 3 - Properties */}
            <div className="relative bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Properties</span>
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">0</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active on Vilo</p>
            </div>

            {/* Stat 4 - Bookings */}
            <div className="relative bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bookings</span>
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">0</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Successful reservations</p>
            </div>
          </div>

          {/* Zero Commission Badge */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 bg-gray-900 dark:bg-black text-white px-6 py-3 rounded-full border border-gray-800 dark:border-gray-700">
              <svg className="w-5 h-5 text-red-400 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span className="text-sm font-medium">
                <span className="text-red-400 dark:text-red-500 font-bold">R0</span> in commission fees — we never take a cut of your bookings
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="pricing" className="py-28 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center max-w-7xl mx-auto">
            {/* Problem Content */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">The Problem</p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                OTAs are eating<br />your profits
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Every booking through Booking.com, Airbnb, or other platforms costs you 15-20% in commission.
                On a R1,000/night room, that's R150 gone — every single night.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  15-20% commission on every booking
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  No control over guest relationships
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Competing with your own listing
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hidden fees that add up fast
                </div>
              </div>
            </div>

            {/* Comparison Card */}
            <div className="bg-gray-800 dark:bg-black rounded-3xl p-10 text-white border border-gray-700 dark:border-gray-800">
              <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">Your annual loss to OTAs</div>
              <div className="text-5xl font-bold text-red-400 dark:text-red-500 mb-1">-R54,750</div>
              <div className="text-sm text-gray-500 dark:text-gray-600 mb-8">Based on 1 room at R1,000/night, 75% occupancy</div>
              <div className="border-t border-gray-700 dark:border-gray-800 pt-8">
                <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">With Vilo you keep</div>
                <div className="text-5xl font-bold text-emerald-400 dark:text-emerald-300 mb-1">+R54,750</div>
                <div className="text-sm text-gray-500 dark:text-gray-600">100% of your booking revenue</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section - Placeholder */}
      <section id="resources" className="py-28 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Resources</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Documentation, guides, and support to help you get the most out of Vilo.
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

export default ForHostsPage;
