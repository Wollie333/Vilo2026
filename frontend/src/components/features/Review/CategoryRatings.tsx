/**
 * CategoryRatings Component
 * Displays or allows input for 5 category ratings
 */

import React from 'react';
import { StarRating } from './StarRating';
import type { CategoryRatingsProps } from '@/types/review.types';
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from '@/types/review.types';

export const CategoryRatings: React.FC<CategoryRatingsProps> = ({
  ratings,
  readonly = false,
  onChange,
  size = 'md',
}) => {
  const categories = ['safety', 'cleanliness', 'location', 'comfort', 'scenery'] as const;

  const handleRatingChange = (category: typeof categories[number], value: number) => {
    if (onChange) {
      onChange(category, value);
    }
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category} className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
                {CATEGORY_LABELS[category]}
              </span>
              {!readonly && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {CATEGORY_DESCRIPTIONS[category]}
                </span>
              )}
            </div>
          </div>

          <StarRating
            value={ratings[category]}
            onChange={(value) => handleRatingChange(category, value)}
            readonly={readonly}
            size={size}
            showValue={readonly}
          />
        </div>
      ))}

      {readonly && (
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              Overall Rating
            </span>
            <div className="flex items-center gap-2">
              <StarRating
                value={calculateOverall(ratings)}
                readonly
                size="md"
                showValue
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: Calculate overall rating from categories
function calculateOverall(ratings: {
  safety: number;
  cleanliness: number;
  location: number;
  comfort: number;
  scenery: number;
}): number {
  const sum =
    ratings.safety +
    ratings.cleanliness +
    ratings.location +
    ratings.comfort +
    ratings.scenery;
  return Math.round((sum / 5) * 10) / 10;
}
