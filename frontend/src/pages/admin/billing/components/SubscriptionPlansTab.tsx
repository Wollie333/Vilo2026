/**
 * SubscriptionPlansTab Component
 *
 * Simplified subscription plans management with card-based layout.
 * Uses a grid view for plans and a slide-in editor for create/edit.
 * Limits are now stored as JSONB directly on subscription types.
 */

import React, { useState } from 'react';
import { Alert, Spinner, ConfirmDialog } from '@/components/ui';
import { billingService } from '@/services';
import type { SubscriptionType, BillingInterval } from '@/types/billing.types';
import { PlanCard } from './PlanCard';
import { PlanEditor } from './PlanEditor';

// Predefined limit keys with display labels
export const PREDEFINED_LIMITS = [
  { key: 'max_companies', label: 'Max Companies', description: 'Maximum number of companies' },
  { key: 'max_properties', label: 'Max Properties', description: 'Maximum number of properties' },
  { key: 'max_rooms', label: 'Max Rooms', description: 'Maximum number of rooms across all properties' },
  { key: 'max_team_members', label: 'Max Team Members', description: 'Maximum team members allowed' },
  { key: 'max_bookings_per_month', label: 'Bookings / Month', description: 'Monthly booking limit' },
  { key: 'max_storage_mb', label: 'Storage (MB)', description: 'Storage limit in megabytes' },
] as const;

// Form limit type
export interface FormLimit {
  key: string;
  label: string;
  value: number;
  description?: string;
  isCustom: boolean;
  isUnlimited: boolean;
}

// Form data for creating/editing plans
export interface PlanFormData {
  name: string;
  display_name: string;
  description: string;
  price: string; // Legacy - dollar amount as string
  monthly_price: string; // Monthly price in dollars
  annual_price: string; // Annual price in dollars
  one_off_price: string; // One-off price in dollars
  currency: string;
  billing_cycle_days: number | null;
  is_recurring: boolean;
  trial_period_days: number | null;
  is_active: boolean;
  limits: FormLimit[];

  // Multi-billing support
  billing_types: {
    monthly: boolean;
    annual: boolean;
    one_off: boolean;
  };

  // Permission IDs
  permission_ids: string[];
}

interface SubscriptionPlansTabProps {
  subscriptionTypes: SubscriptionType[];
  isLoading: boolean;
  onRefresh: () => void;
}

// Get label for a limit key
export const getLimitLabel = (key: string): string => {
  const predefined = PREDEFINED_LIMITS.find(l => l.key === key);
  if (predefined) return predefined.label;
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Default form state for creating new plan
export const getDefaultFormState = (): PlanFormData => ({
  name: '',
  display_name: '',
  description: '',
  price: '0.00', // Legacy
  monthly_price: '0.00',
  annual_price: '0.00',
  one_off_price: '0.00',
  currency: 'USD',
  billing_cycle_days: 30,
  is_recurring: true,
  trial_period_days: null,
  is_active: true,
  limits: PREDEFINED_LIMITS.map(l => ({
    key: l.key,
    label: l.label,
    value: 0,
    description: l.description,
    isCustom: false,
    isUnlimited: false,
  })),
  billing_types: {
    monthly: false,
    annual: false,
    one_off: false,
  },
  permission_ids: [],
});

// Initialize form from existing subscription (using JSONB limits)
export const initFormFromSubscription = (sub: SubscriptionType): PlanFormData => {
  // Get the JSONB limits object
  const limitsObj = sub.limits || {};

  // Start with predefined limits
  const limits: FormLimit[] = PREDEFINED_LIMITS.map(predefined => {
    const value = limitsObj[predefined.key];
    const hasValue = value !== undefined;
    return {
      key: predefined.key,
      label: predefined.label,
      value: hasValue ? (value === -1 ? 0 : value) : 0,
      description: predefined.description,
      isCustom: false,
      isUnlimited: value === -1,
    };
  });

  // Add custom limits (keys not in predefined)
  Object.entries(limitsObj).forEach(([key, value]) => {
    const isPredefined = PREDEFINED_LIMITS.some(p => p.key === key);
    if (!isPredefined) {
      limits.push({
        key,
        label: getLimitLabel(key),
        value: value === -1 ? 0 : value,
        description: undefined,
        isCustom: true,
        isUnlimited: value === -1,
      });
    }
  });

  // Convert price from cents to dollars
  const priceInDollars = (sub.price_cents / 100).toFixed(2);

  // Get pricing tiers (convert from cents to dollars)
  const pricing = sub.pricing || { monthly: 0, annual: 0 };
  const monthlyPrice = (pricing.monthly / 100).toFixed(2);
  const annualPrice = (pricing.annual / 100).toFixed(2);

  // Get pricing_tiers for enhanced billing types
  const pricingTiers = sub.pricing_tiers || {};
  const oneOffPrice = pricingTiers.one_off?.price_cents
    ? (pricingTiers.one_off.price_cents / 100).toFixed(2)
    : '0.00';

  // Get billing types (default to false if not set)
  const billingTypes = sub.billing_types || { monthly: false, annual: false, one_off: false };

  return {
    name: sub.name,
    display_name: sub.display_name,
    description: sub.description || '',
    price: priceInDollars, // Legacy
    monthly_price: monthlyPrice,
    annual_price: annualPrice,
    one_off_price: oneOffPrice,
    currency: sub.currency,
    billing_cycle_days: sub.billing_cycle_days,
    is_recurring: sub.is_recurring,
    trial_period_days: sub.trial_period_days,
    is_active: sub.is_active,
    limits,
    billing_types: billingTypes,
    permission_ids: [], // TODO: Load from backend when permissions are stored
  };
};

// Convert form limits to JSONB object
const formLimitsToJsonb = (formLimits: FormLimit[]): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const limit of formLimits) {
    const value = limit.isUnlimited ? -1 : limit.value;
    // Only include non-zero values (or unlimited which is -1)
    if (value !== 0) {
      result[limit.key] = value;
    }
  }
  return result;
};

export const SubscriptionPlansTab: React.FC<SubscriptionPlansTabProps> = ({
  subscriptionTypes,
  isLoading,
  onRefresh,
}) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(getDefaultFormState());
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const selectedPlan = subscriptionTypes.find(s => s.id === selectedId);

  const handleSelectPlan = async (plan: SubscriptionType) => {
    if (selectedId === plan.id && mode === 'edit') {
      handleBack();
    } else {
      setSelectedId(plan.id);
      setMode('edit');

      // Load permissions from backend
      try {
        const permissions = await billingService.getSubscriptionTypePermissions(plan.id);
        const permissionIds = permissions.map(p => p.id);
        setFormData({
          ...initFormFromSubscription(plan),
          permission_ids: permissionIds,
        });
      } catch (err) {
        console.error('Failed to load permissions:', err);
        setFormData({
          ...initFormFromSubscription(plan),
          permission_ids: [],
        });
      }

      setError(null);
    }
  };

  const handleCreate = () => {
    setSelectedId(null);
    setMode('create');
    setFormData(getDefaultFormState());
    setError(null);
  };

  const handleBack = () => {
    setSelectedId(null);
    setMode('view');
    setError(null);
  };

  const handleFormChange = (newData: Partial<PlanFormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.display_name.trim()) {
        setError('Display name is required');
        setIsSaving(false);
        return;
      }

      if (mode === 'create' && !formData.name.trim()) {
        setError('Internal name is required');
        setIsSaving(false);
        return;
      }

      // Validate internal name format (lowercase and underscores only)
      if (mode === 'create' && !/^[a-z_]+$/.test(formData.name)) {
        setError('Internal name must contain only lowercase letters and underscores');
        setIsSaving(false);
        return;
      }

      // Validate at least one billing type is enabled
      if (
        !formData.billing_types.monthly &&
        !formData.billing_types.annual &&
        !formData.billing_types.one_off
      ) {
        setError('Please select at least one billing type');
        setIsSaving(false);
        return;
      }

      // Convert prices from dollars to cents
      const monthlyPriceCents = Math.round(parseFloat(formData.monthly_price || '0') * 100);
      const annualPriceCents = Math.round(parseFloat(formData.annual_price || '0') * 100);
      const oneOffPriceCents = Math.round(parseFloat(formData.one_off_price || '0') * 100);

      // Build legacy pricing object (for backward compatibility)
      const pricing = {
        monthly: monthlyPriceCents,
        annual: annualPriceCents,
      };

      // Build enhanced pricing_tiers
      const pricingTiers: Record<string, any> = {};
      if (formData.billing_types.monthly) {
        pricingTiers.monthly = {
          enabled: true,
          price_cents: monthlyPriceCents,
          billing_cycle_days: 30,
          trial_period_days: formData.trial_period_days,
        };
      }
      if (formData.billing_types.annual) {
        pricingTiers.annual = {
          enabled: true,
          price_cents: annualPriceCents,
          billing_cycle_days: 365,
          trial_period_days: formData.trial_period_days,
        };
      }
      if (formData.billing_types.one_off) {
        pricingTiers.one_off = {
          enabled: true,
          price_cents: oneOffPriceCents,
        };
      }

      // Legacy price_cents (use monthly if available, otherwise annual, otherwise one-off)
      const priceCents = formData.billing_types.monthly
        ? monthlyPriceCents
        : formData.billing_types.annual
          ? annualPriceCents
          : oneOffPriceCents;

      // Convert form limits to JSONB object
      const limitsJson = formLimitsToJsonb(formData.limits);

      let savedPlanId: string;

      if (mode === 'create') {
        // Create new subscription with enhanced multi-billing support
        const newPlan = await billingService.createSubscriptionType({
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description || undefined,
          price_cents: priceCents,
          currency: formData.currency,
          billing_cycle_days: formData.billing_cycle_days ?? undefined,
          is_recurring: formData.billing_types.monthly || formData.billing_types.annual,
          trial_period_days: formData.trial_period_days,
          is_active: formData.is_active,
          limits: limitsJson,
          pricing, // Legacy
          billing_types: formData.billing_types, // NEW
          pricing_tiers: pricingTiers, // NEW
          // Alternatively send individual prices (UI convenience)
          monthly_price_cents: formData.billing_types.monthly ? monthlyPriceCents : undefined,
          annual_price_cents: formData.billing_types.annual ? annualPriceCents : undefined,
          one_off_price_cents: formData.billing_types.one_off ? oneOffPriceCents : undefined,
        });
        savedPlanId = newPlan.id;
      } else if (mode === 'edit' && selectedId) {
        // Update existing subscription with enhanced multi-billing support
        await billingService.updateSubscriptionType(selectedId, {
          display_name: formData.display_name,
          description: formData.description || undefined,
          price_cents: priceCents,
          currency: formData.currency,
          billing_cycle_days: formData.billing_cycle_days,
          is_recurring: formData.billing_types.monthly || formData.billing_types.annual,
          trial_period_days: formData.trial_period_days,
          is_active: formData.is_active,
          limits: limitsJson,
          pricing, // Legacy
          billing_types: formData.billing_types, // NEW
          pricing_tiers: pricingTiers, // NEW
          // Alternatively send individual prices (UI convenience)
          monthly_price_cents: formData.billing_types.monthly ? monthlyPriceCents : undefined,
          annual_price_cents: formData.billing_types.annual ? annualPriceCents : undefined,
          one_off_price_cents: formData.billing_types.one_off ? oneOffPriceCents : undefined,
        });
        savedPlanId = selectedId;
      } else {
        throw new Error('Invalid save mode');
      }

      // Save permissions separately
      await billingService.updateSubscriptionTypePermissions(savedPlanId, formData.permission_ids);

      handleBack();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await billingService.deleteSubscriptionType(deleteId);
      setDeleteId(null);
      handleBack();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show editor view when creating or editing
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="space-y-6">
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <PlanEditor
          mode={mode}
          plan={selectedPlan}
          formData={formData}
          onChange={handleFormChange}
          onSave={handleSave}
          onCancel={handleBack}
          onDelete={() => selectedId && setDeleteId(selectedId)}
          isSaving={isSaving}
        />

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Subscription Plan"
          message="Are you sure you want to delete this subscription plan? This action cannot be undone and will affect any users currently subscribed to this plan."
          confirmText="Delete"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subscription Plans
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage subscription plans with pricing and resource limits
          </p>
        </div>

        {/* Billing Interval Toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-border rounded-lg">
          <button
            type="button"
            onClick={() => setBillingInterval('monthly')}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${billingInterval === 'monthly'
                ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval('annual')}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${billingInterval === 'annual'
                ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
            `}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subscriptionTypes.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            colorIndex={index}
            billingInterval={billingInterval}
            onClick={() => handleSelectPlan(plan)}
            onDelete={() => setDeleteId(plan.id)}
          />
        ))}

        {/* Create New Plan Card */}
        <PlanCard
          isCreateCard
          onClick={handleCreate}
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Subscription Plan"
        message="Are you sure you want to delete this subscription plan? This action cannot be undone and will affect any users currently subscribed to this plan."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
