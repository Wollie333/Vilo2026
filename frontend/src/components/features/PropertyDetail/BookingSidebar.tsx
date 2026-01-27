/**
 * BookingSidebar Component
 *
 * Sticky sidebar with pricing and reservation CTA
 */

import React from 'react';
import { HiStar } from 'react-icons/hi';
import { Button } from '@/components/ui';
import type { BookingSidebarProps } from './BookingSidebar.types';

export const BookingSidebar: React.FC<BookingSidebarProps> = ({
  minPrice,
  currency,
  rating,
  reviewCount,
  companyName,
  companyLogo,
  onReserve,
  onMessageHost,
  onRequestQuote,
}) => {
  return (
    <div className="lg:sticky lg:top-6 z-20 border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-lg bg-white dark:bg-dark-card" style={{ boxShadow: '0 10px 40px rgba(4, 120, 87, 0.15), 0 4px 12px rgba(4, 120, 87, 0.1)' }}>
      {/* Pricing */}
      <div className="mb-6 text-center">
        {minPrice !== null ? (
          <div>
            <div className="flex items-baseline gap-2 justify-center">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {currency} {minPrice.toLocaleString()}
              </span>
              <span className="text-xl text-gray-600 dark:text-gray-400">/ night</span>
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
              Starting price
            </p>
          </div>
        ) : (
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Contact for pricing
          </div>
        )}
      </div>

      {/* Rating */}
      {rating !== null && (
        <div className="flex items-center gap-2 mb-6">
          <HiStar className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {rating.toFixed(1)}
          </span>
          {reviewCount > 0 && (
            <span className="text-gray-600 dark:text-gray-400">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </div>
      )}

      {/* Primary CTA - Reserve Now */}
      <Button
        variant="primary"
        className="w-full mb-3 text-xl font-bold py-5 px-8"
        onClick={onReserve}
      >
        Reserve Now
      </Button>

      {/* Secondary CTA - Request Quote */}
      {onRequestQuote && (
        <Button
          variant="outline"
          className="w-full mb-3 text-base font-medium py-4"
          onClick={onRequestQuote}
        >
          Request Custom Quote
        </Button>
      )}

      {/* Secondary CTA - Message Host */}
      <Button
        variant="outline"
        className="w-full text-base font-medium py-4"
        onClick={onMessageHost}
      >
        Message Host
      </Button>
    </div>
  );
};
