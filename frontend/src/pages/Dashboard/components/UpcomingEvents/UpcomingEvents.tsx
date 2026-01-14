import React from 'react';
import { Card } from '@/components/ui/Card';
import type { UpcomingEventsProps } from './UpcomingEvents.types';
import type { UpcomingEvent } from '../../Dashboard.types';

const EventIcon: React.FC<{ type: UpcomingEvent['type'] }> = ({ type }) => {
  const iconClass = 'w-4 h-4';

  switch (type) {
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
    case 'maintenance':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'booking':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'review':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
  'check-in': {
    bg: 'bg-success-light dark:bg-success/20',
    text: 'text-success',
    border: 'border-success/30',
  },
  'check-out': {
    bg: 'bg-warning-light dark:bg-warning/20',
    text: 'text-warning',
    border: 'border-warning/30',
  },
  maintenance: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-600',
  },
  booking: {
    bg: 'bg-primary/10 dark:bg-primary/20',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  review: {
    bg: 'bg-info-light dark:bg-info/20',
    text: 'text-info',
    border: 'border-info/30',
  },
};

const statusBadgeStyles: Record<string, string> = {
  today: 'bg-primary text-white',
  upcoming: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  overdue: 'bg-error text-white',
};

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  maxItems = 5,
  showDate = true,
  title = 'Upcoming Events',
  emptyMessage = 'No upcoming events',
  className = '',
}) => {
  const displayedEvents = events.slice(0, maxItems);

  return (
    <Card variant="bordered" className={className}>
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </Card.Header>
      <Card.Body className="p-0">
        {displayedEvents.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {displayedEvents.map((event) => {
              const styles = typeStyles[event.type] || typeStyles.booking;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors"
                >
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.bg}`}
                    >
                      <span className={styles.text}>
                        <EventIcon type={event.type} />
                      </span>
                    </div>
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </p>
                        {event.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {event.subtitle}
                          </p>
                        )}
                        {event.property && (
                          <p className="text-xs text-primary mt-1">
                            {event.property.name}
                          </p>
                        )}
                      </div>
                      {event.status && (
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${statusBadgeStyles[event.status] || statusBadgeStyles.upcoming}`}
                        >
                          {event.status === 'today' ? 'Today' : event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      )}
                    </div>
                    {showDate && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {event.date}
                        {event.time && ` at ${event.time}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
