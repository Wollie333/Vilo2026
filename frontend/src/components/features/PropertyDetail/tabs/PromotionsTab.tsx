/**
 * PromotionsTab Component
 *
 * Displays all active promotions/special offers for rooms on the public property page
 */

import React, { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { ClaimPromoModal } from '@/components/features';
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

export const PromotionsTab: React.FC<PromotionsTabProps> = ({ rooms, currency, propertyId, propertyName }) => {
  console.log('🎟️ [PromotionsTab] Received rooms:', rooms?.length || 0);

  // State for claim promo modal
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);

  // Handler for claiming a promotion
  const handleClaimPromo = (promo: any) => {
    console.log('🎟️ [PromotionsTab] Claiming promo:', promo.name);
    setSelectedPromo(promo);
    setClaimModalOpen(true);
  };

  // Collect all unique promotions across all rooms
  const allPromotionsMap = new Map();
  const roomsByPromotion = new Map<string, string[]>();

  rooms.forEach(room => {
    (room.promotions || []).forEach(promo => {
      // Add to unique promotions
      if (!allPromotionsMap.has(promo.id)) {
        allPromotionsMap.set(promo.id, promo);
        roomsByPromotion.set(promo.id, []);
      }
      // Track which rooms have this promotion
      roomsByPromotion.get(promo.id)?.push(room.name);
    });
  });

  const allPromotions = Array.from(allPromotionsMap.values());
  console.log('🎟️ [PromotionsTab] Total unique promotions:', allPromotions.length);
  console.log('🎟️ [PromotionsTab] All promotions:', allPromotions);

  // Filter active promotions by validity period
  const now = new Date();
  console.log('🎟️ [PromotionsTab] Current date:', now);

  const activePromotions = allPromotions.filter(promo => {
    console.log(`🎟️ Checking promo "${promo.name}":`, {
      valid_from: promo.valid_from,
      valid_until: promo.valid_until,
      is_active: promo.is_active,
    });

    const start = promo.valid_from ? new Date(promo.valid_from) : null;
    const end = promo.valid_until ? new Date(promo.valid_until) : null;

    console.log(`  Parsed dates - start: ${start}, end: ${end}, now: ${now}`);

    if (start && now < start) {
      console.log(`  ❌ Promo "${promo.name}" not started yet (starts ${start})`);
      return false;
    }
    if (end && now > end) {
      console.log(`  ❌ Promo "${promo.name}" already ended (ended ${end})`);
      return false;
    }

    const isActive = promo.is_active !== false;
    console.log(`  ${isActive ? '✅' : '❌'} Promo "${promo.name}" is_active: ${promo.is_active}`);
    return isActive;
  });

  console.log('🎟️ [PromotionsTab] Active promotions:', activePromotions.length);
  console.log('🎟️ [PromotionsTab] Active promotions data:', activePromotions);

  // Empty state
  if (activePromotions.length === 0) {
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
            Book now and save with these exclusive deals - {activePromotions.length} {activePromotions.length === 1 ? 'offer' : 'offers'} available
          </p>
        </div>
      </div>

      {/* All Promotions */}
      <div className="space-y-3">
        {activePromotions.map((promo) => {
          const applicableRooms = roomsByPromotion.get(promo.id) || [];
          const isPropertyWide = applicableRooms.length === rooms.length;

          return (
            <div
              key={promo.id}
              className="flex items-start justify-between gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30"
            >
              {/* Left Side: Icon + Content */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <TagIcon />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Name and Badge */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {promo.name}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                      {promo.discount_type === 'percentage'
                        ? `${promo.discount_value}% OFF`
                        : promo.discount_type === 'fixed_amount'
                        ? `${currency} ${promo.discount_value} OFF`
                        : `${promo.discount_value} Free Nights`
                      }
                    </span>
                    {isPropertyWide && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        All Rooms
                      </span>
                    )}
                  </div>

                  {/* Applicable Rooms */}
                  {!isPropertyWide && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Applicable to: {applicableRooms.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Promo Code - hide if claimable */}
                  {!promo.is_claimable && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Use code: </span>
                      <code className="px-2 py-1 bg-white dark:bg-dark-card rounded border border-gray-200 dark:border-dark-border font-mono text-sm font-semibold text-primary">
                        {promo.code}
                      </code>
                    </div>
                  )}

                  {/* Helper text for claimable promos */}
                  {promo.is_claimable && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Provide your details to receive this exclusive offer
                    </p>
                  )}

                  {/* Description */}
                  {promo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {promo.description}
                    </p>
                  )}

                  {/* Validity Period */}
                  {(promo.valid_from || promo.valid_until) && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
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
                      {promo.current_uses !== undefined && ` • ${promo.current_uses} already used`}
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

              {/* Right Side: Claim Button (if claimable) */}
              {promo.is_claimable && (
                <div className="flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleClaimPromo(promo)}
                  >
                    Claim This Promo
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

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

      {/* Claim Promo Modal */}
      {claimModalOpen && selectedPromo && (
        <ClaimPromoModal
          promotion={selectedPromo}
          propertyId={propertyId}
          propertyName={propertyName}
          onClose={() => {
            setClaimModalOpen(false);
            setSelectedPromo(null);
          }}
          onSuccess={() => {
            setClaimModalOpen(false);
            setSelectedPromo(null);
          }}
        />
      )}
    </div>
  );
};
