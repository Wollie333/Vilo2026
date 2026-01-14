/**
 * EnhancedRoomCard Component
 *
 * Modern room card with hover effects, icons, and enhanced styling
 */

import React from 'react';
import type { EnhancedRoomCardProps } from './EnhancedRoomCard.types';
import { Card, Badge, UsersIcon, UserIcon } from '@/components/ui';
import { formatCurrency } from '@/types/booking.types';

export const EnhancedRoomCard: React.FC<EnhancedRoomCardProps> = ({ room, currency }) => {
  return (
    <Card
      variant="elevated"
      className="border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
    >
      <Card.Body className="p-5">
        <div className="flex gap-4">
          {/* Room Image - Larger */}
          <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 group">
            {room.featured_image ? (
              <>
                <img
                  src={room.featured_image}
                  alt={room.room_name}
                  className="w-full h-full object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            )}
          </div>

          {/* Room Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {room.room_name}
                </h3>
                {room.room_code && (
                  <Badge variant="primary" size="sm" className="mt-1">
                    {room.room_code}
                  </Badge>
                )}
              </div>

              {/* Price - Prominent */}
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(room.room_subtotal, currency)}
                </p>
                <p className="text-xs text-gray-500">Room Total</p>
              </div>
            </div>

            {/* Guest Counts with Icons */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <UsersIcon size="sm" className="text-primary" />
                <span>{room.adults} adult{room.adults !== 1 ? 's' : ''}</span>
              </div>
              {room.children > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <UserIcon size="sm" className="text-info" />
                  <span>{room.children} child{room.children !== 1 ? 'ren' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
