/**
 * EnhancedAddonCard Component
 *
 * Modern add-on card with color states and professional design
 */

import React from 'react';
import type { EnhancedAddonCardProps } from './EnhancedAddonCard.types';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/types/booking.types';

export const EnhancedAddonCard: React.FC<EnhancedAddonCardProps> = ({ addon, currency }) => {
  return (
    <Card
      variant="bordered"
      className="border-2 border-gray-200 dark:border-gray-700 hover:border-info/50 hover:bg-info/5 transition-all duration-200"
    >
      <Card.Body className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon or Image */}
          <div className="w-16 h-16 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {addon.image_url ? (
              <img
                src={addon.image_url}
                alt={addon.addon_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-8 h-8 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {addon.addon_name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {formatCurrency(addon.unit_price, currency)} × {addon.quantity}
            </p>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold text-info">
              {formatCurrency(addon.addon_total, currency)}
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
