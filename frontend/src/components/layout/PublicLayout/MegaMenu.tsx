/**
 * MegaMenu Component
 * Categorized dropdown menu for features navigation
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { featureCategories } from '@/data/features';

export const MegaMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger Button */}
      <button className="flex items-center gap-1 text-white hover:text-primary transition-colors py-2">
        Features
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu - Modern Card Design */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[1100px] max-w-[95vw] z-50">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/5 via-teal-500/5 to-primary/5 dark:from-primary/10 dark:via-teal-500/10 dark:to-primary/10 px-6 py-3 border-b border-gray-200 dark:border-dark-border">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Features</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Everything you need to manage your vacation rental business
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3">
                {featureCategories.flatMap((category) =>
                  category.features.map((feature) => (
                    <Link
                      key={feature.slug}
                      to={`/for-hosts/feature/${feature.slug}`}
                      className="group relative bg-gray-50 dark:bg-dark-bg rounded-xl p-3 border border-gray-200 dark:border-dark-border hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all duration-200"
                    >
                      {/* Feature Icon */}
                      <div className="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 group-hover:bg-primary group-hover:scale-110 flex items-center justify-center mb-2.5 transition-all duration-200">
                        <svg
                          className="w-5 h-5 text-primary group-hover:text-white transition-colors"
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
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm group-hover:text-primary dark:group-hover:text-primary transition-colors">
                        {feature.name}
                      </h4>

                      {/* Feature Description */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                        {feature.shortDescription}
                      </p>

                      {/* Hover Arrow */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-4 h-4 text-primary"
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
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-dark-bg px-6 py-3 border-t border-gray-200 dark:border-dark-border flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Explore all features and see how Vilo can transform your business
              </p>
              <Link
                to="/for-hosts/features"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
              >
                View All Features
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mobile Card List Version
export const MegaMenuMobile: React.FC = () => {
  return (
    <div className="space-y-3 py-2">
      <div className="font-semibold text-gray-900 dark:text-white mb-3">All Features</div>

      {/* Flat list of all features as cards */}
      {featureCategories.flatMap((category) =>
        category.features.map((feature) => (
          <Link
            key={feature.slug}
            to={`/for-hosts/feature/${feature.slug}`}
            className="block bg-gray-50 dark:bg-dark-bg rounded-lg p-3 border border-gray-200 dark:border-dark-border active:border-primary active:bg-primary/5"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-primary"
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

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">
                  {feature.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {feature.shortDescription}
                </p>
              </div>

              {/* Arrow */}
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1"
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
        ))
      )}

      {/* View All Link */}
      <Link
        to="/for-hosts/features"
        className="block text-center py-3 text-sm font-semibold text-primary border-t border-gray-200 dark:border-dark-border mt-3 pt-3"
      >
        View All Features →
      </Link>
    </div>
  );
};
