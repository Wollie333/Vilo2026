/**
 * PolicyCard
 *
 * Displays a single cancellation policy with timeline visualization.
 * Used in the CancellationPoliciesTab for management.
 */

import React from 'react';
import { Badge } from '@/components/ui';
import type { CancellationPolicy } from '@/types/legal.types';

interface PolicyCardProps {
  policy: CancellationPolicy;
  onEdit: (policy: CancellationPolicy) => void;
  onDelete: (policy: CancellationPolicy) => void;
}

// Icons
const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onEdit, onDelete }) => {
  const sortedTiers = [...policy.tiers].sort((a, b) => b.days - a.days);

  return (
    <div className="relative p-4 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {policy.name}
            </h4>
            {policy.is_default && (
              <Badge variant="default" size="sm">Default</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {policy.description || 'No description'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(policy)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-dark-border transition-colors"
            title="Edit policy"
          >
            <PencilIcon />
          </button>
          {!policy.is_default && (
            <button
              onClick={() => onDelete(policy)}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              title="Delete policy"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>

      {/* Refund timeline visualization */}
      <div className="pt-3 border-t border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <CalendarIcon />
          <span>Refund timeline</span>
        </div>
        <div className="flex items-center h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-dark-border">
          {sortedTiers.map((tier, index) => {
            // Calculate width based on days ratio
            const nextTier = sortedTiers[index + 1];
            const maxDays = 14;
            const startDay = tier.days;
            const endDay = nextTier?.days ?? 0;
            const width = ((startDay - endDay) / maxDays) * 100;

            if (width <= 0) return null;

            const bgColor =
              tier.refund === 100
                ? 'bg-green-500'
                : tier.refund >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500';

            return (
              <div
                key={index}
                className={`h-full ${bgColor}`}
                style={{ width: `${Math.max(width, 10)}%` }}
                title={`${tier.refund}% refund ${tier.days}+ days before`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
          <span>14+ days</span>
          <span>7 days</span>
          <span>Check-in</span>
        </div>
      </div>

      {/* Tier details */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
        <div className="flex flex-wrap gap-2">
          {sortedTiers.map((tier, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tier.refund === 100
                    ? 'bg-green-500'
                    : tier.refund >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              {tier.days > 0 ? `${tier.days}+ days: ${tier.refund}%` : `< 1 day: ${tier.refund}%`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
