/**
 * PlanEditor Component
 *
 * Wrapper for PlanEditorTabs - provides tabbed interface for subscription plan creation/editing.
 * Tabs: Basic Info | Pricing | Limits | Permissions
 */

import React from 'react';
import type { SubscriptionType } from '@/types/billing.types';
import type { PlanFormData } from './SubscriptionPlansTab';
import { PlanEditorTabs } from './PlanEditorTabs';

interface PlanEditorProps {
  mode: 'create' | 'edit';
  plan?: SubscriptionType;
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving: boolean;
}

export const PlanEditor: React.FC<PlanEditorProps> = (props) => {
  return <PlanEditorTabs {...props} />;
};
