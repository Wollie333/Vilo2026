/**
 * PromotionsTab Component
 *
 * Displays all active promotions/special offers for rooms on the public property page
 */

import React from 'react';
import { Card } from '@/components/ui';
import type { PromotionsTabProps } from './PromotionsTab.types';

// Icons
const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export const PromotionsTab: React.FC<PromotionsTabProps> = ({ rooms, currency }) => {
  // Filter rooms that have active promotions
  const roomsWithPromotions = rooms
    .map(room => ({
      ...room,
      activePromotions: (room.promotions || []).filter(promo => {
        const now = new Date();
        const start = promo.valid_from ? new Date(promo.valid_from) : null;
        const end = promo.valid_until ? new Date(promo.valid_until) : null;

        if (start && now < start) return false; // Not started yet
        if (end && now > end) return false; // Already ended

        return promo.is_active !== false; // Check is_active flag
      })
    }))
    .filter(room => room.activePromotions.length > 0);

  // Empty state
  if (roomsWithPromotions.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center text-gray-400">
            <TagIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Active Promotions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check back soon for special offers and discounts
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SparklesIcon />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Special Offers & Promotions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Book now and save with these exclusive deals
          </p>
        </div>
      </div>

      {/* Promotions by Room */}
      {roomsWithPromotions.map((room) => (
        <Card key={room.id}>
          <div className="p-6 space-y-4">
            {/* Room Name */}
            <div className="pb-3 border-b border-gray-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {room.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {room.activePromotions.length} {room.activePromotions.length === 1 ? 'offer' : 'offers'} available
              </p>
            </div>

            {/* Promotions List */}
            <div className="space-y-3">
              {room.activePromotions.map((promo, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <TagIcon />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Name and Badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {promo.name}
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                        {promo.discount_type === 'percentage'
                          ? `${promo.discount_value}% OFF`
                          : promo.discount_type === 'fixed_amount'
                          ? `${currency}${promo.discount_value} OFF`
                          : `${promo.discount_value} Free Nights`
                        }
                      </span>
                    </div>

                    {/* Promo Code */}
                    <div className="mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Use code: </span>
                      <code className="px-2 py-1 bg-white dark:bg-dark-card rounded border border-gray-200 dark:border-dark-border font-mono text-sm font-semibold text-primary">
                        {promo.code}
                      </code>
                    </div>

                    {/* Description */}
                    {promo.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {promo.description}
                      </p>
                    )}

                    {/* Validity Period */}
                    {(promo.valid_from || promo.valid_until) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <CalendarIcon />
                        <span>
                          {promo.valid_from && promo.valid_until ? (
                            <>
                              Valid from {new Date(promo.valid_from).toLocaleDateString()}
                              {' '}to {new Date(promo.valid_until).toLocaleDateString()}
                            </>
                          ) : promo.valid_from ? (
                            <>Valid from {new Date(promo.valid_from).toLocaleDateString()}</>
                          ) : promo.valid_until ? (
                            <>Valid until {new Date(promo.valid_until).toLocaleDateString()}</>
                          ) : null}
                        </span>
                      </div>
                    )}

                    {/* Usage Limits */}
                    {promo.max_uses && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Limited to {promo.max_uses} bookings
                        {promo.uses_count !== undefined && ` • ${promo.uses_count} already used`}
                      </p>
                    )}

                    {/* Minimum Stay */}
                    {promo.min_nights && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Minimum stay: {promo.min_nights} {promo.min_nights === 1 ? 'night' : 'nights'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {/* How to Use Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How to Use Promo Codes
          </h3>
          <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">1</span>
              <span>Choose your room and dates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">2</span>
              <span>Enter the promo code at checkout</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">3</span>
              <span>Enjoy your discount on the total price</span>
            </li>
          </ol>
        </div>
      </Card>
    </div>
  );
};
