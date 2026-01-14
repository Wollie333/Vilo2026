import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { refundService } from '@/services/refund.service';
import type { RefundActivityTimelineProps, ActivityItemProps } from './RefundActivityTimeline.types';

/**
 * RefundActivityTimeline Component
 *
 * Unified timeline showing both status changes and comments in chronological order.
 * Follows industry best practices from GitHub, Linear, and Jira.
 *
 * Features:
 * - Vertical timeline with connector line
 * - Status changes shown as blue boxes with arrow notation
 * - Comments shown as gray boxes
 * - Most recent activity at top
 * - Loading and error states
 * - Mobile-responsive layout
 */
export const RefundActivityTimeline: React.FC<RefundActivityTimelineProps> = ({ refundId }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [refundId]);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await refundService.getActivityFeed(refundId);
      setActivities(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity feed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical Timeline Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-dark-border" />

      {/* Activity Items */}
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <ActivityItem
            key={`${activity.activity_type}-${activity.activity_at}-${index}`}
            activity={activity}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * ActivityItem Component
 *
 * Individual activity entry in the timeline.
 * Status changes and comments are styled differently for clarity.
 */
const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isFirst }) => {
  const isStatusChange = activity.activity_type === 'status_change';

  return (
    <div className="relative flex gap-4 pl-10">
      {/* Timeline Dot */}
      <div
        className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
          isFirst
            ? 'bg-primary border-primary'
            : 'bg-white dark:bg-dark-card border-gray-300 dark:border-dark-border'
        }`}
      />

      {/* Content */}
      <div className="flex-1">
        {/* Actor Info */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {activity.actor_name}
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({activity.actor_role})
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(activity.activity_at), { addSuffix: true })}
            </p>
          </div>

          {/* Internal Badge */}
          {activity.is_internal && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
              Internal
            </span>
          )}
        </div>

        {/* Activity Content */}
        {isStatusChange ? (
          // Status Change Box
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Status changed: {activity.activity_description}
            </p>
            {activity.additional_info && (
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Reason: {activity.additional_info}
              </p>
            )}
          </div>
        ) : (
          // Comment Box
          <div
            className={`mt-2 p-3 rounded-lg ${
              activity.is_internal
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
                : 'bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-dark-border'
            }`}
          >
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
              {activity.activity_description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
