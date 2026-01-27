/**
 * Quote Request Card Component
 *
 * Displays a quote request in a card format for property owner management
 */

import React from 'react';
import type { QuoteRequestCardProps } from './QuoteRequestCard.types';
import {
  STATUS_BADGE_COLORS,
  GROUP_TYPE_LABELS,
  GROUP_TYPE_OPTIONS,
  DATE_FLEXIBILITY_LABELS,
} from '@/types/quote-request.types';
import {
  UserCircle,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  Flag,
} from 'lucide-react';

export const QuoteRequestCard: React.FC<QuoteRequestCardProps> = ({ quote, onClick }) => {
  console.log('[QuoteRequestCard] Rendering card for quote:', quote.id);

  // Calculate days until expiration
  const daysUntilExpiration = quote.expires_at
    ? Math.ceil((new Date(quote.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 3 && daysUntilExpiration > 0;
  const isHighPriority = quote.priority >= 2;

  // Get status badge config
  const statusConfig = STATUS_BADGE_COLORS[quote.status];

  // Get group type icon
  const groupTypeOption = GROUP_TYPE_OPTIONS.find((opt) => opt.value === quote.group_type);
  const groupTypeIcon = groupTypeOption?.icon || '📝';

  // Format date display
  const formatDateDisplay = () => {
    if (quote.date_flexibility === 'exact' && quote.preferred_check_in && quote.preferred_check_out) {
      const checkIn = new Date(quote.preferred_check_in).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const checkOut = new Date(quote.preferred_check_out).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${checkIn} - ${checkOut}`;
    } else if (quote.date_flexibility === 'flexible' && quote.flexible_date_start && quote.flexible_date_end) {
      const start = new Date(quote.flexible_date_start).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const end = new Date(quote.flexible_date_end).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `Flexible: ${start} - ${end}`;
    } else {
      return `Very flexible${quote.nights_count ? ` (${quote.nights_count} nights)` : ''}`;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={() => onClick?.(quote)}
      className={`
        bg-white dark:bg-dark-card
        border border-gray-200 dark:border-dark-border
        rounded-lg p-4
        hover:shadow-md hover:border-primary
        transition-all cursor-pointer
        ${isHighPriority ? 'ring-2 ring-yellow-400' : ''}
      `}
    >
      {/* Property Name Badge */}
      {quote.property && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-dark-text-tertiary uppercase">
              Property:
            </span>
            <span className="text-sm font-semibold text-primary">
              {quote.property.name}
            </span>
            {quote.property.address_city && (
              <span className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                • {quote.property.address_city}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Header: Guest Info + Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0">
            {getInitials(quote.guest_name)}
          </div>

          {/* Guest Details */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary text-lg">
              {quote.guest_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{quote.guest_email}</p>
            {quote.guest_phone && (
              <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">{quote.guest_phone}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${statusConfig.bg} ${statusConfig.text}
          `}
          >
            {statusConfig.label}
          </span>

          {/* Priority Flag */}
          {isHighPriority && (
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs">
              <Flag className="w-4 h-4" />
              <span>High Priority</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Info */}
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-dark-text-secondary">{formatDateDisplay()}</span>
        <span
          className="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
        >
          {DATE_FLEXIBILITY_LABELS[quote.date_flexibility]}
        </span>
      </div>

      {/* Group Info */}
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-dark-text-secondary">
          {quote.adults_count} adults
          {quote.children_count > 0 && `, ${quote.children_count} children`}
        </span>
        <span className="text-lg" title={GROUP_TYPE_LABELS[quote.group_type]}>
          {groupTypeIcon}
        </span>
        <span className="text-sm text-gray-600 dark:text-dark-text-tertiary capitalize">
          {GROUP_TYPE_LABELS[quote.group_type]}
        </span>
      </div>

      {/* Budget Info */}
      {(quote.budget_min || quote.budget_max) && (
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 dark:text-dark-text-secondary">
            Budget: {quote.currency} {quote.budget_min?.toLocaleString() || '0'} -{' '}
            {quote.budget_max ? quote.budget_max.toLocaleString() : 'No max'}
          </span>
        </div>
      )}

      {/* Footer: Metadata */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-dark-text-tertiary">
          <span>Submitted {new Date(quote.created_at).toLocaleDateString()}</span>
          {quote.conversation && (
            <span className="text-blue-600 dark:text-blue-400">
              💬 Chat started
            </span>
          )}
        </div>

        {/* Expiration Warning */}
        {isExpiringSoon && (
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>Expires in {daysUntilExpiration}d</span>
          </div>
        )}
      </div>

      {/* Special Requirements Preview */}
      {quote.special_requirements && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
          <p className="text-xs text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wide mb-1">
            Special Requirements
          </p>
          <p className="text-sm text-gray-700 dark:text-dark-text-secondary line-clamp-2">
            {quote.special_requirements}
          </p>
        </div>
      )}
    </div>
  );
};
