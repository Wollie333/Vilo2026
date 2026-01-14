/**
 * ListingPreviewCard Component
 *
 * Shows a guest-facing preview of how the property listing will appear.
 * Displays listing title, property type, highlights, amenities, and check-in/out times.
 */

import React from 'react';
import { Card, Badge, Spinner } from '@/components/ui';
import type { ListingPreviewCardProps } from './ListingPreviewCard.types';

// Icons
const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

// Property type display names
const propertyTypeLabels: Record<string, string> = {
  house: 'House',
  apartment: 'Apartment',
  villa: 'Villa',
  cottage: 'Cottage',
  cabin: 'Cabin',
  condo: 'Condo',
  townhouse: 'Townhouse',
  guesthouse: 'Guest House',
  hotel: 'Hotel',
  bnb: 'Bed & Breakfast',
};

// Format time string (e.g., "15:00" -> "3:00 PM")
const formatTime = (time: string | null | undefined): string => {
  if (!time) return '--:--';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const ListingPreviewCard: React.FC<ListingPreviewCardProps> = ({
  property,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No property data</p>
        </div>
      </Card>
    );
  }

  const title = property.listing_title || property.name || 'Untitled Property';
  const propertyType = property.property_type ? propertyTypeLabels[property.property_type] || property.property_type : null;
  const highlights = property.highlights || [];
  const amenities = property.amenities || [];
  const categories = property.categories || [];
  const checkInTime = property.check_in_time;
  const checkOutTime = property.check_out_time;

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-card dark:to-gray-800">
        {property.featured_image_url ? (
          <img
            src={property.featured_image_url}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400 dark:text-gray-500 text-sm">No featured image</span>
          </div>
        )}
        {/* Property Type Badge */}
        {propertyType && (
          <div className="absolute top-3 left-3">
            <span className="inline-block px-3 py-1 bg-white/95 dark:bg-black/80 text-gray-900 dark:text-white text-sm font-medium rounded-md shadow-sm">
              {propertyType}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {property.address_city && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {property.address_city}
              {property.address_country && `, ${property.address_country}`}
            </p>
          )}
        </div>

        {/* Check-in/out Times */}
        {(checkInTime || checkOutTime) && (
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <ClockIcon />
              <span>In: {formatTime(checkInTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ClockIcon />
              <span>Out: {formatTime(checkOutTime)}</span>
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white mb-2">
              <StarIcon />
              <span>Highlights</span>
            </div>
            <ul className="space-y-1.5">
              {highlights.slice(0, 3).map((highlight, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckIcon />
                  <span>{highlight}</span>
                </li>
              ))}
              {highlights.length > 3 && (
                <li className="text-sm text-primary dark:text-primary-light">
                  +{highlights.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Amenities Preview */}
        {amenities.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 5).map((amenity, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-md"
                >
                  {amenity}
                </span>
              ))}
              {amenities.length > 5 && (
                <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-md font-medium">
                  +{amenities.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white mb-2">
              <TagIcon />
              <span>Categories</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm rounded-md font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!propertyType && highlights.length === 0 && amenities.length === 0 && categories.length === 0 && (
          <div className="text-center py-4 border border-dashed border-gray-200 dark:border-dark-border rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Complete the listing details to see a preview
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ListingPreviewCard;
