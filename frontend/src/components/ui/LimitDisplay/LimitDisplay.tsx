/**
 * LimitDisplay Component
 *
 * Displays subscription limit usage with optional progress bar and warnings
 */

import React from 'react';
import type { LimitDisplayProps } from './LimitDisplay.types';
import {
  getLimitInfo,
  getLimitWarningMessage,
  getLimitColorClasses,
} from '@/utils/subscription-limits';

export const LimitDisplay: React.FC<LimitDisplayProps> = ({
  limitKey,
  used,
  limit,
  variant = 'default',
  showProgress = true,
  showWarning = true,
  className = '',
}) => {
  const limitInfo = getLimitInfo(limitKey, used, limit);
  const warningMessage = getLimitWarningMessage(limitKey, used, limit);
  const colorClasses = getLimitColorClasses(limitInfo.color);

  // Compact variant - just the text
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`text-sm font-medium ${colorClasses.text}`}>
          {limitInfo.displayValue}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {limitInfo.label}
        </span>
      </div>
    );
  }

  // Detailed variant - full info with card
  if (variant === 'detailed') {
    return (
      <div className={`p-4 rounded-lg border ${colorClasses.bg} ${colorClasses.border} ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {limitInfo.label}
          </h4>
          <span className={`text-sm font-bold ${colorClasses.text}`}>
            {limitInfo.displayValue}
          </span>
        </div>

        {showProgress && limitInfo.limit !== -1 && (
          <div className="mb-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${colorClasses.progress}`}
                style={{ width: `${Math.min(100, limitInfo.percentage)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {limitInfo.percentage.toFixed(0)}% used
            </p>
          </div>
        )}

        {showWarning && warningMessage && (
          <div className={`text-xs ${colorClasses.text} mt-2`}>
            {warningMessage}
          </div>
        )}
      </div>
    );
  }

  // Default variant - label + value with optional progress
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {limitInfo.label}
        </span>
        <span className={`text-sm font-medium ${colorClasses.text}`}>
          {limitInfo.displayValue}
        </span>
      </div>

      {showProgress && limitInfo.limit !== -1 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${colorClasses.progress}`}
            style={{ width: `${Math.min(100, limitInfo.percentage)}%` }}
          />
        </div>
      )}

      {showWarning && warningMessage && (
        <p className={`text-xs ${colorClasses.text} mt-1`}>
          {warningMessage}
        </p>
      )}
    </div>
  );
};
