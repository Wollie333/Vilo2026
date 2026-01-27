/**
 * CategoriesMegaMenu Component
 * Dropdown menu for accommodation search categories and filters
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accommodationCategories } from '@/data/categories';

interface CategoriesMegaMenuProps {
  transparentHeader?: boolean;
  isScrolled?: boolean;
}

export const CategoriesMegaMenu: React.FC<CategoriesMegaMenuProps> = ({
  transparentHeader = false,
  isScrolled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCategoryClick = (slug: string) => {
    navigate(`/search?category=${slug}`);
    setIsOpen(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger Button */}
      <button
        className={`flex items-center gap-1 transition-colors py-2 font-medium ${
          transparentHeader && !isScrolled
            ? 'text-white drop-shadow-lg hover:text-white/80'
            : 'text-gray-700 dark:text-gray-300 hover:text-primary'
        }`}
      >
        Categories
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[780px] max-w-[90vw] z-50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-dark-bg px-5 py-3 border-b border-gray-200 dark:border-dark-border">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Browse Categories
              </h3>
            </div>

            {/* Scrollable Content */}
            <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
              {/* Categories Grid by Group */}
              <div className="p-4">
                {accommodationCategories.map((group, groupIndex) => (
                  <div key={group.title} className={groupIndex > 0 ? 'mt-5' : ''}>
                    {/* Group Title */}
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 px-1">
                      {group.title}
                    </h4>

                    {/* Categories Grid - 4 columns for better fit */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {group.categories.map((category) => (
                        <button
                          key={category.slug}
                          onClick={() => handleCategoryClick(category.slug)}
                          className="group flex flex-col items-start bg-gray-50 dark:bg-dark-bg rounded-lg p-3 border border-gray-200 dark:border-dark-border hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 text-left"
                        >
                          {/* Icon + Name Row */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-7 h-7 rounded-md bg-primary/10 dark:bg-primary/20 group-hover:bg-primary flex items-center justify-center transition-all duration-200 flex-shrink-0">
                              <svg
                                className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={category.icon}
                                />
                              </svg>
                            </div>
                            <h5 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-primary dark:group-hover:text-primary transition-colors leading-tight">
                              {category.name}
                            </h5>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                            {category.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-dark-bg px-5 py-2.5 border-t border-gray-200 dark:border-dark-border flex items-center justify-center">
              <Link
                to="/search"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
                onClick={() => setIsOpen(false)}
              >
                Advanced Search
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

// Mobile Version
export const CategoriesMegaMenuMobile: React.FC = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (slug: string) => {
    navigate(`/search?category=${slug}`);
  };

  return (
    <div className="space-y-4 py-2">
      {accommodationCategories.map((group) => (
        <div key={group.title}>
          {/* Group Title */}
          <div className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
            {group.title}
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {group.categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => handleCategoryClick(category.slug)}
                className="w-full block bg-gray-50 dark:bg-dark-bg rounded-lg p-3 border border-gray-200 dark:border-dark-border active:border-primary active:bg-primary/5"
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
                        d={category.icon}
                      />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">
                      {category.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {category.description}
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
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* View All Link */}
      <Link
        to="/search"
        className="block text-center py-3 text-sm font-semibold text-primary border-t border-gray-200 dark:border-dark-border mt-3 pt-3"
      >
        Advanced Search →
      </Link>
    </div>
  );
};
