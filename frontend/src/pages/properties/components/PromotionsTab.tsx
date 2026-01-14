/**
 * PromotionsTab Component
 *
 * Displays all promotions for rooms in this property
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Alert } from '@/components/ui';
import { roomService } from '@/services';
import type { RoomPromotion } from '@/types/room.types';

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

const BedIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

interface PromotionsTabProps {
  propertyId: string;
}

interface RoomWithPromotions {
  room_id: string;
  room_name: string;
  promotions: RoomPromotion[];
}

export const PromotionsTab: React.FC<PromotionsTabProps> = ({ propertyId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomPromotions, setRoomPromotions] = useState<RoomWithPromotions[]>([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all rooms for this property
        const response = await roomService.getRooms({ property_id: propertyId });

        // Filter rooms that have promotions
        const roomsWithPromotions = response.rooms
          .filter((room) => room.promotions && room.promotions.length > 0)
          .map((room) => ({
            room_id: room.id,
            room_name: room.name,
            promotions: room.promotions,
          }));

        setRoomPromotions(roomsWithPromotions);
      } catch (err) {
        console.error('Failed to fetch room promotions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load promotions');
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [propertyId]);

  // Helper to check if a promotion is active
  const isPromotionActive = (promotion: RoomPromotion): boolean => {
    const now = new Date();
    const start = promotion.valid_from ? new Date(promotion.valid_from) : null;
    const end = promotion.valid_until ? new Date(promotion.valid_until) : null;

    if (start && now < start) return false; // Not started yet
    if (end && now > end) return false; // Already ended

    return true;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading promotions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="error" className="mb-4">
        {error}
      </Alert>
    );
  }

  // Empty state
  if (roomPromotions.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center">
            <TagIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Promotions Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Promotions are created at the room level. Go to your rooms and add special offers to attract more bookings.
          </p>
        </div>
      </Card>
    );
  }

  // Display promotions grouped by room
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Promotions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {roomPromotions.reduce((sum, room) => sum + room.promotions.length, 0)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Promotions</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {roomPromotions.reduce(
                (sum, room) => sum + room.promotions.filter(isPromotionActive).length,
                0
              )}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rooms with Offers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {roomPromotions.length}
            </p>
          </div>
        </Card>
      </div>

      {/* Promotions by Room */}
      {roomPromotions.map((roomPromo) => (
        <Card key={roomPromo.room_id}>
          <div className="p-6 space-y-4">
            {/* Room Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-dark-border">
              <BedIcon />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {roomPromo.room_name}
              </h3>
              <Badge variant="default" size="sm">
                {roomPromo.promotions.length} {roomPromo.promotions.length === 1 ? 'offer' : 'offers'}
              </Badge>
            </div>

            {/* Promotions List */}
            <div className="space-y-3">
              {roomPromo.promotions.map((promo, index) => {
                const isActive = isPromotionActive(promo);
                return (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary/50 dark:hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <TagIcon />
                      </div>

                      <div className="flex-1">
                        {/* Code and Discount */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">
                            {promo.code}
                          </span>
                          <Badge
                            variant={isActive ? 'success' : 'default'}
                            size="sm"
                          >
                            {promo.discount_value}
                            {promo.discount_type === 'percentage' ? '%' : ''} off
                          </Badge>
                          {isActive ? (
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        {promo.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {promo.description}
                          </p>
                        )}

                        {/* Date Range */}
                        {(promo.valid_from || promo.valid_until) && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <CalendarIcon />
                            <span>
                              {promo.valid_from && (
                                <>Valid from {new Date(promo.valid_from).toLocaleDateString()}</>
                              )}
                              {promo.valid_from && promo.valid_until && ' - '}
                              {promo.valid_until && (
                                <>until {new Date(promo.valid_until).toLocaleDateString()}</>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
