/**
 * ReviewCard Component
 * Displays a single review with ratings, text, photos, and actions
 */

import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { CategoryRatings } from './CategoryRatings';
import { Button } from '@/components/ui';
import type { ReviewCardProps } from '@/types/review.types';
import {
  getReviewAgeLabel,
  formatStayDuration,
  getRatingLabel,
} from '@/types/review.types';

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showModeration = false,
  showActions = false,
  onRespond,
  onHideContent,
  onRequestWithdrawal,
  onWithdraw,
}) => {
  const [showFullReview, setShowFullReview] = useState(false);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);

  const reviewText = review.is_text_hidden
    ? '[Content hidden by property owner due to policy violation]'
    : review.review_text;

  const isLongReview = reviewText.length > 300;
  const displayText = showFullReview ? reviewText : reviewText.slice(0, 300);

  const photos = review.is_photos_hidden ? [] : review.photos;

  const stayDuration = formatStayDuration(review.check_in_date, review.check_out_date);
  const reviewAge = getReviewAgeLabel(review.created_at);
  const ratingLabel = getRatingLabel(review.rating_overall);

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
      {/* Header: Guest info and overall rating */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Guest Avatar */}
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {review.guest_name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {review.guest_name}
              </h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                Verified Stay
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <span>{reviewAge}</span>
              <span>•</span>
              <span>{stayDuration}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <StarRating value={review.rating_overall} readonly size="md" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {review.rating_overall.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {ratingLabel}
          </span>
        </div>
      </div>

      {/* Review Title */}
      {review.review_title && !review.is_text_hidden && (
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {review.review_title}
        </h4>
      )}

      {/* Review Text */}
      <div className="mb-4">
        <p className={`text-gray-700 dark:text-dark-text ${review.is_text_hidden ? 'italic text-gray-500' : ''}`}>
          {displayText}
          {isLongReview && !showFullReview && '...'}
        </p>

        {isLongReview && !review.is_text_hidden && (
          <button
            onClick={() => setShowFullReview(!showFullReview)}
            className="text-primary hover:text-primary/80 text-sm font-medium mt-2"
          >
            {showFullReview ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {photos.map((photo, index) => (
            <img
              key={index}
              src={photo.url}
              alt={photo.caption || `Review photo ${index + 1}`}
              className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                // TODO: Open lightbox/modal for full-size image
                window.open(photo.url, '_blank');
              }}
            />
          ))}
        </div>
      )}

      {/* Category Breakdown Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          {showCategoryBreakdown ? '− Hide' : '+ Show'} category ratings
        </button>

        {showCategoryBreakdown && (
          <div className="mt-3 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
            <CategoryRatings
              ratings={{
                safety: review.rating_safety,
                cleanliness: review.rating_cleanliness,
                location: review.rating_location,
                comfort: review.rating_comfort,
                scenery: review.rating_scenery,
              }}
              readonly
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Moderation Status */}
      {showModeration && (
        <div className="mb-4 space-y-2">
          {review.is_text_hidden && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Text content hidden by owner</span>
            </div>
          )}

          {review.is_photos_hidden && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Photos hidden by owner</span>
            </div>
          )}

          {review.withdrawal_requested_at && !review.withdrawn_at && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Withdrawal requested - pending admin approval</span>
            </div>
          )}

          {review.withdrawn_at && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>Review withdrawn - not counted in rating</span>
            </div>
          )}
        </div>
      )}

      {/* Owner Response */}
      {review.owner_response && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            <span className="font-semibold text-gray-900 dark:text-white">
              Response from Property Owner
            </span>
          </div>
          <p className="text-gray-700 dark:text-dark-text">
            {review.owner_response}
          </p>
          {review.owner_response_at && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
              {getReviewAgeLabel(review.owner_response_at)}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border flex flex-wrap gap-2">
          {onRespond && !review.owner_response && (
            <Button variant="outline" size="sm" onClick={() => onRespond(review.id)}>
              Respond
            </Button>
          )}

          {onHideContent && !review.is_text_hidden && (
            <Button variant="outline" size="sm" onClick={() => onHideContent(review.id)}>
              Hide Offensive Content
            </Button>
          )}

          {onRequestWithdrawal && !review.withdrawn_at && !review.withdrawal_requested_at && (
            <Button variant="outline" size="sm" onClick={() => onRequestWithdrawal(review.id)}>
              Request Withdrawal
            </Button>
          )}

          {onWithdraw && !review.withdrawn_at && (
            <Button variant="outline" size="sm" onClick={() => onWithdraw(review.id)}>
              Withdraw Review
            </Button>
          )}
        </div>
      )}

      {/* Helpful count (future feature) */}
      {review.helpful_count > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {review.helpful_count} {review.helpful_count === 1 ? 'person' : 'people'} found this helpful
        </div>
      )}
    </div>
  );
};
