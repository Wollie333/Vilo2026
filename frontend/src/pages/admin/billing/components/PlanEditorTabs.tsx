/**
 * PlanEditorTabs Component
 *
 * Tabbed interface for subscription plan editor
 * Organizes form into: Basic Info | Pricing | Limits | Permissions
 */

import React, { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';
import type { SubscriptionType } from '@/types/billing.types';
import type { PlanFormData } from './SubscriptionPlansTab';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { PricingTab } from './tabs/PricingTab';
import { LimitsTab } from './tabs/LimitsTab';
import { PermissionsTab } from './tabs/PermissionsTab';

// Icons
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

interface PlanEditorTabsProps {
  mode: 'create' | 'edit';
  plan?: SubscriptionType;
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving: boolean;
}

export const PlanEditorTabs: React.FC<PlanEditorTabsProps> = ({
  mode,
  plan,
  formData,
  onChange,
  onSave,
  onCancel,
  onDelete,
  isSaving,
}) => {
  const isCreate = mode === 'create';
  const [activeTab, setActiveTab] = useState('basic');

  // Validation states for tab badges
  const hasBasicErrors = isCreate
    ? !formData.name || !formData.display_name
    : !formData.display_name;
  const hasPricingErrors =
    !formData.billing_types.monthly &&
    !formData.billing_types.annual &&
    !formData.billing_types.one_off;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <BackIcon />
            <span className="ml-1">Back to Plans</span>
          </Button>
          <div className="h-6 w-px bg-gray-200 dark:bg-dark-border" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isCreate ? 'Create New Plan' : `Edit ${plan?.display_name}`}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isCreate
                ? 'Set up a new subscription plan with pricing and permissions'
                : 'Update plan details and permissions'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isCreate && formData.is_active !== undefined && (
            <Badge variant={formData.is_active ? 'success' : 'default'} size="lg">
              {formData.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )}
          <Button variant="primary" onClick={onSave} isLoading={isSaving}>
            {isCreate ? 'Create Plan' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">
            <div className="flex items-center gap-2">
              <span>Basic Info</span>
              {hasBasicErrors && (
                <span className="w-2 h-2 bg-error rounded-full" title="Required fields missing" />
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <div className="flex items-center gap-2">
              <span>Pricing</span>
              {hasPricingErrors && (
                <span
                  className="w-2 h-2 bg-error rounded-full"
                  title="At least one billing type required"
                />
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="permissions">
            <div className="flex items-center gap-2">
              <span>Permissions</span>
              {formData.permission_ids.length > 0 && (
                <Badge variant="info" size="sm">
                  {formData.permission_ids.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <BasicInfoTab formData={formData} onChange={onChange} isCreate={isCreate} />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingTab formData={formData} onChange={onChange} />
        </TabsContent>

        <TabsContent value="limits" className="mt-6">
          <LimitsTab formData={formData} onChange={onChange} />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsTab formData={formData} onChange={onChange} />
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        <div>
          {!isCreate && onDelete && (
            <Button
              variant="outline"
              className="text-error border-error hover:bg-error/10"
              onClick={onDelete}
            >
              <TrashIcon />
              <span className="ml-2">Delete Plan</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave} isLoading={isSaving}>
            {isCreate ? 'Create Plan' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};
