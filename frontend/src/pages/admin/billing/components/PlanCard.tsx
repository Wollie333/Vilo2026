/**
 * PlanCard Component
 *
 * Displays a subscription plan as a card in the grid view.
 * Also supports a "create new" variant.
 */

import React from 'react';
import { Card, Badge } from '@/components/ui';
import type { SubscriptionType, BillingInterval } from '@/types/billing.types';

// Icons
const SubscriptionIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const LimitsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
    />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

// Color scheme for plan cards
const planColors = [
  'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
];

// Format price in cents to display
const formatPrice = (cents: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

interface PlanCardProps {
  plan?: SubscriptionType;
  colorIndex?: number;
  billingInterval?: BillingInterval;
  isCreateCard?: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  colorIndex = 0,
  billingInterval = 'monthly',
  isCreateCard = false,
  onClick,
  onDelete,
}) => {
  if (isCreateCard) {
    return (
      <Card
        variant="bordered"
        interactive
        className="cursor-pointer border-2 border-dashed hover:border-primary/50 transition-colors"
        onClick={onClick}
      >
        <Card.Body className="flex flex-col items-center justify-center py-10 min-h-[240px]">
          <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 mb-4">
            <PlusIcon />
          </div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Create New Plan
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Add a new subscription plan
          </p>
        </Card.Body>
      </Card>
    );
  }

  if (!plan) return null;

  const colorClass = planColors[colorIndex % planColors.length];

  // Get price based on billing interval
  const pricing = plan.pricing || { monthly: 0, annual: 0 };
  const displayPrice = billingInterval === 'monthly' ? pricing.monthly : pricing.annual;
  const isFree = displayPrice === 0 && pricing.monthly === 0 && pricing.annual === 0;

  return (
    <Card
      variant="feature"
      interactive
      className="cursor-pointer group"
      onClick={onClick}
    >
      <Card.Body className="relative">
        {/* Status Badge & Delete - Top Right */}
        <div className="absolute top-0 right-0 flex items-center gap-2">
          <Badge variant={plan.is_active ? 'success' : 'default'} size="sm">
            {plan.is_active ? 'Active' : 'Inactive'}
          </Badge>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete plan"
            >
              <TrashIcon />
            </button>
          )}
        </div>

        {/* Icon */}
        <div className={`p-3 rounded-xl ${colorClass} w-fit mb-4`}>
          <SubscriptionIcon />
        </div>

        {/* Plan Name */}
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 pr-16">
          {plan.display_name}
        </h4>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
          {plan.description || 'No description provided'}
        </p>

        {/* Price */}
        <div className="mb-4">
          {isFree ? (
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Free</span>
          ) : (
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(displayPrice, plan.currency)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                / {billingInterval === 'monthly' ? 'month' : 'year'}
              </span>
              {billingInterval === 'annual' && pricing.monthly > 0 && (() => {
                const monthlyAnnualized = pricing.monthly * 12;
                const savings = monthlyAnnualized - pricing.annual;
                const savingsPercent = Math.round((savings / monthlyAnnualized) * 100);
                if (savingsPercent > 0) {
                  return (
                    <Badge variant="success" size="sm" className="ml-1">
                      Save {savingsPercent}%
                    </Badge>
                  );
                }
                return null;
              })()}
              {plan.trial_period_days && plan.trial_period_days > 0 && (
                <Badge variant="warning" size="sm" className="ml-1">
                  {plan.trial_period_days}-day trial
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Limits Summary */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <LimitsIcon />
          <span>{Object.keys(plan.limits || {}).length} resource limits</span>
        </div>

        {/* Edit Prompt */}
        <div className="pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
            <EditIcon />
            <span>Edit Plan</span>
          </div>
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card.Body>
    </Card>
  );
};
