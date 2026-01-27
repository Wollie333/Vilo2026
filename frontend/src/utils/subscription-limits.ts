/**
 * Subscription Limits Utilities
 *
 * Helper functions for displaying and working with subscription plan limits
 */

export type LimitKey =
  | 'max_properties'
  | 'max_rooms'
  | 'max_team_members'
  | 'max_bookings_per_month'
  | 'max_storage_mb';

export interface LimitInfo {
  key: LimitKey;
  label: string;
  used: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  color: 'success' | 'warning' | 'danger';
  displayValue: string;
}

/**
 * Format a limit value for display
 * -1 or 0 means unlimited
 */
export const formatLimit = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'Not set';
  if (value === -1 || value === 0) return 'Unlimited';
  return value.toLocaleString();
};

/**
 * Calculate percentage of limit used
 * Returns 0 if unlimited
 */
export const getLimitPercentage = (
  used: number,
  limit: number | null | undefined
): number => {
  if (limit === null || limit === undefined || limit === -1 || limit === 0) {
    return 0; // Unlimited
  }
  if (limit === 0) return 100; // Prevent division by zero
  return Math.min(100, (used / limit) * 100);
};

/**
 * Determine if usage is near the limit (>= threshold %)
 * Default threshold is 80%
 */
export const isNearLimit = (
  used: number,
  limit: number | null | undefined,
  threshold: number = 0.8
): boolean => {
  if (limit === null || limit === undefined || limit === -1 || limit === 0) {
    return false; // Unlimited, never near limit
  }
  return used >= limit * threshold;
};

/**
 * Determine if usage is at or over the limit
 */
export const isAtLimit = (
  used: number,
  limit: number | null | undefined
): boolean => {
  if (limit === null || limit === undefined || limit === -1 || limit === 0) {
    return false; // Unlimited
  }
  return used >= limit;
};

/**
 * Get color based on percentage used
 * - Green (success): 0-69%
 * - Yellow (warning): 70-99%
 * - Red (danger): 100%+
 */
export const getLimitColor = (
  used: number,
  limit: number | null | undefined
): 'success' | 'warning' | 'danger' => {
  if (limit === null || limit === undefined || limit === -1 || limit === 0) {
    return 'success'; // Unlimited
  }

  const percentage = getLimitPercentage(used, limit);

  if (percentage >= 100) return 'danger';
  if (percentage >= 70) return 'warning';
  return 'success';
};

/**
 * Get formatted display value for usage
 * e.g., "3/10", "5/Unlimited", "10/10 (Full)"
 */
export const getUsageDisplay = (
  used: number,
  limit: number | null | undefined
): string => {
  const limitDisplay = formatLimit(limit);
  const usedDisplay = used.toLocaleString();

  if (limit === null || limit === undefined || limit === -1 || limit === 0) {
    return `${usedDisplay}`;
  }

  const atLimit = isAtLimit(used, limit);
  return `${usedDisplay}/${limitDisplay}${atLimit ? ' (Full)' : ''}`;
};

/**
 * Get human-readable label for limit key
 */
export const getLimitLabel = (key: LimitKey): string => {
  const labels: Record<LimitKey, string> = {
    max_properties: 'Properties',
    max_rooms: 'Rooms',
    max_team_members: 'Team Members',
    max_bookings_per_month: 'Bookings per Month',
    max_storage_mb: 'Storage (MB)',
  };

  return labels[key] || key;
};

/**
 * Get comprehensive limit information
 */
export const getLimitInfo = (
  key: LimitKey,
  used: number,
  limit: number | null | undefined
): LimitInfo => {
  const percentage = getLimitPercentage(used, limit);
  const nearLimit = isNearLimit(used, limit);
  const atLimitValue = isAtLimit(used, limit);
  const color = getLimitColor(used, limit);
  const label = getLimitLabel(key);
  const displayValue = getUsageDisplay(used, limit);

  return {
    key,
    label,
    used,
    limit: limit ?? -1,
    percentage,
    isNearLimit: nearLimit,
    isAtLimit: atLimitValue,
    color,
    displayValue,
  };
};

/**
 * Get warning message for limit
 */
export const getLimitWarningMessage = (
  key: LimitKey,
  used: number,
  limit: number | null | undefined
): string | null => {
  if (isAtLimit(used, limit)) {
    return `You've reached your ${getLimitLabel(key).toLowerCase()} limit. Please upgrade your plan to add more.`;
  }

  if (isNearLimit(used, limit)) {
    const remaining = (limit ?? 0) - used;
    return `You're approaching your ${getLimitLabel(key).toLowerCase()} limit. ${remaining} remaining.`;
  }

  return null;
};

/**
 * Check if user can perform action based on limit
 */
export const canPerformAction = (
  used: number,
  limit: number | null | undefined
): boolean => {
  return !isAtLimit(used, limit);
};

/**
 * Get tailwind color classes for limit color
 */
export const getLimitColorClasses = (
  color: 'success' | 'warning' | 'danger'
): {
  bg: string;
  text: string;
  border: string;
  progress: string;
} => {
  const classes = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      progress: 'bg-green-600',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
      progress: 'bg-yellow-600',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      progress: 'bg-red-600',
    },
  };

  return classes[color];
};
