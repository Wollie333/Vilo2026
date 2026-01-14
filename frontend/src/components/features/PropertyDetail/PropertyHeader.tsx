/**
 * PropertyHeader Component
 *
 * Property title, location, rating, and category badges
 */

import React from 'react';
import { HiStar, HiLocationMarker } from 'react-icons/hi';
import { Badge } from '@/components/ui';
import type { PropertyHeaderProps } from './PropertyHeader.types';

export const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  name,
  listingTitle,
  propertyType,
  city,
  province,
  country,
  overallRating,
  reviewCount,
  categories,
}) => {
  const displayTitle = listingTitle || name;
  const locationParts = [city, province, country].filter(Boolean);
  const locationText = locationParts.join(', ');

  // Format property type for display (capitalize first letter of each word)
  const formatPropertyType = (type: string | null) => {
    if (!type) return null;

    // Special case for Bed & Breakfast
    if (type.toLowerCase() === 'bnb' || type.toLowerCase() === 'b&b') {
      return 'Bed & Breakfast';
    }

    return type
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formattedPropertyType = formatPropertyType(propertyType);

  return (
    <div className="space-y-4">
      {/* Property Title with Verified Badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          {displayTitle}
        </h1>

        {/* Vilo Verified Badge */}
        <div
          className="flex-shrink-0 bg-white dark:bg-dark-card rounded-full p-2 shadow-md group/badge relative cursor-pointer"
        >
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center transition-all duration-300 group-hover/badge:shadow-[0_0_30px_15px_rgba(4,120,87,0.4),0_0_60px_30px_rgba(4,120,87,0.2)] group-hover/badge:animate-pulse">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          {/* Tooltip */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-[99]">
            Vilo Verified
          </div>
        </div>
      </div>

      {/* Property Type & Category Badges */}
      {(formattedPropertyType || categories.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Property Type Badge */}
          {formattedPropertyType && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary-700 dark:bg-primary/20 dark:text-primary-300">
              {formattedPropertyType}
            </span>
          )}

          {/* Category Badges - Smaller */}
          {categories.map((category) => (
            <span key={category} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {category}
            </span>
          ))}
        </div>
      )}

      {/* Location & Rating Row */}
      <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
        {/* Location */}
        {locationText && (
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <HiLocationMarker className="w-5 h-5" />
            <span>{locationText}</span>
          </div>
        )}

        {/* Rating */}
        {overallRating !== null && (
          <div className="flex items-center gap-1">
            <HiStar className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {overallRating.toFixed(1)}
            </span>
            {reviewCount > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
