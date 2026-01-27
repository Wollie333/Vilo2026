/**
 * EditPlanPage
 *
 * Standalone page for editing existing subscription plans.
 * Uses PlanEditor component with edit mode.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Alert, Spinner } from '@/components/ui';
import { billingService } from '@/services';
import { PlanEditor } from './components/PlanEditor';
import { initFormFromSubscription, type PlanFormData } from './components/SubscriptionPlansTab';
import type { SubscriptionType } from '@/types/billing.types';

// Convert form limits to JSONB object
const convertFormLimitsToJsonb = (formLimits: PlanFormData['limits']): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const limit of formLimits) {
    const value = limit.isUnlimited ? -1 : limit.value;
    if (value !== 0) {
      result[limit.key] = value;
    }
  }
  return result;
};

export const EditPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<SubscriptionType | null>(null);
  const [formData, setFormData] = useState<PlanFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    if (!planId) {
      setError('Plan ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load plan data
      const planData = await billingService.getSubscriptionType(planId);
      setPlan(planData);

      // Try to load permissions, but don't fail if it errors
      let permissionIds: string[] = [];
      try {
        const permissions = await billingService.getSubscriptionTypePermissions(planId);
        permissionIds = permissions.map(p => p.id);
      } catch (permErr) {
        console.error('Failed to load permissions (non-critical):', permErr);
        // Continue with empty permissions array
      }

      // Initialize form data
      const initialFormData = {
        ...initFormFromSubscription(planData),
        permission_ids: permissionIds,
      };
      setFormData(initialFormData);
    } catch (err) {
      console.error('Failed to load plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (newData: Partial<PlanFormData>) => {
    console.log('📝 [EditPlanPage] handleFormChange called');
    console.log('   - New data received:', newData);
    console.log('   - Current formData before update:', formData);

    if (formData) {
      setFormData(prev => {
        const updated = { ...prev!, ...newData };
        console.log('   - Updated formData:', updated);
        console.log('   - Specific CMS fields after update:', {
          slug: updated.slug,
          custom_headline: updated.custom_headline,
          custom_description: updated.custom_description,
          checkout_badge: updated.checkout_badge,
        });
        return updated;
      });
    } else {
      console.warn('   ⚠️ formData is null, cannot update!');
    }
  };

  const handleCancel = () => {
    navigate('/admin/billing#subscription-plans');
  };

  const handleDelete = async () => {
    if (!planId || !window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      await billingService.deleteSubscriptionType(planId);
      navigate('/admin/billing#subscription-plans');
    } catch (err) {
      console.error('Failed to delete plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete subscription plan');
    }
  };

  const handleSave = async () => {
    if (!planId || !formData) return;

    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.display_name.trim()) {
        setError('Display name is required');
        setIsSaving(false);
        return;
      }

      // Validate slug format
      if (!formData.slug.trim()) {
        setError('URL slug is required');
        setIsSaving(false);
        return;
      }

      if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        setError('URL slug must contain only lowercase letters, numbers, and hyphens');
        setIsSaving(false);
        return;
      }

      // Validate at least one billing type is enabled
      if (!formData.billing_types.monthly && !formData.billing_types.annual && !formData.billing_types.one_off) {
        setError('At least one billing type must be enabled');
        setIsSaving(false);
        return;
      }

      // Convert form data to API format
      const limitsJsonb = convertFormLimitsToJsonb(formData.limits);

      // Determine primary price (for backward compatibility)
      const primaryPrice = formData.billing_types.monthly
        ? parseFloat(formData.monthly_price) * 100
        : formData.billing_types.annual
        ? parseFloat(formData.annual_price) * 100
        : parseFloat(formData.one_off_price) * 100;

      const updateData = {
        display_name: formData.display_name,
        description: formData.description || undefined,
        currency: formData.currency,
        trial_period_days: formData.trial_period_days,
        is_active: formData.is_active,
        limits: limitsJsonb,

        // CRITICAL: billing_types field (which billing options are enabled)
        billing_types: formData.billing_types,

        // Multi-billing prices
        monthly_price_cents: formData.billing_types.monthly ? Math.round(parseFloat(formData.monthly_price) * 100) : undefined,
        annual_price_cents: formData.billing_types.annual ? Math.round(parseFloat(formData.annual_price) * 100) : undefined,
        one_off_price_cents: formData.billing_types.one_off ? Math.round(parseFloat(formData.one_off_price) * 100) : undefined,

        // CMS fields - FIXED: send null instead of undefined so they're included in JSON
        slug: formData.slug,
        custom_headline: formData.custom_headline?.trim() || null,
        custom_description: formData.custom_description?.trim() || null,
        custom_features: formData.custom_features.length > 0 ? formData.custom_features : [],
        custom_cta_text: formData.custom_cta_text?.trim() || null,
        checkout_badge: formData.checkout_badge?.trim() || null,
        checkout_accent_color: formData.checkout_accent_color || null,
      };

      console.log('💾 [EditPlanPage] Current formData before save:', {
        slug: formData.slug,
        custom_headline: formData.custom_headline,
        custom_description: formData.custom_description,
        checkout_badge: formData.checkout_badge,
        custom_features: formData.custom_features,
      });
      console.log('💾 [EditPlanPage] Saving plan with data:', JSON.stringify(updateData, null, 2));

      // Update the subscription type
      await billingService.updateSubscriptionType(planId, updateData);

      // Try to update permissions, but don't fail if it errors
      try {
        await billingService.updateSubscriptionTypePermissions(planId, formData.permission_ids);
      } catch (permErr) {
        console.error('Failed to update permissions (non-critical):', permErr);
        // Continue anyway - plan was saved successfully
      }

      // Navigate back to billing settings
      navigate('/admin/billing#subscription-plans');
    } catch (err) {
      console.error('Failed to update plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subscription plan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout title="Edit Subscription Plan">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error && !formData) {
    return (
      <AuthenticatedLayout title="Edit Subscription Plan">
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
        <button
          onClick={handleCancel}
          className="text-primary hover:text-primary/80"
        >
          ← Back to Billing Settings
        </button>
      </AuthenticatedLayout>
    );
  }

  if (!plan || !formData) {
    return (
      <AuthenticatedLayout title="Edit Subscription Plan">
        <Alert variant="error" className="mb-6">
          Plan not found
        </Alert>
        <button
          onClick={handleCancel}
          className="text-primary hover:text-primary/80"
        >
          ← Back to Billing Settings
        </button>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title={`Edit: ${plan.display_name}`}
      subtitle="Update subscription plan settings"
    >
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      <PlanEditor
        mode="edit"
        plan={plan}
        formData={formData}
        onChange={handleFormChange}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
        isSaving={isSaving}
      />
    </AuthenticatedLayout>
  );
};

export default EditPlanPage;
