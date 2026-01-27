/**
 * UserSubscriptionTab Component
 *
 * Displays subscription details and usage limits for a user
 * Allows admin to upgrade, pause, cancel, or resume subscriptions
 * Super admin only - used in User Detail Page
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Spinner,
  Badge,
  Alert,
  Button,
  Modal,
} from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { adminSubscriptionService } from '@/services';
import type { SubscriptionDisplayInfo } from '@/services/admin-subscription.service';
import { UpgradeSubscriptionModal } from './UpgradeSubscriptionModal';

interface UsageItem {
  used: number;
  limit: number | null;
}

interface Usage {
  properties: UsageItem;
  rooms: UsageItem;
  team_members: UsageItem;
  bookings: UsageItem;
}

interface UserSubscriptionTabProps {
  userId: string;
  userName: string;
}

export const UserSubscriptionTab: React.FC<UserSubscriptionTabProps> = ({ userId, userName }) => {
  // State
  const [displayInfo, setDisplayInfo] = useState<SubscriptionDisplayInfo | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // Action states
  const [pauseReason, setPauseReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch subscription
  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get formatted subscription display info
      const info = await adminSubscriptionService.getSubscriptionDisplay(userId);
      setDisplayInfo(info);

      // Extract usage from subscription limits
      const limits = info.subscription.subscription_type?.limits || {};
      setUsage({
        properties: { used: 0, limit: limits.max_properties || null },
        rooms: { used: 0, limit: limits.max_rooms || null },
        team_members: { used: 0, limit: limits.max_team_members || null },
        bookings: { used: 0, limit: limits.max_bookings_per_month || null },
      });
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.response?.data?.error || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  // Action Handlers
  const handlePauseSubscription = async () => {
    if (!pauseReason.trim()) {
      alert('Please provide a reason for pausing the subscription');
      return;
    }

    try {
      setActionLoading(true);
      await adminSubscriptionService.pauseSubscription(userId, pauseReason);
      setShowPauseDialog(false);
      setPauseReason('');
      await fetchSubscription();
      alert('Subscription paused successfully. User has been notified.');
    } catch (err: any) {
      console.error('Error pausing subscription:', err);
      alert(err.response?.data?.error || 'Failed to pause subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancelling the subscription');
      return;
    }

    try {
      setActionLoading(true);
      await adminSubscriptionService.cancelSubscription(userId, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
      await fetchSubscription();
      alert('Subscription cancelled successfully. User has been notified.');
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      alert(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setActionLoading(true);
      await adminSubscriptionService.reactivateSubscription(userId);
      setShowResumeDialog(false);
      await fetchSubscription();
      alert('Subscription reactivated successfully. User has been notified.');
    } catch (err: any) {
      console.error('Error reactivating subscription:', err);
      alert(err.response?.data?.error || 'Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUsagePercentage = (used: number, limit: number | null): number => {
    if (!limit || limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (used: number, limit: number | null): string => {
    if (!limit || limit === -1) return 'bg-gray-400';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getStatusBadgeVariant = (color: string): 'success' | 'warning' | 'error' | 'secondary' => {
    if (color === 'green') return 'success';
    if (color === 'yellow') return 'warning';
    if (color === 'red') return 'error';
    return 'secondary';
  };

  return (
    <div className="space-y-4">
      {/* Loading / Error States */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : !displayInfo ? (
        <Alert variant="warning">No active subscription found for this user.</Alert>
      ) : (
        <>
          {/* Subscription Overview Card */}
          <Card>
            <Card.Body className="p-4">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {displayInfo.plan_display_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {displayInfo.plan_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(displayInfo.status_color)} size="sm">
                    {displayInfo.status_label}
                  </Badge>
                  {displayInfo.is_active ? (
                    <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-gray-400">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing & Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current Price</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                    {displayInfo.current_price_formatted}
                    <span className="text-xs text-gray-500 ml-1">/{displayInfo.billing_interval}</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Billing Interval</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                    {displayInfo.billing_interval_label}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Next Billing</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                    {displayInfo.next_billing_date ? formatDate(displayInfo.next_billing_date) : 'N/A'}
                  </p>
                </div>

                {displayInfo.days_remaining !== null && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Days Remaining</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                      {displayInfo.days_remaining} days
                    </p>
                  </div>
                )}
              </div>

              {/* Paused/Cancelled Info */}
              {displayInfo.paused_reason && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Paused by: {displayInfo.paused_by_admin?.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    {displayInfo.paused_reason}
                  </p>
                </div>
              )}

              {displayInfo.cancelled_reason && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Cancelled by: {displayInfo.cancelled_by_admin?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    {displayInfo.cancelled_reason}
                  </p>
                  {displayInfo.access_end_date && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      Access ends: {formatDate(displayInfo.access_end_date)}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                {displayInfo.can_upgrade && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    Upgrade Plan
                  </Button>
                )}

                {displayInfo.can_pause && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPauseDialog(true)}
                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20"
                  >
                    Pause Subscription
                  </Button>
                )}

                {displayInfo.can_resume && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowResumeDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Resume Subscription
                  </Button>
                )}

                {displayInfo.can_cancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Usage & Limits */}
          {usage && (
            <Card>
              <Card.Body className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Plan Limits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(usage).map(([key, item]) => {
                    const labels: Record<string, string> = {
                      properties: '📍 Properties',
                      rooms: '🏠 Rooms',
                      team_members: '👥 Team Members',
                      bookings: '📅 Bookings (Month)',
                    };

                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {labels[key]}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {item.used} / {item.limit === -1 || !item.limit ? '∞' : item.limit}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getUsageColor(item.used, item.limit)}`}
                            style={{ width: `${getUsagePercentage(item.used, item.limit)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && displayInfo && (
        <UpgradeSubscriptionModal
          userId={userId}
          userName={userName}
          currentPlan={displayInfo.plan_display_name}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => {
            setShowUpgradeModal(false);
            fetchSubscription();
          }}
        />
      )}

      {/* Pause Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPauseDialog}
        title="Pause Subscription"
        message={`Pause subscription for ${userName}? Billing will stop immediately and the user will have read-only access.`}
        confirmText="Pause Subscription"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handlePauseSubscription}
        onCancel={() => {
          setShowPauseDialog(false);
          setPauseReason('');
        }}
        isLoading={actionLoading}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for pausing (required):
          </label>
          <textarea
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
            rows={3}
            placeholder="Enter reason for pausing this subscription..."
            required
          />
        </div>
      </ConfirmDialog>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <Modal isOpen={showCancelDialog} onClose={() => setShowCancelDialog(false)} title="Cancel Subscription">
          <Modal.Body>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Cancel subscription for {userName}? Billing will stop immediately but the user will retain access until {displayInfo?.access_end_date ? formatDate(displayInfo.access_end_date) : 'the end of their billing period'}.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for cancelling (required):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
                rows={3}
                placeholder="Enter reason for cancelling this subscription..."
                required
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                }}
                disabled={actionLoading}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                isLoading={actionLoading}
              >
                Cancel Subscription
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* Resume Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResumeDialog}
        title="Resume Subscription"
        message={`Resume subscription for ${userName}? Full access will be restored and billing will continue.`}
        confirmText="Resume Subscription"
        cancelText="Cancel"
        variant="info"
        onConfirm={handleResumeSubscription}
        onCancel={() => setShowResumeDialog(false)}
        isLoading={actionLoading}
      />
    </div>
  );
};
