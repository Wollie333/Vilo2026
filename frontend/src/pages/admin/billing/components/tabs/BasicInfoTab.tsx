/**
 * BasicInfoTab Component
 *
 * First tab in plan editor - handles basic plan information
 */

import React from 'react';
import { Input } from '@/components/ui';
import type { PlanFormData } from '../SubscriptionPlansTab';

interface BasicInfoTabProps {
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
  isCreate: boolean;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  formData,
  onChange,
  isCreate,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isCreate && (
          <Input
            label="Internal Name"
            value={formData.name}
            onChange={(e) => {
              // Auto-format: lowercase, replace spaces/hyphens with underscores, remove invalid chars
              const formatted = e.target.value
                .toLowerCase()
                .replace(/[\s-]+/g, '_')
                .replace(/[^a-z_]/g, '');
              onChange({ name: formatted });
            }}
            placeholder="e.g., starter_plan"
            helperText="Unique identifier (lowercase, underscores only)"
          />
        )}
        <Input
          label="Display Name"
          value={formData.display_name}
          onChange={(e) => onChange({ display_name: e.target.value })}
          placeholder="e.g., Starter Plan"
        />
      </div>

      <Input
        label="Description"
        value={formData.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Brief description of this plan"
      />

      {/* Status Toggle (Edit mode only) */}
      {!isCreate && (
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Plan Status
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inactive plans are not visible to users
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ is_active: !formData.is_active })}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                border-2 border-transparent transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${formData.is_active ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full
                  bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
