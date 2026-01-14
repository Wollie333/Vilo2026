/**
 * StarRating Component
 * Interactive star rating input/display component
 */

import React, { useState } from 'react';
import type { StarRatingProps } from '@/types/review.types';

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  label,
  showValue = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
          {label}
        </span>
      )}

      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = rating <= displayValue;
          const isHalf = rating === Math.ceil(displayValue) && displayValue % 1 !== 0;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={`
                ${sizeClasses[size]}
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                transition-all duration-150
                disabled:cursor-default
              `}
              aria-label={`Rate ${rating} stars`}
            >
              {isHalf ? (
                <HalfStar filled={isFilled} size={size} />
              ) : (
                <Star filled={isFilled} size={size} />
              )}
            </button>
          );
        })}

        {showValue && (
          <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-dark-text">
            {value.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
};

// Star Icon Component
const Star: React.FC<{ filled: boolean; size: 'sm' | 'md' | 'lg' }> = ({ filled }) => {
  return (
    <svg
      className={`
        ${filled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
        transition-colors duration-150
      `}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
};

// Half Star Icon Component (for decimal ratings in display mode)
const HalfStar: React.FC<{ filled: boolean; size: 'sm' | 'md' | 'lg' }> = ({ filled }) => {
  return (
    <svg
      className="transition-colors duration-150"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="half-fill">
          <stop offset="50%" stopColor={filled ? '#FBBF24' : '#D1D5DB'} />
          <stop offset="50%" stopColor="#D1D5DB" />
        </linearGradient>
      </defs>
      <path
        fill="url(#half-fill)"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  );
};
