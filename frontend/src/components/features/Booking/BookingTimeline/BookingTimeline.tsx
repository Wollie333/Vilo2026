import React from 'react';
import {
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineRefresh,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineXCircle,
  HiOutlinePencil,
  HiOutlineReceiptTax,
  HiOutlinePlus,
} from 'react-icons/hi';
import type { TimelineEvent } from '@/types/booking.types';

export interface BookingTimelineProps {
  events: TimelineEvent[];
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No booking history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </div>
  );
};

const TimelineItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
  const config = getEventConfig(event.type);

  return (
    <div className="relative flex gap-4">
      {/* Icon with vertical line behind it */}
      <div className="flex-shrink-0 relative z-10">
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${config.bgClass} ${config.textClass}
            border-2 border-white dark:border-gray-950
          `}
        >
          <config.icon className="w-5 h-5" />
        </div>
        {/* Vertical connecting line */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 pt-1.5">
        <div className="space-y-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>

          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              {formatAbsoluteTimestamp(event.timestamp)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(event.timestamp)}
            </p>
          </div>

          {event.actor && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              by {event.actor.name} ({event.actor.email})
            </p>
          )}

          {event.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              {event.description}
            </p>
          )}

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                View details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-dark-hover rounded-md">
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get icon and colors for each event type
function getEventConfig(type: TimelineEvent['type']) {
  const configs = {
    created: {
      icon: HiOutlinePlus,
      bgClass: 'bg-blue-100 dark:bg-blue-900/20',
      textClass: 'text-blue-600 dark:text-blue-400',
    },
    status_change: {
      icon: HiOutlineRefresh,
      bgClass: 'bg-purple-100 dark:bg-purple-900/20',
      textClass: 'text-purple-600 dark:text-purple-400',
    },
    payment: {
      icon: HiOutlineCurrencyDollar,
      bgClass: 'bg-green-100 dark:bg-green-900/20',
      textClass: 'text-green-600 dark:text-green-400',
    },
    refund: {
      icon: HiOutlineRefresh,
      bgClass: 'bg-orange-100 dark:bg-orange-900/20',
      textClass: 'text-orange-600 dark:text-orange-400',
    },
    checkin: {
      icon: HiOutlineLogin,
      bgClass: 'bg-teal-100 dark:bg-teal-900/20',
      textClass: 'text-teal-600 dark:text-teal-400',
    },
    checkout: {
      icon: HiOutlineLogout,
      bgClass: 'bg-indigo-100 dark:bg-indigo-900/20',
      textClass: 'text-indigo-600 dark:text-indigo-400',
    },
    cancellation: {
      icon: HiOutlineXCircle,
      bgClass: 'bg-red-100 dark:bg-red-900/20',
      textClass: 'text-red-600 dark:text-red-400',
    },
    note: {
      icon: HiOutlinePencil,
      bgClass: 'bg-gray-100 dark:bg-gray-700',
      textClass: 'text-gray-600 dark:text-gray-300',
    },
    invoice: {
      icon: HiOutlineReceiptTax,
      bgClass: 'bg-cyan-100 dark:bg-cyan-900/20',
      textClass: 'text-cyan-600 dark:text-cyan-400',
    },
  };

  return configs[type] || configs.note;
}

// Helper function to format absolute timestamp (date and time)
function formatAbsoluteTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Helper function to format relative time
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Relative time for recent events
  if (seconds < 60) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}
