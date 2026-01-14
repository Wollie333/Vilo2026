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
  const [billingInfo, setBillingInfo] = useState<UserBillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                    const pricing = subscription.subscription_type.pricing || { monthly: 0, annual: 0 };
                    const billingDays = subscription.subscription_type.billing_cycle_days;
                    // Determine which price to show based on billing cycle
                    const isAnnual = billingDays === 365;
                    const displayPrice = isAnnual ? pricing.annual : pricing.monthly;
                    return (
                      <>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(displayPrice, subscription.subscription_type.currency)}
                        </p>
                        {subscription.subscription_type.is_recurring && billingDays && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            per {isAnnual ? 'year' : billingDays === 30 ? 'month' : `${billingDays} days`}
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
    </div>
  );
};
