/**
 * LimitsTab Component
 *
 * Manages resource limits with "Unlimited" checkbox toggle
 */

import React from 'react';
import { Input, Button, Card, InfoTooltip } from '@/components/ui';
import type { PlanFormData, FormLimit } from '../SubscriptionPlansTab';
import { PREDEFINED_LIMITS } from '../SubscriptionPlansTab';

interface LimitsTabProps {
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
}

export const LimitsTab: React.FC<LimitsTabProps> = ({ formData, onChange }) => {
  const updateLimit = (index: number, updates: Partial<FormLimit>) => {
    const newLimits = [...formData.limits];
    newLimits[index] = { ...newLimits[index], ...updates };
    onChange({ limits: newLimits });
  };

  const toggleUnlimited = (index: number) => {
    const limit = formData.limits[index];
    updateLimit(index, {
      isUnlimited: !limit.isUnlimited,
      value: !limit.isUnlimited ? 0 : limit.value,
    });
  };

  const addCustomLimit = () => {
    const newLimit: FormLimit = {
      key: '',
      label: '',
      value: 0,
      isCustom: true,
      isUnlimited: false,
    };
    onChange({ limits: [...formData.limits, newLimit] });
  };

  const removeCustomLimit = (index: number) => {
    onChange({
      limits: formData.limits.filter((_, i) => i !== index),
    });
  };

  // Separate predefined and custom limits
  const predefinedLimits = formData.limits.filter((l) => !l.isCustom);
  const customLimits = formData.limits.filter((l) => l.isCustom);

  return (
    <div className="space-y-6">
      {/* Standard Limits */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-base font-medium text-gray-900 dark:text-white">
            Standard Resource Limits
          </h3>
        </Card.Header>
        <Card.Body className="space-y-4">
          {predefinedLimits.map((limit, index) => {
            const actualIndex = formData.limits.findIndex((l) => l.key === limit.key);
            return (
              <div
                key={limit.key}
                className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-dark-border last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {limit.label}
                  </label>
                  {limit.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {limit.description}
                    </p>
                  )}
                </div>

                <div className="w-32">
                  <Input
                    type="number"
                    min="0"
                    value={limit.isUnlimited ? '' : limit.value.toString()}
                    onChange={(e) =>
                      updateLimit(actualIndex, { value: parseInt(e.target.value) || 0 })
                    }
                    disabled={limit.isUnlimited}
                    placeholder={limit.isUnlimited ? 'Unlimited' : '0'}
                    className="text-center"
                  />
                </div>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={limit.isUnlimited}
                      onChange={() => toggleUnlimited(actualIndex)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Unlimited</span>
                  </label>
                </div>
              </div>
            );
          })}
        </Card.Body>
      </Card>

      {/* Custom Limits */}
      <Card variant="bordered">
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Custom Limits
              </h3>
              <InfoTooltip
                content="Custom limits allow you to define additional resource restrictions beyond the standard limits. For example, you could add 'max_integrations', 'max_api_calls_per_day', or any other limit specific to your business needs. Each custom limit needs a unique key (lowercase with underscores) and a display label."
                position="right"
              />
            </div>
            <Button variant="outline" size="sm" onClick={addCustomLimit}>
              + Add Custom Limit
            </Button>
          </div>
        </Card.Header>
        {customLimits.length > 0 && (
          <Card.Body className="space-y-4">
            {customLimits.map((limit, customIndex) => {
              const actualIndex = formData.limits.findIndex((l) => l === limit);
              return (
                <div
                  key={`custom-${customIndex}`}
                  className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-dark-border last:border-0 last:pb-0"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      label="Limit Key"
                      value={limit.key}
                      onChange={(e) => {
                        const formatted = e.target.value
                          .toLowerCase()
                          .replace(/[\s-]+/g, '_')
                          .replace(/[^a-z_]/g, '');
                        updateLimit(actualIndex, { key: formatted });
                      }}
                      placeholder="e.g., max_integrations"
                      helperText="Unique identifier"
                    />
                    <Input
                      label="Display Label"
                      value={limit.label}
                      onChange={(e) => updateLimit(actualIndex, { label: e.target.value })}
                      placeholder="e.g., Max Integrations"
                    />
                  </div>

                  <div className="w-32 pt-6">
                    <Input
                      type="number"
                      min="0"
                      value={limit.isUnlimited ? '' : limit.value.toString()}
                      onChange={(e) =>
                        updateLimit(actualIndex, { value: parseInt(e.target.value) || 0 })
                      }
                      disabled={limit.isUnlimited}
                      placeholder={limit.isUnlimited ? 'Unlimited' : '0'}
                      className="text-center"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={limit.isUnlimited}
                        onChange={() => toggleUnlimited(actualIndex)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Unlimited
                      </span>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomLimit(actualIndex)}
                      className="text-error"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card.Body>
        )}
        {customLimits.length === 0 && (
          <Card.Body>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No custom limits defined. Click "Add Custom Limit" to create one.
            </p>
          </Card.Body>
        )}
      </Card>

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <span className="font-medium">Tip:</span> Check "Unlimited" to remove the limit entirely. Unchecked limits with value 0 will restrict access.
        </p>
      </div>
    </div>
  );
};
