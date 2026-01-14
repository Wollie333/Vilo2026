import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import type { ActivityFeedProps } from './ActivityFeed.types';
import type { ActivityItem } from '../../Dashboard.types';

// Default icons for activity types
const ActivityIcon: React.FC<{ type: ActivityItem['type'] }> = ({ type }) => {
  const iconClass = 'w-4 h-4';

  switch (type) {
    case 'booking':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'payment':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case 'review':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case 'check-in':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      );
    case 'check-out':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      );
    case 'user':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'property':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'system':
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const statusColors: Record<string, string> = {
  completed: 'bg-success-light text-success-dark dark:bg-success/20 dark:text-success',
  pending: 'bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning',
  warning: 'bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning',
  error: 'bg-error-light text-error-dark dark:bg-error/20 dark:text-error',
  info: 'bg-info-light text-info-dark dark:bg-info/20 dark:text-info',
};

const typeColors: Record<string, string> = {
  booking: 'bg-primary/10 dark:bg-primary/20 text-primary',
  payment: 'bg-success-light dark:bg-success/20 text-success',
  review: 'bg-warning-light dark:bg-warning/20 text-warning',
  'check-in': 'bg-info-light dark:bg-info/20 text-info',
  'check-out': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  user: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  property: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  system: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 5,
  showViewAll = true,
  viewAllHref,
  onViewAll,
  emptyMessage = 'No recent activity',
  className = '',
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card variant="bordered" className={className}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          {showViewAll && activities.length > maxItems && (
            viewAllHref ? (
              <Link
                to={viewAllHref}
                className="text-sm text-primary hover:text-primary-600 font-medium"
              >
                View all
              </Link>
            ) : onViewAll ? (
              <button
                onClick={onViewAll}
                className="text-sm text-primary hover:text-primary-600 font-medium"
              >
                View all
              </button>
            ) : null
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {displayedActivities.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {displayedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[activity.type] || typeColors.system}`}
                >
                  {activity.icon || <ActivityIcon type={activity.type} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {activity.timestamp}
                  </p>
                </div>
                {activity.status && (
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[activity.status] || statusColors.info}`}
                  >
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
