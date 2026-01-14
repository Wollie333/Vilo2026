/**
 * ReviewStats Component
 * Displays aggregated review statistics for a property
 */

import React from 'react';
import { StarRating } from './StarRating';
import type { ReviewStats as ReviewStatsType } from '@/types/review.types';
import { CATEGORY_LABELS } from '@/types/review.types';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  showCategoryBreakdown?: boolean;
  showDistribution?: boolean;
}

export const ReviewStats: React.FC<ReviewStatsProps> = ({
  stats,
  showCategoryBreakdown = true,
  showDistribution = true,
}) => {
  // Provide defaults for potentially undefined values
  const overallRating = stats.overallRating ?? 0;
  const totalReviews = stats.totalReviews ?? 0;
  const recommendationPercentage = stats.recommendationPercentage ?? 0;
  const categoryRatings = stats.categoryRatings ?? {
    safety: 0,
    cleanliness: 0,
    location: 0,
    comfort: 0,
    scenery: 0,
  };
  const ratingDistribution = stats.ratingDistribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const recentReviews = stats.recentReviews ?? [];

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
      {/* Overall Rating Header */}
      <div className="text-center pb-6 border-b border-gray-200 dark:border-dark-border">
        <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
          {overallRating.toFixed(1)}
        </div>
        <StarRating value={overallRating} readonly size="lg" />
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </div>
        {recommendationPercentage >= 80 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {recommendationPercentage.toFixed(0)}% Recommend
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {showCategoryBreakdown && (
        <div className="py-6 border-b border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Category Ratings
          </h3>
          <div className="space-y-3">
            {Object.entries(categoryRatings).map(([category, rating]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text w-32">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </span>
                <div className="flex-1 mx-4">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${((rating ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                  {(rating ?? 0).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {showDistribution && (
        <div className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Rating Distribution
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDistribution[stars as keyof typeof ratingDistribution] ?? 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
                      {stars}
                    </span>
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>

                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        stars >= 4
                          ? 'bg-green-500'
                          : stars === 3
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Reviews Preview */}
      {recentReviews.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Recent Reviews
          </h3>
          <div className="space-y-3">
            {recentReviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {review.guest_name}
                  </span>
                  <StarRating value={review.rating_overall ?? 0} readonly size="sm" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {review.review_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
