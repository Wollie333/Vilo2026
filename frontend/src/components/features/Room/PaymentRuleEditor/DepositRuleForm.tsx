/**
 * Deposit Rule Form Component
 *
 * Form for configuring deposit + balance payment rules.
 */

import React from 'react';
import { Input, Select } from '@/components/ui';
import { DepositRuleFormProps } from './PaymentRuleEditor.types';
import { AmountType, DueTiming } from '@/types/payment-rules.types';

export const DepositRuleForm: React.FC<DepositRuleFormProps> = ({ rule, onChange, disabled = false }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Deposit Configuration</h4>

      {/* Deposit Amount */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Deposit Type *"
          value={rule.deposit_type}
          onChange={(e) => onChange({ ...rule, deposit_type: e.target.value as AmountType })}
          disabled={disabled}
          options={[
            { value: 'percentage', label: 'Percentage (%)' },
            { value: 'fixed_amount', label: 'Fixed Amount' },
          ]}
        />

        <Input
          label={`Deposit Amount * (${rule.deposit_type === 'percentage' ? '%' : 'ZAR'})`}
          type="number"
          value={rule.deposit_amount}
          onChange={(e) => onChange({ ...rule, deposit_amount: parseFloat(e.target.value) || 0 })}
          min={0}
          max={rule.deposit_type === 'percentage' ? 100 : undefined}
          step={rule.deposit_type === 'percentage' ? 1 : 100}
          disabled={disabled}
          error={rule.deposit_type === 'percentage' && rule.deposit_amount > 100 ? 'Cannot exceed 100%' : undefined}
          fullWidth
        />
      </div>

      {/* Deposit Due */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Deposit Due *"
          value={rule.deposit_due}
          onChange={(e) => onChange({ ...rule, deposit_due: e.target.value as DueTiming })}
          disabled={disabled}
          options={[
            { value: 'at_booking', label: 'At Booking' },
            { value: 'days_before_checkin', label: 'Days Before Check-in' },
            { value: 'days_after_booking', label: 'Days After Booking' },
          ]}
        />

        {(rule.deposit_due === 'days_before_checkin' || rule.deposit_due === 'days_after_booking') && (
          <Input
            label="Number of Days"
            type="number"
            value={rule.deposit_due_days}
            onChange={(e) => onChange({ ...rule, deposit_due_days: parseInt(e.target.value) || 0 })}
            min={0}
            disabled={disabled}
            placeholder="e.g., 7"
            fullWidth
          />
        )}
      </div>

      {/* Balance Due */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Balance Due *"
          value={rule.balance_due}
          onChange={(e) => onChange({ ...rule, balance_due: e.target.value as DueTiming })}
          disabled={disabled}
          options={[
            { value: 'on_checkin', label: 'On Check-in' },
            { value: 'days_before_checkin', label: 'Days Before Check-in' },
            { value: 'days_after_booking', label: 'Days After Booking' },
          ]}
        />

        {(rule.balance_due === 'days_before_checkin' || rule.balance_due === 'days_after_booking') && (
          <Input
            label="Number of Days"
            type="number"
            value={rule.balance_due_days}
            onChange={(e) => onChange({ ...rule, balance_due_days: parseInt(e.target.value) || 0 })}
            min={0}
            disabled={disabled}
            placeholder="e.g., 3"
            fullWidth
          />
        )}
      </div>

      {/* Summary - More compact */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
        <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1.5">Payment Summary</h5>
        <div className="space-y-0.5 text-xs text-blue-800 dark:text-blue-300">
          <p>
            <strong>Deposit:</strong>{' '}
            {rule.deposit_amount}
            {rule.deposit_type === 'percentage' ? '%' : ' ZAR'} due{' '}
            {rule.deposit_due === 'at_booking'
              ? 'at booking'
              : rule.deposit_due === 'days_before_checkin'
                ? `${rule.deposit_due_days} days before check-in`
                : `${rule.deposit_due_days} days after booking`}
          </p>
          <p>
            <strong>Balance:</strong>{' '}
            {rule.deposit_type === 'percentage' ? `${100 - rule.deposit_amount}%` : 'Remaining amount'} due{' '}
            {rule.balance_due === 'on_checkin'
              ? 'on check-in'
              : rule.balance_due === 'days_before_checkin'
                ? `${rule.balance_due_days} days before check-in`
                : `${rule.balance_due_days} days after booking`}
          </p>
        </div>
      </div>
    </div>
  );
};
