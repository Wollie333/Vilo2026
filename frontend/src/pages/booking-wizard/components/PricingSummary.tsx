/**
 * PricingSummary Component
 *
 * Sticky pricing breakdown sidebar/card showing real-time booking costs
 */

import React from 'react';
import type { PricingBreakdown, RoomSelection, AddOnSelection } from '@/types/booking-wizard.types';

interface PricingSummaryProps {
  pricing: PricingBreakdown | null;
  checkIn: Date | null;
  checkOut: Date | null;
  nights: number;
  propertyName: string;
  propertyImage?: string;
  selectedRooms?: RoomSelection[];
  selectedAddOns?: AddOnSelection[];
  availableAddOns?: any[];
}

export const PricingSummary: React.FC<PricingSummaryProps> = ({
  pricing,
  checkIn,
  checkOut,
  nights,
  propertyName,
  propertyImage,
  selectedRooms = [],
  selectedAddOns = [],
  availableAddOns = [],
}) => {
  if (!pricing) {
    return null;
  }

  const formatPrice = (amount: number) => {
    return `${pricing.currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className="sticky top-6 border border-gray-200 dark:border-dark-border rounded-lg p-6 bg-white dark:bg-dark-card"
      style={{
        boxShadow: '0 10px 40px rgba(4, 120, 87, 0.15), 0 4px 12px rgba(4, 120, 87, 0.1)',
      }}
    >
      {/* Property Thumbnail */}
      {propertyImage && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={propertyImage}
            alt={propertyName}
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {/* Property Name */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 line-clamp-2">
        {propertyName}
      </h3>

      {/* Dates Summary */}
      {checkIn && checkOut && (
        <div className="pb-4 mb-4 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Check-in</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDate(checkIn)}
              </div>
            </div>
            <div className="text-gray-400">→</div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Check-out</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {formatDate(checkOut)}
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="space-y-3 mb-4">
        {/* Room Details */}
        {pricing.rooms_detail && pricing.rooms_detail.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Rooms
            </h4>
            {pricing.rooms_detail.map((room, index) => {
              const selectedRoom = selectedRooms[index];
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2"
                >
                  {/* Room Thumbnail */}
                  {selectedRoom?.featured_image && (
                    <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      <img
                        src={selectedRoom.featured_image}
                        alt={room.room_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex justify-between">
                    <span>
                      {room.room_name} ({room.nights} {room.nights === 1 ? 'night' : 'nights'})
                    </span>
                    <span className="font-medium">{formatPrice(room.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add-ons Details */}
        {pricing.addons_detail && pricing.addons_detail.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Add-ons
            </h4>
            {pricing.addons_detail.map((addon, index) => {
              const selectedAddon = selectedAddOns[index];
              const addonDetail = availableAddOns.find(a => a.id === selectedAddon?.addon_id);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2"
                >
                  {/* Add-on Thumbnail */}
                  {addonDetail?.image_url && (
                    <div className="w-8 h-8 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      <img
                        src={addonDetail.image_url}
                        alt={addon.addon_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex justify-between">
                    <span>
                      {addon.addon_name} (x{addon.quantity})
                    </span>
                    <span className="font-medium">{formatPrice(addon.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Subtotal */}
        <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 pt-3 border-t border-gray-200 dark:border-dark-border">
          <span>Subtotal</span>
          <span>{formatPrice(pricing.subtotal)}</span>
        </div>

        {/* Taxes (if applicable) */}
        {pricing.tax_amount > 0 && (
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Taxes & Fees</span>
            <span>{formatPrice(pricing.tax_amount)}</span>
          </div>
        )}

        {/* Discount (if applicable) */}
        {pricing.discount_amount > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>Discount</span>
            <span>-{formatPrice(pricing.discount_amount)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 dark:border-dark-border">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          Total
        </span>
        <span className="text-2xl font-bold text-primary">
          {formatPrice(pricing.total_amount)}
        </span>
      </div>
    </div>
  );
};
