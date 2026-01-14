/**
 * PropertyHero Component
 *
 * Hero section with featured image and thumbnail gallery
 */

import React from 'react';
import { HiHeart, HiOutlineHeart, HiShare } from 'react-icons/hi';
import type { PropertyHeroProps } from './PropertyHero.types';

export const PropertyHero: React.FC<PropertyHeroProps> = ({
  images,
  featuredImage,
  propertyName,
  onViewAllPhotos,
  onShare,
  onWishlistToggle,
  isInWishlist = false,
}) => {
  // Sort images by order and get first 5 (1 featured + 4 thumbnails)
  const sortedImages = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));
  const displayImages = sortedImages.slice(0, 5);
  const mainImage = featuredImage || displayImages[0]?.url || '';
  const thumbnails = displayImages.slice(1, 5);

  return (
    <div className="relative">
      {/* Desktop Grid Layout */}
      <div className="hidden md:grid md:grid-cols-4 gap-2 h-[500px]">
        {/* Large Featured Image - 2 columns */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden rounded-l-lg group"
          onClick={onViewAllPhotos}
        >
          <img
            src={mainImage}
            alt={propertyName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Thumbnail Grid - 4 smaller images */}
        {thumbnails.map((image, index) => (
          <div
            key={index}
            className={`relative cursor-pointer overflow-hidden group ${
              index === 1 || index === 3 ? 'rounded-r-lg' : ''
            }`}
            onClick={onViewAllPhotos}
          >
            <img
              src={image.url}
              alt={image.caption || `${propertyName} ${index + 2}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* "View all photos" overlay on last thumbnail */}
            {index === 3 && images.length > 5 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white font-medium hover:bg-opacity-50 transition-colors">
                View all {images.length} photos
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Single Featured Image */}
      <div className="md:hidden relative">
        <div
          className="w-full h-[300px] cursor-pointer"
          onClick={onViewAllPhotos}
        >
          <img
            src={mainImage}
            alt={propertyName}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Thumbnail scroll */}
        {thumbnails.length > 0 && (
          <div className="flex gap-2 overflow-x-auto p-2 bg-gray-50 dark:bg-dark-bg">
            {thumbnails.map((image, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-20 h-20 cursor-pointer rounded overflow-hidden"
                onClick={onViewAllPhotos}
              >
                <img
                  src={image.url}
                  alt={image.caption || `Thumbnail ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons - Top Right */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="bg-white dark:bg-dark-card rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            aria-label="Share property"
          >
            <HiShare className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        {onWishlistToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle();
            }}
            className="bg-white dark:bg-dark-card rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isInWishlist ? (
              <HiHeart className="w-5 h-5 text-red-500" />
            ) : (
              <HiOutlineHeart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        )}
      </div>

      {/* "View All Photos" button for mobile */}
      <div className="md:hidden p-4">
        <button
          onClick={onViewAllPhotos}
          className="w-full border border-gray-300 dark:border-dark-border rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
        >
          View all {images.length} photos
        </button>
      </div>
    </div>
  );
};
