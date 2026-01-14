/**
 * PropertyCard Component
 * Display property summary in grid/list views
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PropertyCardProps } from './PropertyCard.types';
import { useAuth } from '@/context/AuthContext';
import { wishlistService } from '@/services';

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
  bnb: 'B&B',
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  compact = false,
  showRemoveButton = false,
  onRemove,
  className = '',
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(
    property.is_in_wishlist || false
  );
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all available images
  const allImages = [
    property.featured_image_url,
    ...(property.gallery_images?.map((img) => img.url) || []),
  ].filter(Boolean);

  const hasMultipleImages = allImages.length > 1;

  const handleCardClick = () => {
    navigate(`/accommodation/${property.slug}`);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsWishlistLoading(true);
    try {
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(property.id);
        setIsInWishlist(false);
      } else {
        await wishlistService.addToWishlist(property.id);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(property.id);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return `R${price.toLocaleString()}`;
  };

  // Horizontal List View Layout
  if (compact) {
    return (
      <div
        className={`group cursor-pointer hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border relative ${className}`}
        onClick={handleCardClick}
      >
        {/* Review Stars Badge - Top Right Corner of Card */}
        <div className="absolute top-3 right-3 bg-white dark:bg-dark-card px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 z-20 border border-gray-200 dark:border-dark-border">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">4.5</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Property Image - 1/3 width with Carousel */}
          <div className="aspect-[16/10] md:aspect-auto relative md:col-span-1 group/image">
            <img
              src={allImages[currentImageIndex] || '/images/placeholder-property.jpg'}
              alt={`${property.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300"
              loading="lazy"
            />

            {/* Property Type Badge */}
            {property.property_type && (
              <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {propertyTypeLabels[property.property_type] || property.property_type}
              </div>
            )}

            {/* Vilo Verified Badge */}
            <div
              className="absolute bottom-3 left-3 bg-white dark:bg-dark-card rounded-full p-1.5 shadow-lg group/badge z-10 cursor-pointer"
            >
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center transition-all duration-300 group-hover/badge:shadow-[0_0_30px_15px_rgba(4,120,87,0.4),0_0_60px_30px_rgba(4,120,87,0.2)] group-hover/badge:animate-pulse">
                <span className="text-white font-bold text-xs">V</span>
              </div>
              {/* Tooltip - Positioned to the right */}
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

          {/* Property Details - 2/3 width */}
          <div className="p-5 flex flex-col h-full md:col-span-2">
            <div className="flex-1">
              {/* Header with Location and Rating */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {property.city_name || property.address_city}
                    {(property.province_name || property.address_state) && (
                      <>, {property.province_name || property.address_state}</>
                    )}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 line-clamp-1">
                    {property.listing_title || property.name}
                  </h3>
                </div>
                {property.review_count > 0 && property.overall_rating && (
                  <div className="flex flex-col items-end flex-shrink-0">
                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(property.overall_rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : i < (property.overall_rating || 0)
                              ? 'text-yellow-400 fill-current opacity-50'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {property.review_count} {property.review_count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {property.listing_description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {property.listing_description}
                </p>
              )}

              {/* Room Count and Max Guests */}
              {(property.room_count || property.total_max_guests) && (
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-700 dark:text-gray-300">
                  {property.room_count && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="font-medium">{property.room_count}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {property.room_count === 1 ? 'room' : 'rooms'}
                      </span>
                    </div>
                  )}
                  {property.total_max_guests && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-medium">{property.total_max_guests}</span>
                      <span className="text-gray-500 dark:text-gray-400">max guests</span>
                    </div>
                  )}
                </div>
              )}

              {/* Categories Pills */}
              {property.categories && property.categories.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {property.categories.slice(0, 4).map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                    {property.categories.length > 4 && (
                      <span className="inline-flex items-center text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-hover px-2.5 py-1 rounded-full">
                        +{property.categories.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities Pills */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Amenities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {property.amenities.slice(0, 6).map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center text-xs text-gray-700 dark:text-gray-100 bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/20"
                      >
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 6 && (
                      <span className="inline-flex items-center text-xs text-gray-600 dark:text-gray-200 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/10">
                        +{property.amenities.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price and CTA Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border mt-4">
              <div>
                {property.min_price ? (
                  <>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(property.min_price)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400"> / night</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Price on request
                  </span>
                )}
              </div>
              <button
                onClick={handleCardClick}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Grid View Layout
  return (
    <div
      className={`group cursor-pointer hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden bg-white dark:bg-dark-card relative ${className}`}
      onClick={handleCardClick}
    >
      {/* Review Stars Badge - Top Right Corner of Card */}
      <div className="absolute top-3 right-3 bg-white dark:bg-dark-card px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 z-20 border border-gray-200 dark:border-dark-border">
        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
        <span className="text-sm font-bold text-gray-900 dark:text-white">4.5</span>
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={
            property.featured_image_url ||
            property.gallery_images?.[0]?.url ||
            '/images/placeholder-property.jpg'
          }
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Wishlist/Remove Button - DISABLED */}
        {false && showRemoveButton ? (
          <button
            onClick={handleRemove}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Remove from wishlist"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        ) : false && (
          <button
            onClick={handleWishlistToggle}
            disabled={isWishlistLoading}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label={
              isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'
            }
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isInWishlist
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-700'
              }`}
            />
          </button>
        )}

        {/* Property Type Badge */}
        {property.property_type && (
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1.5 text-sm font-medium bg-white text-gray-900 rounded-md shadow-sm">
              {propertyTypeLabels[property.property_type] || property.property_type}
            </span>
          </div>
        )}

        {/* Vilo Verified Badge */}
        <div
          className="absolute bottom-3 right-3 bg-white dark:bg-dark-card rounded-full p-1.5 shadow-lg group/badge z-10 cursor-pointer"
        >
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center transition-all duration-300 group-hover/badge:shadow-[0_0_30px_15px_rgba(4,120,87,0.4),0_0_60px_30px_rgba(4,120,87,0.2)] group-hover/badge:animate-pulse">
            <span className="text-white font-bold text-xs">V</span>
          </div>
          {/* Tooltip - Positioned to the left for right-side badge */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-[99]">
            Vilo Verified
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Property Name and Rating Row */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1 flex-1 mr-2">
            {property.listing_title || property.name}
          </h3>
          {/* Rating - Only show if property has reviews */}
          {property.review_count > 0 && property.overall_rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-gray-900 dark:text-white">
                {property.overall_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {property.city_name || property.address_city}
            {(property.province_name || property.address_state) && (
              <>, {property.province_name || property.address_state}</>
            )}
          </span>
        </div>

        {/* Price and Review Count Row */}
        <div className="flex items-end justify-between">
          {/* Price */}
          <div>
            {property.min_price ? (
              <div>
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  {formatPrice(property.min_price)}
                </span>
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                  {' '}/ night
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Price on request
              </span>
            )}
          </div>

          {/* Review Count */}
          {property.review_count > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {property.review_count} {property.review_count === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
