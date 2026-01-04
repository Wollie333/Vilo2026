/**
 * Notification Item Component
 * FEATURE-03: Notification System
 *
 * Individual notification item in the NotificationCenter dropdown.
 */

import React from 'react';
import type { NotificationItemProps } from './NotificationCenter.types';

const variantIcons = {
  info: (
    <svg className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const priorityStyles = {
  low: '',
  normal: '',
  high: 'border-l-2 border-warning',
  urgent: 'border-l-2 border-error',
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) => {
  const { id, variant, title, message, read, priority, created_at, action_url } = notification;

  const handleClick = () => {
    if (!read && onMarkAsRead) {
      onMarkAsRead(id);
    }

    if (onClick) {
      onClick(notification);
    } else if (action_url) {
      window.location.href = action_url;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead && !read) {
      onMarkAsRead(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-start gap-3 p-3 cursor-pointer transition-colors
        ${read ? 'bg-transparent' : 'bg-primary/5 dark:bg-primary/10'}
        ${priorityStyles[priority]}
        hover:bg-gray-50 dark:hover:bg-dark-card-hover
      `}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{variantIcons[variant]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm ${read ? 'font-normal text-gray-600 dark:text-gray-400' : 'font-medium text-gray-900 dark:text-white'}`}
          >
            {title}
          </p>
          {!read && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
          )}
        </div>

        {message && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
            {message}
          </p>
        )}

        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xs text-gray-400">{formatTimeAgo(created_at)}</span>
          {priority === 'urgent' && (
            <span className="text-2xs text-error font-medium">Urgent</span>
          )}
          {priority === 'high' && (
            <span className="text-2xs text-warning font-medium">High Priority</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!read && (
          <button
            onClick={handleMarkAsRead}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Mark as read"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1 text-gray-400 hover:text-error"
          title="Delete"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
