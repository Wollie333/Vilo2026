/**
 * PaymentRuleEditorSingle Component
 *
 * Simplified editor for creating/editing a single payment rule.
 * Used in modal context for inline rule management.
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { DepositRuleForm } from './DepositRuleForm';
import { ScheduleRuleForm } from './ScheduleRuleForm';
import {
  PaymentRuleFormData,
  PaymentRuleType,
  PaymentRule,
  PAYMENT_RULE_TYPE_LABELS,
  createEmptyFormData,
} from '@/types/payment-rules.types';

export interface PaymentRuleEditorSingleProps {
  roomId: string;
  initialData?: PaymentRule | null;
  onSave: (rule: PaymentRuleFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

// Convert PaymentRule to PaymentRuleFormData
const convertToFormData = (rule: PaymentRule): PaymentRuleFormData => {
  return {
    id: rule.id,
    rule_name: rule.rule_name,
    description: rule.description || '',
    rule_type: rule.rule_type,
    deposit_type: rule.deposit_type || 'percentage',
    deposit_amount: rule.deposit_amount || 0,
    deposit_due: rule.deposit_due || 'at_booking',
    deposit_due_days: rule.deposit_due_days || 0,
    balance_due: rule.balance_due || 'on_checkin',
    balance_due_days: rule.balance_due_days || 0,
    schedule_config: rule.schedule_config || [],
    allowed_payment_methods: rule.allowed_payment_methods || [],
    is_active: rule.is_active,
    applies_to_dates: rule.applies_to_dates,
    start_date: rule.start_date || '',
    end_date: rule.end_date || '',
    priority: rule.priority,
  };
};

export const PaymentRuleEditorSingle: React.FC<PaymentRuleEditorSingleProps> = ({
  initialData,
  onSave,
  onCancel,
  saving = false,
}) => {
  const [rule, setRule] = useState<PaymentRuleFormData>(
    initialData ? convertToFormData(initialData) : createEmptyFormData()
  );

  // Update rule when initial data changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setRule(convertToFormData(initialData));
    }
  }, [initialData]);

  const handleRuleChange = (updates: Partial<PaymentRuleFormData>) => {
    setRule((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    onSave(rule);
  };

  const isValid = (): boolean => {
    if (!rule.rule_name.trim()) return false;

    if (rule.rule_type === 'deposit') {
      return rule.deposit_amount > 0;
    }

    if (rule.rule_type === 'payment_schedule') {
      return rule.schedule_config.length > 0;
    }

    return true;
  };

  const ruleTypeOptions = Object.entries(PAYMENT_RULE_TYPE_LABELS).map(([value, label]) => ({
    value: value as PaymentRuleType,
    label,
  }));

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {initialData ? 'Edit Payment Rule' : 'Create Payment Rule'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure deposit requirements and payment schedules for this room
        </p>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <Input
          label="Rule Name"
          name="rule_name"
          value={rule.rule_name}
          onChange={(e) => handleRuleChange({ rule_name: e.target.value })}
          placeholder="e.g., Standard Deposit, Payment Plan"
          required
          error={!rule.rule_name.trim() ? 'Rule name is required' : undefined}
        />

        <Textarea
          label="Description (Optional)"
          name="description"
          value={rule.description}
          onChange={(e) => handleRuleChange({ description: e.target.value })}
          placeholder="Optional description of this payment rule"
          rows={2}
        />

        <Select
          label="Rule Type"
          name="rule_type"
          value={rule.rule_type}
          onChange={(e) =>
            handleRuleChange({ rule_type: e.target.value as PaymentRuleType })
          }
          options={ruleTypeOptions}
          required
        />
      </div>

      {/* Conditional Forms Based on Rule Type */}
      {rule.rule_type === 'deposit' && (
        <DepositRuleForm data={rule} onChange={handleRuleChange} />
      )}

      {rule.rule_type === 'payment_schedule' && (
        <ScheduleRuleForm data={rule} onChange={handleRuleChange} />
      )}

      {rule.rule_type === 'flexible' && (
        <div className="p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Flexible payment rules allow guests to pay at their own pace without specific deposit or
            installment requirements.
          </p>
        </div>
      )}

      {/* Active Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={rule.is_active}
          onChange={(e) => handleRuleChange({ is_active: e.target.checked })}
          className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-dark-bg dark:border-dark-border"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-900 dark:text-white">
          Rule is active
        </label>
      </div>

      {/* Seasonal Dates (Optional) */}
      <div className="border-t border-gray-200 dark:border-dark-border pt-4">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="applies_to_dates"
            checked={rule.applies_to_dates}
            onChange={(e) => handleRuleChange({ applies_to_dates: e.target.checked })}
            className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-dark-bg dark:border-dark-border"
          />
          <label
            htmlFor="applies_to_dates"
            className="text-sm font-medium text-gray-900 dark:text-white"
          >
            Apply to specific date range (seasonal)
          </label>
        </div>

        {rule.applies_to_dates && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              name="start_date"
              value={rule.start_date}
              onChange={(e) => handleRuleChange({ start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              name="end_date"
              value={rule.end_date}
              onChange={(e) => handleRuleChange({ end_date: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!isValid() || saving}
          isLoading={saving}
        >
          {initialData ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </div>
  );
};
