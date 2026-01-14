import React, { useState, useEffect } from 'react';
import { legalService } from '@/services';
import { Spinner } from '../Spinner';
import type { CancellationPolicyEditorProps } from './CancellationPolicyEditor.types';
import type { CancellationPolicy } from '@/types/legal.types';

// Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export const CancellationPolicyEditor: React.FC<CancellationPolicyEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch policies on mount
  useEffect(() => {
    const loadPolicies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await legalService.getCancellationPolicies();
        setPolicies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cancellation policies');
        console.error('Failed to load cancellation policies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPolicies();
  }, []);

  const handlePolicySelect = (policyId: string) => {
    if (disabled) return;
    onChange(policyId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          Loading policies...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <ExclamationIcon />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  // No policies
  if (policies.length === 0) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No cancellation policies configured. Please contact an administrator to set up policies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Policy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((policy) => {
          const isSelected = value === policy.id;
          const sortedTiers = [...policy.tiers].sort((a, b) => b.days - a.days);

          return (
            <button
              key={policy.id}
              type="button"
              onClick={() => handlePolicySelect(policy.id)}
              disabled={disabled}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                  <CheckIcon />
                </div>
              )}

              {/* Policy header */}
              <div className="pr-8">
                <h4 className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                  {policy.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {policy.description || 'No description'}
                </p>
              </div>

              {/* Refund timeline visualization */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <CalendarIcon />
                  <span>Refund timeline</span>
                </div>
                <div className="flex items-center h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-dark-border">
                  {sortedTiers.map((tier, index) => {
                    // Calculate width based on days ratio
                    const nextTier = sortedTiers[index + 1];
                    const maxDays = 14;
                    const startDay = Math.min(tier.days, maxDays);
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
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>100% refund</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>50% refund</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>No refund</span>
        </div>
      </div>
    </div>
  );
};
