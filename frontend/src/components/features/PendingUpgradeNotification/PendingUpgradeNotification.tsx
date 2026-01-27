/**
 * PendingUpgradeNotification Component
 *
 * Banner displayed at the top of the dashboard when an admin has requested
 * a subscription upgrade for the user. Shows upgrade details and allows
 * user to accept or decline.
 */

import React, { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import type { PendingUpgradeNotificationProps } from './PendingUpgradeNotification.types';

export const PendingUpgradeNotification: React.FC<PendingUpgradeNotificationProps> = ({
  upgradeRequest,
  onAccept,
  onDecline,
  onDismiss,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (): number => {
    const expiresAt = new Date(upgradeRequest.expires_at);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(upgradeRequest.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await onDecline(upgradeRequest.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const daysRemaining = getDaysRemaining();
  const targetPrice = upgradeRequest.target_plan.pricing_tiers.monthly?.price_cents || 0;
  const currentPrice = upgradeRequest.current_plan.current_price_cents;
  const priceDifference = targetPrice - currentPrice;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 p-4 mb-6 rounded-r-md">
      <div className="flex items-start justify-between">
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Upgrade Recommended
            </h3>
            <Badge variant="info" size="sm">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </Badge>
          </div>

          <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
            <strong>{upgradeRequest.requested_by_admin.full_name}</strong> recommends upgrading your plan from{' '}
            <strong>{upgradeRequest.current_plan.display_name}</strong> to{' '}
            <strong>{upgradeRequest.target_plan.display_name}</strong>
          </p>

          {/* Price Change */}
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-medium">Current:</span> {formatCurrency(currentPrice)}/mo
            </div>
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-medium">New:</span> {formatCurrency(targetPrice)}/mo
              {priceDifference > 0 && (
                <span className="ml-1 text-blue-600 dark:text-blue-500">
                  (+{formatCurrency(priceDifference)}/mo)
                </span>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          {upgradeRequest.admin_notes && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800 mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Message from admin:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{upgradeRequest.admin_notes}</p>
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-blue-600 dark:text-blue-500">
            If accepted, the upgrade will take effect on your next billing cycle.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-start gap-2 ml-4">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAccept}
            disabled={isProcessing}
            isLoading={isProcessing}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            disabled={isProcessing}
          >
            Decline
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
