import React from 'react';
import type { RefundRequestWithDetails } from '@/types/refund.types';

export interface RefundTimelineProps {
  refundRequest: RefundRequestWithDetails;
  className?: string;
}

interface TimelineEvent {
  label: string;
  description: string;
  timestamp?: string;
  user?: string;
  icon: string;
  iconColor: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export const RefundTimeline: React.FC<RefundTimelineProps> = ({
  refundRequest,
  className = '',
}) => {
  const getTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const status = refundRequest.status;

    // Event 1: Requested
    events.push({
      label: 'Requested',
      description: 'Refund request submitted',
      timestamp: refundRequest.created_at,
      user: refundRequest.requested_by_user?.name,
      icon: '📝',
      iconColor: 'bg-info text-white',
      isCompleted: true,
      isCurrent: status === 'requested',
    });

    // Event 2: Under Review (optional - only if status reached it)
    if (['under_review', 'approved', 'rejected', 'processing', 'completed'].includes(status)) {
      events.push({
        label: 'Under Review',
        description: 'Request being reviewed by admin',
        timestamp: refundRequest.created_at, // We don't have a separate timestamp
        icon: '👀',
        iconColor: 'bg-warning text-white',
        isCompleted: true,
        isCurrent: status === 'under_review',
      });
    }

    // Event 3: Approved or Rejected
    if (status === 'rejected') {
      events.push({
        label: 'Rejected',
        description: refundRequest.review_notes || 'Request declined',
        timestamp: refundRequest.reviewed_at || undefined,
        user: refundRequest.reviewed_by_user?.name,
        icon: '❌',
        iconColor: 'bg-error text-white',
        isCompleted: true,
        isCurrent: true,
      });
    } else if (['approved', 'processing', 'completed', 'failed'].includes(status)) {
      events.push({
        label: 'Approved',
        description: `Approved for ${refundRequest.approved_amount?.toFixed(2) || '0.00'}`,
        timestamp: refundRequest.reviewed_at || undefined,
        user: refundRequest.reviewed_by_user?.name,
        icon: '✅',
        iconColor: 'bg-success text-white',
        isCompleted: true,
        isCurrent: status === 'approved',
      });
    }

    // Event 4: Processing
    if (['processing', 'completed', 'failed'].includes(status)) {
      events.push({
        label: 'Processing',
        description: 'Refund being processed',
        icon: '⚙️',
        iconColor: 'bg-primary text-white',
        isCompleted: status !== 'processing',
        isCurrent: status === 'processing',
      });
    }

    // Event 5: Completed or Failed
    if (status === 'completed') {
      events.push({
        label: 'Completed',
        description: `Refunded ${refundRequest.refunded_amount?.toFixed(2) || '0.00'}`,
        icon: '🎉',
        iconColor: 'bg-success text-white',
        isCompleted: true,
        isCurrent: true,
      });
    } else if (status === 'failed') {
      events.push({
        label: 'Failed',
        description: refundRequest.failure_reason || 'Processing failed',
        icon: '⚠️',
        iconColor: 'bg-error text-white',
        isCompleted: true,
        isCurrent: true,
      });
    }

    return events;
  };

  const events = getTimelineEvents();

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Refund Timeline
      </h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex items-start gap-4">
              {/* Icon */}
              <div
                className={`
                  relative z-10 flex-shrink-0 w-12 h-12 rounded-full
                  flex items-center justify-center text-xl
                  ${event.iconColor}
                  ${event.isCurrent ? 'ring-4 ring-primary/20' : ''}
                  ${!event.isCompleted ? 'opacity-50' : ''}
                `}
              >
                {event.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`
                      text-base font-semibold
                      ${event.isCompleted ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}
                    `}
                  >
                    {event.label}
                  </h4>
                  {event.isCurrent && (
                    <span className="px-2 py-0.5 text-2xs font-medium bg-primary/10 text-primary rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <p
                  className={`
                    text-sm mt-1
                    ${event.isCompleted ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}
                  `}
                >
                  {event.description}
                </p>

                {event.timestamp && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleString('en-ZA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {event.user && ` • ${event.user}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
