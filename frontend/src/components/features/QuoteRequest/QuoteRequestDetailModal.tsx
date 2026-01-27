/**
 * Quote Request Detail Modal Component
 *
 * Displays full quote request details and allows property owners to respond
 */

import React, { useState } from 'react';
import type { QuoteRequestDetailModalProps } from './QuoteRequestDetailModal.types';
import { Modal, Button, Spinner } from '@/components/ui';
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
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Flag,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const QuoteRequestDetailModal: React.FC<QuoteRequestDetailModalProps> = ({
  quote,
  isOpen,
  onClose,
  onRespond,
  onUpdateStatus,
  onConvert,
}) => {
  console.log('[QuoteRequestDetailModal] Rendering with quote:', quote?.id);

  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<'respond' | 'decline' | null>(null);

  if (!quote) return null;

  const statusConfig = STATUS_BADGE_COLORS[quote.status];
  const groupTypeOption = GROUP_TYPE_OPTIONS.find((opt) => opt.value === quote.group_type);
  const groupTypeIcon = groupTypeOption?.icon || '📝';

  const isHighPriority = quote.priority >= 2;

  // Format date display
  const formatDateDisplay = () => {
    if (quote.date_flexibility === 'exact' && quote.preferred_check_in && quote.preferred_check_out) {
      return {
        primary: `${new Date(quote.preferred_check_in).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })} - ${new Date(quote.preferred_check_out).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}`,
        secondary: `${
          Math.ceil(
            (new Date(quote.preferred_check_out).getTime() - new Date(quote.preferred_check_in).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        } nights`,
      };
    } else if (quote.date_flexibility === 'flexible' && quote.flexible_date_start && quote.flexible_date_end) {
      return {
        primary: `Flexible between ${new Date(quote.flexible_date_start).toLocaleDateString()} - ${new Date(
          quote.flexible_date_end
        ).toLocaleDateString()}`,
        secondary: quote.nights_count ? `Approximately ${quote.nights_count} nights` : '',
      };
    } else {
      return {
        primary: 'Very flexible dates',
        secondary: quote.nights_count ? `Approximately ${quote.nights_count} nights` : 'Duration flexible',
      };
    }
  };

  const dateInfo = formatDateDisplay();

  // Handle respond action
  const handleRespond = async () => {
    if (!response.trim()) {
      alert('Please enter a response message');
      return;
    }

    setIsSubmitting(true);
    setActiveAction('respond');

    try {
      await onRespond?.(quote.id, response);
      setResponse('');
      // Success - modal will close and list will refresh
      onClose();
    } catch (error) {
      console.error('[QuoteRequestDetailModal] Failed to respond:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send response. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  // Handle decline action
  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this quote request? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setActiveAction('decline');

    try {
      await onUpdateStatus?.(quote.id, 'declined');
      // Success - modal will close and list will refresh
      onClose();
    } catch (error) {
      console.error('[QuoteRequestDetailModal] Failed to decline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to decline quote. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  };

  // Handle convert action
  const handleConvert = () => {
    if (!confirm('Are you ready to convert this quote to a booking? This will mark the quote as converted.')) {
      return;
    }

    // The actual conversion is handled by the parent component
    onConvert?.(quote.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
              Quote Request Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
              Reference: {quote.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${statusConfig.bg} ${statusConfig.text}
              `}
            >
              {statusConfig.label}
            </span>
            {isHighPriority && (
              <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm">
                <Flag className="w-5 h-5" />
                <span>High Priority</span>
              </div>
            )}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="max-h-[calc(90vh-300px)] overflow-y-auto space-y-6">
          {/* Guest Information */}
          <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3 flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              Guest Information
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">Name</p>
                <p className="font-medium text-gray-900 dark:text-dark-text-primary">{quote.guest_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-tertiary flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <a
                  href={`mailto:${quote.guest_email}`}
                  className="font-medium text-primary hover:underline"
                >
                  {quote.guest_email}
                </a>
              </div>
              {quote.guest_phone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <a
                    href={`tel:${quote.guest_phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {quote.guest_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Date Requirements */}
          <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Requirements
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-1 rounded text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                >
                  {DATE_FLEXIBILITY_LABELS[quote.date_flexibility]}
                </span>
              </div>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{dateInfo.primary}</p>
              {dateInfo.secondary && (
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{dateInfo.secondary}</p>
              )}
            </div>
          </div>

          {/* Group Details */}
          <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Group Details
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">Group Size</p>
                <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                  {quote.adults_count} adults
                  {quote.children_count > 0 && `, ${quote.children_count} children`}
                  {' '} ({quote.group_size} total guests)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">Group Type</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{groupTypeIcon}</span>
                  <span className="font-medium text-gray-900 dark:text-dark-text-primary">
                    {GROUP_TYPE_LABELS[quote.group_type]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Range */}
          {(quote.budget_min || quote.budget_max) && (
            <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget Range
              </h3>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary text-lg">
                {quote.currency} {quote.budget_min?.toLocaleString() || '0'} -{' '}
                {quote.budget_max ? quote.budget_max.toLocaleString() : 'No maximum'}
              </p>
            </div>
          )}

          {/* Event Details */}
          {(quote.event_type || quote.event_description) && (
            <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                Event Details
              </h3>
              {quote.event_type && (
                <div className="mb-2">
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">Event Type</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary capitalize">
                    {quote.event_type}
                  </p>
                </div>
              )}
              {quote.event_description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">Description</p>
                  <p className="text-gray-900 dark:text-dark-text-primary">{quote.event_description}</p>
                </div>
              )}
            </div>
          )}

          {/* Special Requirements */}
          {quote.special_requirements && (
            <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                Special Requirements
              </h3>
              <p className="text-gray-900 dark:text-dark-text-primary whitespace-pre-wrap">
                {quote.special_requirements}
              </p>
            </div>
          )}

          {/* Owner Response (if exists) */}
          {quote.owner_response && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Your Response
              </h3>
              <p className="text-green-900 dark:text-green-100 whitespace-pre-wrap mb-2">
                {quote.owner_response}
              </p>
              {quote.responded_at && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  Responded on {new Date(quote.responded_at).toLocaleDateString()} at{' '}
                  {new Date(quote.responded_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {/* Response Form (only for pending/responded quotes) */}
          {(quote.status === 'pending' || quote.status === 'responded') && (
            <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                {quote.status === 'pending' ? 'Send Response' : 'Update Response'}
              </h3>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response to the guest..."
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text-primary resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                    Quote Request Submitted
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                    {new Date(quote.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {quote.responded_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                      Response Sent
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                      {new Date(quote.responded_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {quote.expires_at && quote.status === 'pending' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                      Expires
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                      {new Date(quote.expires_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Link */}
          {quote.conversation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-200">Chat Conversation</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Continue the conversation with the guest
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(`/chat?conversation=${quote.conversation_id}`, '_blank')}
                >
                  Open Chat
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
          {/* Respond Button */}
          {(quote.status === 'pending' || quote.status === 'responded') && (
            <Button
              variant="primary"
              onClick={handleRespond}
              disabled={isSubmitting || !response.trim()}
              isLoading={isSubmitting && activeAction === 'respond'}
            >
              {quote.status === 'pending' ? 'Send Response' : 'Update Response'}
            </Button>
          )}

          {/* Decline Button */}
          {quote.status === 'pending' && (
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isSubmitting}
              isLoading={isSubmitting && activeAction === 'decline'}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <XCircle className="w-5 h-5 mr-1" />
              Decline Quote
            </Button>
          )}

          {/* Convert Button */}
          {(quote.status === 'responded' || quote.status === 'pending') && (
            <Button
              variant="outline"
              onClick={handleConvert}
              disabled={isSubmitting}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <CheckCircle className="w-5 h-5 mr-1" />
              Convert to Booking
            </Button>
          )}

          {/* Close Button */}
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="ml-auto">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
