/**
 * PaymentRuleEditorInline Component
 *
 * Inline editor for payment rules that matches the pattern of SeasonalRateEditor and PromotionEditor.
 * Shows an inline form instead of a modal popup.
 */

import React, { useState } from 'react';
import { Button, Input, Select, DateInput } from '@/components/ui';
import { DepositRuleForm } from '@/components/features/Room/PaymentRuleEditor/DepositRuleForm';
import { ScheduleRuleForm } from '@/components/features/Room/PaymentRuleEditor/ScheduleRuleForm';
import type { PaymentRuleFormData, PaymentRuleType } from '@/types/payment-rules.types';

interface PaymentRuleEditorInlineProps {
  rule?: PaymentRuleFormData;
  onSave: (rule: PaymentRuleFormData) => void;
  onCancel: () => void;
}

const createDefaultRule = (): PaymentRuleFormData => ({
  rule_name: '',
  description: '',
  rule_type: 'flexible',
  deposit_type: 'percentage',
  deposit_amount: 0,
  deposit_due: 'at_booking',
  deposit_due_days: 0,
  balance_due: 'on_checkin',
  balance_due_days: 0,
  schedule_config: [],
  allowed_payment_methods: [],
  is_active: true,
  applies_to_dates: false,
  start_date: '',
  end_date: '',
  priority: 0,
});

export const PaymentRuleEditorInline: React.FC<PaymentRuleEditorInlineProps> = ({
  rule,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PaymentRuleFormData>(
    rule || createDefaultRule()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isValid = (): boolean => {
    if (!formData.rule_name.trim()) return false;
    if (formData.rule_type === 'deposit' && formData.deposit_amount <= 0) return false;
    if (formData.rule_type === 'payment_schedule' && formData.schedule_config.length === 0) return false;
    return true;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg">
      <h4 className="font-medium text-gray-900 dark:text-white">
        {rule ? 'Edit Payment Rule' : 'Add Payment Rule'}
      </h4>

      {/* Basic Fields */}
      <div className="space-y-4">
        <Input
          label="Rule Name *"
          value={formData.rule_name}
          onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
          placeholder="e.g., Standard Deposit, 3-Part Payment Plan"
          required
          fullWidth
        />

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Explain this rule to help manage your bookings"
          fullWidth
        />

        <Select
          label="Rule Type *"
          value={formData.rule_type}
          onChange={(e) => setFormData({ ...formData, rule_type: e.target.value as PaymentRuleType })}
          options={[
            { value: 'flexible', label: 'Flexible Payment (no requirements)' },
            { value: 'deposit', label: 'Deposit + Balance' },
            { value: 'payment_schedule', label: 'Payment Schedule (multiple installments)' },
          ]}
        />

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active_inline"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded"
          />
          <label htmlFor="is_active_inline" className="text-sm text-gray-700 dark:text-gray-300">
            Active (apply this rule to new bookings)
          </label>
        </div>
      </div>

      {/* Rule Type Specific Fields */}
      {formData.rule_type === 'deposit' && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <DepositRuleForm rule={formData} onChange={setFormData} />
        </div>
      )}

      {formData.rule_type === 'payment_schedule' && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <ScheduleRuleForm rule={formData} onChange={setFormData} />
        </div>
      )}

      {/* Seasonal Dates (Optional) */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="applies_to_dates_inline"
            checked={formData.applies_to_dates}
            onChange={(e) => setFormData({ ...formData, applies_to_dates: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded"
          />
          <label htmlFor="applies_to_dates_inline" className="text-sm text-gray-700 dark:text-gray-300">
            Apply only to specific dates (seasonal rule)
          </label>
        </div>

        {formData.applies_to_dates && (
          <div className="grid grid-cols-2 gap-4">
            <DateInput
              label="Start Date"
              value={formData.start_date}
              onChange={(value) => setFormData({ ...formData, start_date: value })}
              placeholder="Select start date"
            />
            <DateInput
              label="End Date"
              value={formData.end_date}
              onChange={(value) => setFormData({ ...formData, end_date: value })}
              placeholder="Select end date"
              minDate={formData.start_date ? new Date(formData.start_date) : undefined}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid()}>
          {rule ? 'Save Changes' : 'Add Rule'}
        </Button>
      </div>
    </form>
  );
};
