/**
 * CreatePlanPage
 *
 * Standalone page for creating new subscription plans.
 * Uses PlanEditor component with create mode.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Alert } from '@/components/ui';
import { billingService } from '@/services';
import { PlanEditor } from './components/PlanEditor';
import { getDefaultFormState, type PlanFormData } from './components/SubscriptionPlansTab';

// Convert form limits to JSONB object (imported from SubscriptionPlansTab)
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

export const CreatePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PlanFormData>(getDefaultFormState());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormChange = (newData: Partial<PlanFormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleCancel = () => {
    navigate('/admin/billing#subscription-plans');
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

      if (!formData.name.trim()) {
        setError('Internal name is required');
        setIsSaving(false);
        return;
      }

      // Validate internal name format (lowercase and underscores only)
      if (!/^[a-z_]+$/.test(formData.name)) {
        setError('Internal name must contain only lowercase letters and underscores');
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

      const createData = {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || undefined,
        currency: formData.currency,
        trial_period_days: formData.trial_period_days,
        is_active: formData.is_active,
        limits: limitsJsonb,

        // Billing types (which types are enabled)
        billing_types: formData.billing_types,

        // Multi-billing prices
        monthly_price_cents: formData.billing_types.monthly ? Math.round(parseFloat(formData.monthly_price) * 100) : undefined,
        annual_price_cents: formData.billing_types.annual ? Math.round(parseFloat(formData.annual_price) * 100) : undefined,
        one_off_price_cents: formData.billing_types.one_off ? Math.round(parseFloat(formData.one_off_price) * 100) : undefined,

        // CMS fields
        slug: formData.slug,
        custom_headline: formData.custom_headline || undefined,
        custom_description: formData.custom_description || undefined,
        custom_features: formData.custom_features.length > 0 ? formData.custom_features : undefined,
        custom_cta_text: formData.custom_cta_text || undefined,
        checkout_badge: formData.checkout_badge || undefined,
        checkout_accent_color: formData.checkout_accent_color || undefined,
      };

      console.log('🎯 [FRONTEND] Creating plan with data:', JSON.stringify(createData, null, 2));

      // Create the subscription type
      const newPlan = await billingService.createSubscriptionType(createData);

      console.log('✅ [FRONTEND] Plan created successfully:', JSON.stringify(newPlan, null, 2));

      // Try to assign permissions if any selected, but don't fail if it errors
      if (formData.permission_ids.length > 0) {
        try {
          await billingService.updateSubscriptionTypePermissions(newPlan.id, formData.permission_ids);
        } catch (permErr) {
          console.error('Failed to assign permissions (non-critical):', permErr);
          // Continue anyway - plan was created successfully
        }
      }

      // Navigate back to billing settings
      navigate('/admin/billing#subscription-plans');
    } catch (err) {
      console.error('Failed to create plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subscription plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthenticatedLayout
      title="Create Subscription Plan"
      subtitle="Set up a new pricing tier for your platform"
    >
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      <PlanEditor
        mode="create"
        formData={formData}
        onChange={handleFormChange}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    </AuthenticatedLayout>
  );
};

export default CreatePlanPage;
