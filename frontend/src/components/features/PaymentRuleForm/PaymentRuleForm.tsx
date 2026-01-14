/**
 * PaymentRuleForm Component
 *
 * Full-page form for creating/editing payment rules at property level.
 * Extracted from PaymentRuleEditorSingle and adapted for centralized management.
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select, Card, DateInput } from '@/components/ui';
import { DepositRuleForm } from '../Room/PaymentRuleEditor/DepositRuleForm';
import { ScheduleRuleForm } from '../Room/PaymentRuleEditor/ScheduleRuleForm';
import {
  PaymentRuleFormData,
  PaymentRuleType,
  PAYMENT_RULE_TYPE_LABELS,
  createEmptyFormData,
} from '@/types/payment-rules.types';
import { PaymentRuleFormProps } from './PaymentRuleForm.types';

// Convert PaymentRule to PaymentRuleFormData
const convertToFormData = (rule: any): PaymentRuleFormData => {
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

export const PaymentRuleForm: React.FC<PaymentRuleFormProps> = ({
  mode,
  paymentRule,
  propertyId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PaymentRuleFormData>(() =>
    mode === 'edit' && paymentRule ? convertToFormData(paymentRule) : createEmptyFormData()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when payment rule changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && paymentRule) {
      setFormData(convertToFormData(paymentRule));
      setHasChanges(false);
    }
  }, [mode, paymentRule]);

  const handleRuleChange = (updates: Partial<PaymentRuleFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSubmit(formData);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = (): boolean => {
    if (!formData.rule_name.trim()) return false;

    if (formData.rule_type === 'deposit') {
      return formData.deposit_amount > 0;
    }

    if (formData.rule_type === 'payment_schedule') {
      return formData.schedule_config.length > 0;
    }

    return true;
  };

  const ruleTypeOptions = Object.entries(PAYMENT_RULE_TYPE_LABELS).map(([value, label]) => ({
    value: value as PaymentRuleType,
    label,
  }));

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure deposit requirements and payment schedules
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <Input
              label="Rule Name"
              name="rule_name"
              value={formData.rule_name}
              onChange={(e) => handleRuleChange({ rule_name: e.target.value })}
              placeholder="e.g., Standard Deposit, Payment Plan"
              required
              error={!formData.rule_name.trim() ? 'Rule name is required' : undefined}
            />

            <Textarea
              label="Description (Optional)"
              name="description"
              value={formData.description}
              onChange={(e) => handleRuleChange({ description: e.target.value })}
              placeholder="Optional description of this payment rule"
              rows={2}
            />

            <Select
              label="Rule Type"
              name="rule_type"
              value={formData.rule_type}
              onChange={(e) =>
                handleRuleChange({ rule_type: e.target.value as PaymentRuleType })
              }
              options={ruleTypeOptions}
              required
            />
          </div>
        </Card.Body>
      </Card>

      {/* Rule Configuration */}
      {formData.rule_type === 'deposit' && (
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Deposit Configuration</h2>
          </Card.Header>
          <Card.Body>
            <DepositRuleForm rule={formData} onChange={handleRuleChange} />
          </Card.Body>
        </Card>
      )}

      {formData.rule_type === 'payment_schedule' && (
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Payment Schedule Configuration</h2>
          </Card.Header>
          <Card.Body>
            <ScheduleRuleForm rule={formData} onChange={handleRuleChange} />
          </Card.Body>
        </Card>
      )}

      {formData.rule_type === 'flexible' && (
        <Card>
          <Card.Body>
            <div className="p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Flexible payment rules allow guests to pay at their own pace without specific
                deposit or installment requirements.
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold">Settings</h2>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleRuleChange({ is_active: e.target.checked })}
                className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-dark-bg dark:border-dark-border"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-gray-900 dark:text-white"
              >
                Rule is active
              </label>
            </div>

            {/* Seasonal Dates */}
            <div className="border-t border-gray-200 dark:border-dark-border pt-4">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="applies_to_dates"
                  checked={formData.applies_to_dates}
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

              {formData.applies_to_dates && (
                <div className="grid grid-cols-2 gap-4">
                  <DateInput
                    label="Start Date"
                    value={formData.start_date}
                    onChange={(value) => handleRuleChange({ start_date: value })}
                    placeholder="Select start date"
                  />
                  <DateInput
                    label="End Date"
                    value={formData.end_date}
                    onChange={(value) => handleRuleChange({ end_date: value })}
                    placeholder="Select end date"
                    minDate={formData.start_date ? new Date(formData.start_date) : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid() || !hasChanges || isSaving}
          isLoading={isSaving}
        >
          {mode === 'create' ? 'Create Payment Rule' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
