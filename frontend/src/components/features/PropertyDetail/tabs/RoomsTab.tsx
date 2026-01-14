/**
 * RoomsTab Component
 *
 * Display available rooms with pricing and reserve buttons
 * Using the same card design as search results list view
 */

import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RoomsTabProps } from './RoomsTab.types';

export const RoomsTab: React.FC<RoomsTabProps> = ({
  rooms,
  currency,
  onReserve,
}) => {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No rooms are currently available for booking.
        </p>
      </div>
    );
  }

  // Filter out inactive or paused rooms
  const availableRooms = rooms.filter((room) => room.is_active && !room.is_paused);

  if (availableRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No rooms are currently available for booking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {availableRooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          currency={currency}
          onReserve={onReserve}
        />
      ))}
    </div>
  );
};

// RoomCard Component (matching PropertyCard list/compact design)
interface RoomCardProps {
  room: any;
  currency: string;
  onReserve: (roomId: string) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, currency, onReserve }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all available images (extract URLs from gallery_images objects)
  const allImages = [
    room.featured_image,
    ...(room.gallery_images?.map((img: any) => img.url || img) || []),
  ].filter(Boolean);

  const hasMultipleImages = allImages.length > 1;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const formatPrice = (price: number) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  return (
    <div className="group hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border relative">
      {/* Review Stars Badge - Top Right Corner of Card */}
      <div className="absolute top-3 right-3 bg-white dark:bg-dark-card px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 z-20 border border-gray-200 dark:border-dark-border">
        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
        <span className="text-sm font-bold text-gray-900 dark:text-white">4.5</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Room Image - 1/3 width with Carousel */}
        <div className="aspect-[16/10] md:aspect-auto relative md:col-span-1 group/image">
          <img
            src={allImages[currentImageIndex] || '/images/placeholder-room.jpg'}
            alt={`${room.name} - Image ${currentImageIndex + 1}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300"
          />

          {/* Room Code Badge */}
          {room.room_code && (
            <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {room.room_code}
            </div>
          )}

          {/* Vilo Verified Badge */}
          <div className="absolute bottom-3 left-3 bg-white dark:bg-dark-card rounded-full p-1.5 shadow-lg group/badge z-10 cursor-pointer">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center transition-all duration-300 group-hover/badge:shadow-[0_0_30px_15px_rgba(4,120,87,0.4),0_0_60px_30px_rgba(4,120,87,0.2)] group-hover/badge:animate-pulse">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-[99]">
              Vilo Verified
            </div>
          </div>

          {/* Carousel Controls */}
          {hasMultipleImages && (
            <>
              {/* Previous Button */}
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-full shadow-lg opacity-0 group-hover/image:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Next Button */}
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-full shadow-lg opacity-0 group-hover/image:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Image Counter Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Room Details - 2/3 width */}
        <div className="p-5 flex flex-col h-full md:col-span-2">
          <div className="flex-1">
            {/* Header with Room Name */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 line-clamp-1">
                  {room.name}
                </h3>
              </div>
            </div>

            {/* Description */}
            {room.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {room.description}
              </p>
            )}

            {/* Capacity Info */}
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">{room.max_guests}</span>
                <span className="text-gray-500 dark:text-gray-400">max guests</span>
              </div>
              {room.max_adults && (
                <span className="text-gray-500 dark:text-gray-400">
                  ({room.max_adults} adults{room.max_children ? `, ${room.max_children} children` : ''})
                </span>
              )}
            </div>

            {/* Bed Configuration Pills */}
            {room.beds && room.beds.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Beds
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {room.beds.map((bed: any, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full"
                    >
                      {bed.quantity}x {bed.bed_type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities Pills */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Amenities
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {room.amenities.slice(0, 6).map((amenity: string) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center text-xs text-gray-700 dark:text-gray-100 bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/20"
                    >
                      {amenity}
                    </span>
                  ))}
                  {room.amenities.length > 6 && (
                    <span className="inline-flex items-center text-xs text-gray-600 dark:text-gray-200 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/10">
                      +{room.amenities.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Min/Max Nights */}
            {(room.min_nights || room.max_nights) && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {room.min_nights && `Minimum ${room.min_nights} night${room.min_nights > 1 ? 's' : ''}`}
                {room.min_nights && room.max_nights && ' • '}
                {room.max_nights && `Maximum ${room.max_nights} night${room.max_nights > 1 ? 's' : ''}`}
              </div>
            )}
          </div>

          {/* Price and CTA Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(room.base_price_per_night)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400"> / night</span>
              {(room.additional_person_rate ?? 0) > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  +{formatPrice(room.additional_person_rate)} per additional guest
                </div>
              )}
            </div>
            <button
              onClick={() => onReserve(room.id)}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
