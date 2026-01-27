/**
 * BillingTab Component
 *
 * Displays the user's subscription information, plan details, and limits.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Spinner,
  Alert,
  Button,
  CreditCardIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@/components/ui';
import { PaymentHistoryList } from '@/components/features';
import { billingService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { UserBillingInfo, SubscriptionStatus } from '@/types/billing.types';
import { LIMIT_KEY_LABELS, SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_STATUS_COLORS } from '@/types/billing.types';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(cents / 100);
}

function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffTime = expires.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

interface LimitItemProps {
  limitKey: string;
  value: number;
}

const LimitItem: React.FC<LimitItemProps> = ({ limitKey, value }) => {
  const label = LIMIT_KEY_LABELS[limitKey] || limitKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const displayValue = value === -1 ? 'Unlimited' : value.toLocaleString();

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{displayValue}</span>
    </div>
  );
};

export const BillingTab: React.FC = () => {
  const { user } = useAuth();
  const [billingInfo, setBillingInfo] = useState<UserBillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const info = await billingService.getMyBillingInfo();
        setBillingInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load billing information');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingInfo();
  }, []);

  const handlePauseSubscription = async () => {
    if (!billingInfo?.subscription || !user?.id) return;

    if (!window.confirm('Pause your subscription? Billing will be suspended until you resume.')) {
      return;
    }

    try {
      setLoading(true);
      await billingService.pauseUserSubscription(user.id);

      // Refresh billing info
      const info = await billingService.getMyBillingInfo();
      setBillingInfo(info);
    } catch (err) {
      console.error('Failed to pause subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to pause subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!billingInfo?.subscription || !user?.id) return;

    if (!window.confirm('Resume your subscription? Billing will restart.')) {
      return;
    }

    try {
      setLoading(true);
      await billingService.resumeUserSubscription(user.id);

      // Refresh billing info
      const info = await billingService.getMyBillingInfo();
      setBillingInfo(info);
    } catch (err) {
      console.error('Failed to resume subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!billingInfo?.subscription || !user?.id) return;

    try {
      setIsCancelling(true);
      // Use current user's ID from auth context
      await billingService.cancelUserSubscription(
        user.id,
        cancelReason || undefined
      );

      // Refresh billing info
      const info = await billingService.getMyBillingInfo();
      setBillingInfo(info);

      // Close modal
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        {error}
      </Alert>
    );
  }

  const subscription = billingInfo?.subscription;
  const userType = billingInfo?.user_type;
  const limits = subscription?.limits || {};
  const daysRemaining = subscription?.expires_at ? getDaysRemaining(subscription.expires_at) : null;
  const isTrialing = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date();
  const trialDaysRemaining = subscription?.trial_ends_at ? getDaysRemaining(subscription.trial_ends_at) : null;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card variant="bordered">
        <Card.Header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <CreditCardIcon />
            </span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Current Plan</h3>
          </div>
          {subscription?.status && (
            <Badge
              variant={SUBSCRIPTION_STATUS_COLORS[subscription.status as SubscriptionStatus] === 'green' ? 'success' :
                       SUBSCRIPTION_STATUS_COLORS[subscription.status as SubscriptionStatus] === 'yellow' ? 'warning' :
                       SUBSCRIPTION_STATUS_COLORS[subscription.status as SubscriptionStatus] === 'red' ? 'error' :
                       SUBSCRIPTION_STATUS_COLORS[subscription.status as SubscriptionStatus] === 'blue' ? 'info' : 'default'}
            >
              {SUBSCRIPTION_STATUS_LABELS[subscription.status as SubscriptionStatus]}
            </Badge>
          )}
        </Card.Header>
        <Card.Body>
          {subscription ? (
            <div className="space-y-4">
              {/* Plan Name and Price */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {subscription.subscription_type.display_name}
                  </h4>
                  {subscription.subscription_type.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {subscription.subscription_type.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {(() => {
                    // Get price from pricing_tiers based on user's billing_interval
                    const pricingTiers = subscription.subscription_type.pricing_tiers;
                    const billingInterval = subscription.billing_interval || 'monthly';

                    let displayPrice = 0;
                    if (billingInterval === 'monthly') {
                      displayPrice = pricingTiers?.monthly?.price_cents || 0;
                    } else if (billingInterval === 'annual') {
                      displayPrice = pricingTiers?.annual?.price_cents || 0;
                    } else if (billingInterval === 'one_off') {
                      displayPrice = pricingTiers?.one_off?.price_cents || 0;
                    }

                    return (
                      <>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(displayPrice, subscription.subscription_type.currency)}
                        </p>
                        {billingInterval !== 'one_off' && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            per {billingInterval === 'annual' ? 'year' : 'month'}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Trial Badge */}
              {isTrialing && trialDaysRemaining !== null && (
                <div className="flex items-center gap-2 px-3 py-2 bg-info/10 rounded-lg">
                  <span className="text-info">
                    <CheckCircleIcon />
                  </span>
                  <span className="text-sm text-info">
                    Trial period: {trialDaysRemaining} days remaining
                  </span>
                </div>
              )}

              {/* Cancellation Notice */}
              {subscription.status === 'cancelled' && subscription.cancelled_at && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <span className="text-red-600 dark:text-red-400 text-lg mt-0.5">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        Subscription cancelled on {formatDate(subscription.cancelled_at)}
                      </p>
                      {subscription.expires_at && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Access remains until {formatDate(subscription.expires_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  {subscription.cancellation_reason && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reason for cancellation:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        {subscription.cancellation_reason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subscription Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500">
                    <CalendarIcon size="sm" />
                  </span>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Started</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.started_at)}
                    </p>
                  </div>
                </div>
                {subscription.expires_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 dark:text-gray-500">
                      <CalendarIcon size="sm" />
                    </span>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Renews</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(subscription.expires_at)}
                        {daysRemaining !== null && daysRemaining <= 7 && (
                          <span className="text-warning ml-1">({daysRemaining} days)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subscription Actions */}
              {!billingInfo?.is_team_member && (
                <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                  <div className="flex flex-wrap gap-2">
                    {/* Resume Button (for paused subscriptions) */}
                    {subscription.status === 'paused' && (
                      <Button
                        variant="primary"
                        onClick={handleResumeSubscription}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Resume Subscription
                      </Button>
                    )}

                    {/* Pause Button (for active/trial subscriptions) */}
                    {(subscription.status === 'active' || subscription.status === 'trial') && !subscription.cancelled_at && (
                      <Button
                        variant="outline"
                        onClick={handlePauseSubscription}
                        className="text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20"
                      >
                        Pause Subscription
                      </Button>
                    )}

                    {/* Cancel Button (for active/trial subscriptions) */}
                    {(subscription.status === 'active' || subscription.status === 'trial') && !subscription.cancelled_at && (
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelModal(true)}
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You don't have an active subscription.
              </p>
              <Button onClick={() => window.location.href = '/pricing'}>
                View Plans
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Plan Limits Card */}
      {subscription && Object.keys(limits).length > 0 && (
        <Card variant="bordered">
          <Card.Header>
            <div className="flex items-center gap-2">
              <span className="text-primary">
                <ChartBarIcon />
              </span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Plan Limits</h3>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="divide-y divide-gray-200 dark:divide-dark-border">
              {Object.entries(limits).map(([key, value]) => (
                <LimitItem key={key} limitKey={key} value={value} />
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* User Type Card */}
      {userType && (
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Account Type</h3>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userType.display_name}
                </p>
                {userType.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {userType.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {userType.can_have_subscription && (
                  <Badge variant="info" size="sm">Can Subscribe</Badge>
                )}
                {userType.can_have_team && (
                  <Badge variant="info" size="sm">Team Support</Badge>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Team Info */}
      {billingInfo?.is_team_member && (
        <Card variant="bordered">
          <Card.Body>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-info">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <p className="text-gray-600 dark:text-gray-400">
                You are part of a team. Your subscription is managed by the team owner.
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Payment History Card */}
      <Card variant="bordered">
        <Card.Header>
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <DocumentTextIcon />
            </span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payment History</h3>
          </div>
        </Card.Header>
        <Card.Body>
          <PaymentHistoryList pageSize={5} />
        </Card.Body>
      </Card>

      {/* Cancel Subscription Modal */}
      {showCancelModal && subscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cancel Subscription
              </h3>
            </Card.Header>
            <Card.Body>
              <Alert variant="warning" className="mb-4">
                {subscription.expires_at ? (
                  <>Your subscription will remain active until {formatDate(subscription.expires_at)}. After that, your account will be suspended.</>
                ) : (
                  <>Your subscription will be cancelled immediately and your account will be suspended.</>
                )}
              </Alert>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Help us improve by sharing why you're cancelling..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  disabled={isCancelling}
                  className="flex-1"
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCancelSubscription}
                  isLoading={isCancelling}
                  className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  Confirm Cancellation
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};
