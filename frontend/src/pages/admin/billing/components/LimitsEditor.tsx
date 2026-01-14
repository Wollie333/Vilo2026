/**
 * LimitsEditor Component
 *
 * Table-based editor for managing subscription resource limits.
 * Provides a clean interface for setting limits with unlimited toggle.
 */

import React, { useState } from 'react';
import { Input, Button, Card } from '@/components/ui';
import type { FormLimit } from './SubscriptionPlansTab';
import { getLimitLabel } from './SubscriptionPlansTab';

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

const InfinityIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.781 0-4.781 8 0 8 5.606 0 7.644-8 12.74-8z"
    />
  </svg>
);

interface LimitsEditorProps {
  limits: FormLimit[];
  onChange: (limits: FormLimit[]) => void;
}

export const LimitsEditor: React.FC<LimitsEditorProps> = ({
  limits,
  onChange,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLimitKey, setNewLimitKey] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const handleLimitChange = (index: number, field: keyof FormLimit, value: number | boolean) => {
    const newLimits = [...limits];
    newLimits[index] = { ...newLimits[index], [field]: value };

    // If setting unlimited, the value doesn't matter (stored as -1 in DB)
    if (field === 'isUnlimited' && value === true) {
      newLimits[index].value = 0;
    }

    onChange(newLimits);
  };

  const handleAddCustomLimit = () => {
    if (!newLimitKey.trim()) {
      setAddError('Please enter a limit key');
      return;
    }

    const key = newLimitKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    if (!key) {
      setAddError('Invalid key format');
      return;
    }

    // Check if key already exists
    if (limits.some(l => l.key === key)) {
      setAddError('A limit with this key already exists');
      return;
    }

    const newLimit: FormLimit = {
      key,
      label: getLimitLabel(key),
      value: 0,
      description: '',
      isCustom: true,
      isUnlimited: false,
    };

    onChange([...limits, newLimit]);
    setNewLimitKey('');
    setShowAddForm(false);
    setAddError(null);
  };

  const handleRemoveLimit = (index: number) => {
    const limit = limits[index];
    if (!limit.isCustom) return; // Can't remove predefined limits

    const newLimits = limits.filter((_, i) => i !== index);
    onChange(newLimits);
  };

  return (
    <Card variant="bordered">
      <Card.Header className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white">
            Resource Limits
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Define usage limits for this plan. Toggle unlimited for no restrictions.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <PlusIcon />
          <span className="ml-1.5">Add Custom</span>
        </Button>
      </Card.Header>

      <Card.Body className="p-0">
        {/* Add Custom Limit Form */}
        {showAddForm && (
          <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Custom Limit Key"
                  value={newLimitKey}
                  onChange={(e) => {
                    setNewLimitKey(e.target.value);
                    setAddError(null);
                  }}
                  placeholder="e.g., api_calls_per_day"
                  error={addError ?? undefined}
                />
              </div>
              <Button size="md" variant="primary" onClick={handleAddCustomLimit}>
                Add
              </Button>
              <Button
                size="md"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewLimitKey('');
                  setAddError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Limits Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Limit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                  Value
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                  Unlimited
                </th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {limits.map((limit, index) => (
                <tr
                  key={limit.key}
                  className="hover:bg-gray-50 dark:hover:bg-dark-bg/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {limit.label}
                      </span>
                      {limit.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {limit.description}
                        </span>
                      )}
                      {limit.isCustom && (
                        <span className="text-xs text-primary mt-0.5">Custom limit</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={limit.isUnlimited ? '' : String(limit.value)}
                      onChange={(e) =>
                        handleLimitChange(index, 'value', parseInt(e.target.value) || 0)
                      }
                      disabled={limit.isUnlimited}
                      placeholder={limit.isUnlimited ? '∞' : '0'}
                      fullWidth
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleLimitChange(index, 'isUnlimited', !limit.isUnlimited)}
                      className={`
                        inline-flex items-center justify-center w-10 h-10 rounded-lg
                        transition-colors border-2
                        ${
                          limit.isUnlimited
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                      title={limit.isUnlimited ? 'Click to set a limit' : 'Click to make unlimited'}
                    >
                      <InfinityIcon />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {limit.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLimit(index)}
                        className="p-2 text-gray-400 hover:text-error rounded-lg hover:bg-error/10 transition-colors"
                        title="Remove limit"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {limits.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No limits configured. Click "Add Custom" to add a limit.
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
