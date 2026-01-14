/**
 * ReviewsTab Component
 *
 * Display rating breakdown and individual reviews
 */

import React from 'react';
import { HiStar } from 'react-icons/hi';
import type { ReviewsTabProps } from './ReviewsTab.types';

export const ReviewsTab: React.FC<ReviewsTabProps> = ({
  overallRating,
  reviewCount,
  ratingBreakdown,
  reviews,
}) => {
  if (reviewCount === 0) {
    return (
      <div className="text-center py-12">
        <HiStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No reviews yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Be the first to review this property after your stay!
        </p>
      </div>
    );
  }

  const ratingCategories = [
    { key: 'safety', label: 'Safety', value: ratingBreakdown.safety },
    { key: 'cleanliness', label: 'Cleanliness', value: ratingBreakdown.cleanliness },
    { key: 'location', label: 'Location', value: ratingBreakdown.location },
    { key: 'comfort', label: 'Comfort', value: ratingBreakdown.comfort },
    { key: 'scenery', label: 'Scenery', value: ratingBreakdown.scenery },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overall Rating Card */}
      <div className="bg-gray-50 dark:bg-dark-card rounded-lg p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Overall Score */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
              {overallRating?.toFixed(1)}
            </div>
            <div className="flex mb-2">
              {renderStars(Math.round(overallRating || 0))}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            {ratingCategories.map((category) => (
              category.value !== null && (
                <div key={category.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {category.value.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-hover rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(category.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Guest Reviews
        </h3>

        {reviews.map((review) => (
          <div
            key={review.id}
            className="border-b border-gray-200 dark:border-dark-border pb-6 last:border-0"
          >
            {/* Review Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {review.guest_name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(review.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <HiStar className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {review.rating_overall.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Review Title */}
            {review.review_title && (
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {review.review_title}
              </h4>
            )}

            {/* Review Text */}
            {!review.is_text_hidden && review.review_text && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                {review.review_text}
              </p>
            )}

            {/* Review Photos */}
            {!review.is_photos_hidden && review.photos && review.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mb-4">
                {review.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || `Review photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Owner Response */}
            {review.owner_response && (
              <div className="mt-4 ml-4 pl-4 border-l-2 border-primary bg-gray-50 dark:bg-dark-hover p-4 rounded">
                <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  Response from host
                </div>
                {review.owner_response_at && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {formatDate(review.owner_response_at)}
                  </div>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {review.owner_response}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
