/**
 * SubscriptionPlansSection Component
 *
 * Modern card-based view of subscription plans with:
 * - Visual plan cards
 * - Copy checkout link functionality
 * - Quick actions (edit, duplicate, preview)
 * - Create new plan
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, ConfirmDialog } from '@/components/ui';
import { billingService } from '@/services';
import type { SubscriptionType } from '@/types/billing.types';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
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

interface SubscriptionPlansSectionProps {
  subscriptionTypes: SubscriptionType[];
  onRefresh: () => void;
}

export const SubscriptionPlansSection: React.FC<SubscriptionPlansSectionProps> = ({
  subscriptionTypes,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [forceDeletePlanId, setForceDeletePlanId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Format price from cents
  const formatPrice = (cents: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  // Check if plan is free
  const isPlanFree = (plan: SubscriptionType): boolean => {
    const monthly = plan.pricing_tiers?.monthly?.price_cents || 0;
    const annual = plan.pricing_tiers?.annual?.price_cents || 0;
    return monthly === 0 && annual === 0;
  };

  // Get checkout URL
  const getCheckoutUrl = (plan: SubscriptionType): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/plans/${plan.slug}`;
  };

  // Copy checkout URL to clipboard
  const handleCopyCheckoutLink = async (plan: SubscriptionType) => {
    const url = getCheckoutUrl(plan);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(plan.slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Open editor for creating new plan
  const handleCreate = () => {
    navigate('/admin/billing/plans/new');
  };

  // Open editor for editing existing plan
  const handleEdit = (plan: SubscriptionType) => {
    navigate(`/admin/billing/plans/${plan.id}/edit`);
  };

  // Preview checkout page
  const handlePreview = (plan: SubscriptionType) => {
    window.open(getCheckoutUrl(plan), '_blank');
  };

  // Delete plan (normal)
  const handleDelete = async (planId: string) => {
    setIsDeleting(true);
    try {
      await billingService.deleteSubscriptionType(planId);
      onRefresh();
      setDeletingPlanId(null);
      setDeleteError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete plan';
      console.error('Failed to delete plan:', err);

      // If error mentions checkout history, offer force delete
      if (errorMessage.includes('checkout')) {
        setDeleteError(errorMessage);
        setForceDeletePlanId(planId);
        setDeletingPlanId(null);
      } else {
        setDeleteError(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Force delete plan (with checkout history)
  const handleForceDelete = async (planId: string) => {
    setIsDeleting(true);
    try {
      await billingService.forceDeleteSubscriptionType(planId);
      onRefresh();
      setForceDeletePlanId(null);
      setDeleteError(null);
    } catch (err) {
      console.error('Failed to force delete plan:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to force delete plan');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subscription Plans
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage pricing tiers and checkout pages
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <PlusIcon />
          <span className="ml-2">Create Plan</span>
        </Button>
      </div>

      {/* Plans Grid */}
      {subscriptionTypes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-card rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No subscription plans yet</p>
          <Button variant="primary" onClick={handleCreate}>
            <PlusIcon />
            <span className="ml-2">Create Your First Plan</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptionTypes.map((plan) => {
            const isFree = isPlanFree(plan);
            const isCopied = copiedSlug === plan.slug;

            return (
              <div
                key={plan.id}
                className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {plan.display_name}
                      </h3>
                      {!plan.is_active && (
                        <Badge variant="default" size="sm">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-dark-border">
                  {isFree ? (
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">Free</div>
                  ) : (
                    <div className="space-y-1">
                      {plan.pricing_tiers?.monthly?.price_cents && plan.pricing_tiers.monthly.price_cents > 0 && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatPrice(plan.pricing_tiers.monthly.price_cents, plan.currency)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                        </div>
                      )}
                      {plan.pricing_tiers?.annual?.price_cents && plan.pricing_tiers.annual.price_cents > 0 && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            {formatPrice(plan.pricing_tiers.annual.price_cents, plan.currency)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">/year</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Checkout Link */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Checkout Page
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-dark-bg rounded border border-gray-200 dark:border-dark-border overflow-hidden">
                      <code className="text-xs text-gray-600 dark:text-gray-400 block truncate">
                        /plans/{plan.slug}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyCheckoutLink(plan)}
                      className={`
                        p-2 rounded border transition-colors
                        ${
                          isCopied
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400'
                            : 'bg-white dark:bg-dark-card border-gray-300 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg'
                        }
                      `}
                      title={isCopied ? 'Copied!' : 'Copy link'}
                    >
                      {isCopied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                    className="flex-1"
                  >
                    <EditIcon />
                    <span className="ml-1">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(plan)}
                    title="Preview checkout page"
                  >
                    <ExternalLinkIcon />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingPlanId(plan.id)}
                    className="text-error border-error hover:bg-error/10"
                    title="Delete plan"
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPlanId && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Subscription Plan"
          message="Are you sure you want to delete this plan? This action cannot be undone."
          confirmText={isDeleting ? "Deleting..." : "Delete"}
          variant="danger"
          isLoading={isDeleting}
          onConfirm={() => handleDelete(deletingPlanId)}
          onClose={() => {
            if (!isDeleting) {
              setDeletingPlanId(null);
              setDeleteError(null);
            }
          }}
        />
      )}

      {/* Force Delete Confirmation Dialog */}
      {forceDeletePlanId && (
        <ConfirmDialog
          isOpen={true}
          title="Force Delete Subscription Plan"
          message={`${deleteError}\n\nWARNING: Force delete will permanently remove all checkout records (billing history) for this plan. This action cannot be undone.\n\nOnly use this for test plans that were never used in production.\n\nAre you sure you want to continue?`}
          confirmText={isDeleting ? "Deleting..." : "Force Delete (Destructive)"}
          variant="danger"
          isLoading={isDeleting}
          onConfirm={() => handleForceDelete(forceDeletePlanId)}
          onClose={() => {
            if (!isDeleting) {
              setForceDeletePlanId(null);
              setDeleteError(null);
            }
          }}
        />
      )}
    </div>
  );
};
