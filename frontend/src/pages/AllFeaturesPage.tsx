/**
 * All Features Page
 * Comprehensive overview of all Vilo features
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';
import { featureCategories } from '@/data/features';

export const AllFeaturesPage: React.FC = () => {
  return (
    <PublicLayout transparentHeader menuType="for-hosts">
      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 dark:from-gray-950 dark:via-gray-950 dark:to-black overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Everything You Need to Run Your Vacation Rental Business
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              From booking management to guest reviews, Vilo provides all the tools you need to succeed — with 0% commission
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all border border-white/20 hover:border-white/40"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features by Category */}
      <section className="py-20 bg-white dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {featureCategories.map((category, categoryIndex) => (
            <div
              key={category.id}
              className={categoryIndex > 0 ? 'mt-20' : ''}
            >
              {/* Category Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {category.name}
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 ml-15">
                  {category.description}
                </p>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.features.map((feature) => (
                  <Link
                    key={feature.slug}
                    to={`/for-hosts/feature/${feature.slug}`}
                    className="group bg-gray-50 dark:bg-dark-card rounded-2xl p-6 border border-gray-200 dark:border-dark-border hover:border-primary dark:hover:border-primary hover:shadow-xl transition-all duration-200"
                  >
                    {/* Feature Icon */}
                    <div className="w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 group-hover:bg-primary group-hover:scale-110 flex items-center justify-center mb-4 transition-all duration-200">
                      <svg
                        className="w-7 h-7 text-primary group-hover:text-white transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={feature.icon}
                        />
                      </svg>
                    </div>

                    {/* Feature Name */}
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                      {feature.name}
                    </h3>

                    {/* Feature Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {feature.shortDescription}
                    </p>

                    {/* Learn More Link */}
                    <div className="flex items-center gap-2 text-primary font-medium text-sm">
                      Learn more
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary/90 to-teal-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Vacation Rental Business?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-10">
            Join 500+ property owners who save hours every week with Vilo. 14-day free trial, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-10 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all border-2 border-white/40 hover:border-white/60"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
