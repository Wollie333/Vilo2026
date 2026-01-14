/**
 * PricingTab Component
 *
 * Handles multi-billing type pricing with checkboxes
 * User can enable monthly, annual, and/or one-off pricing
 */

import React from 'react';
import { Input, Select, Card, Badge } from '@/components/ui';
import type { PlanFormData } from '../SubscriptionPlansTab';

interface PricingTabProps {
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
}

// Currency options
const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
];

export const PricingTab: React.FC<PricingTabProps> = ({ formData, onChange }) => {
  // Currency symbol for display
  const currencySymbol =
    formData.currency === 'USD'
      ? '$'
      : formData.currency === 'EUR'
        ? '€'
        : formData.currency === 'GBP'
          ? '£'
          : formData.currency === 'ZAR'
            ? 'R'
            : '$';

  const updateBillingType = (type: keyof typeof formData.billing_types, enabled: boolean) => {
    onChange({
      billing_types: { ...formData.billing_types, [type]: enabled },
    });
  };

  // Calculate savings for annual pricing
  const calculateSavings = () => {
    const monthly = parseFloat(formData.monthly_price || '0');
    const annual = parseFloat(formData.annual_price || '0');
    const monthlyAnnualized = monthly * 12;
    const savings = monthlyAnnualized - annual;
    const savingsPercent = monthlyAnnualized > 0 ? Math.round((savings / monthlyAnnualized) * 100) : 0;
    return { savings, savingsPercent };
  };

  const { savings, savingsPercent } = calculateSavings();

  return (
    <div className="space-y-6">
      {/* Currency Selector */}
      <div className="max-w-xs">
        <Select
          label="Currency"
          value={formData.currency}
          onChange={(e) => onChange({ currency: e.target.value })}
          options={currencyOptions}
        />
      </div>

      {/* Billing Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          Select Billing Types
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enable one or more billing options for this plan
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.billing_types.monthly}
              onChange={(e) => updateBillingType('monthly', e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Monthly Subscription</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.billing_types.annual}
              onChange={(e) => updateBillingType('annual', e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Annual Subscription</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.billing_types.one_off}
              onChange={(e) => updateBillingType('one_off', e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">One-off Payment</span>
          </label>
        </div>
      </div>

      {/* Conditional Price Inputs */}
      <div className="space-y-4">
        {/* Monthly Pricing */}
        {formData.billing_types.monthly && (
          <Card variant="bordered">
            <Card.Header>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-medium text-gray-900 dark:text-white">
                  Monthly Billing
                </h4>
                <Badge variant="info" size="sm">
                  Recurring
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10 pointer-events-none">
                  {currencySymbol}
                </span>
                <Input
                  label="Monthly Price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_price}
                  onChange={(e) => onChange({ monthly_price: e.target.value })}
                  placeholder="0.00"
                  className="pl-8"
                  helperText={`Price per month in ${formData.currency}`}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Billing cycle: <span className="font-medium">30 days</span>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Annual Pricing */}
        {formData.billing_types.annual && (
          <Card variant="bordered">
            <Card.Header>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-medium text-gray-900 dark:text-white">
                  Annual Billing
                </h4>
                <Badge variant="info" size="sm">
                  Recurring
                </Badge>
                {formData.billing_types.monthly && savings > 0 && (
                  <Badge variant="success" size="sm">
                    Save {savingsPercent}%
                  </Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10 pointer-events-none">
                  {currencySymbol}
                </span>
                <Input
                  label="Annual Price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.annual_price}
                  onChange={(e) => onChange({ annual_price: e.target.value })}
                  placeholder="0.00"
                  className="pl-8"
                  helperText={`Price per year in ${formData.currency}`}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Billing cycle: <span className="font-medium">365 days</span>
              </div>
              {formData.billing_types.monthly && savings > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    💰 Saves {currencySymbol}{savings.toFixed(2)} ({savingsPercent}%) compared to monthly billing
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* One-off Pricing */}
        {formData.billing_types.one_off && (
          <Card variant="bordered">
            <Card.Header>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-medium text-gray-900 dark:text-white">
                  One-off Payment
                </h4>
                <Badge variant="default" size="sm">
                  Non-recurring
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10 pointer-events-none">
                  {currencySymbol}
                </span>
                <Input
                  label="One-time Price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.one_off_price}
                  onChange={(e) => onChange({ one_off_price: e.target.value })}
                  placeholder="0.00"
                  className="pl-8"
                  helperText={`One-time payment in ${formData.currency}`}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium">Lifetime access with a single payment</p>
                <p className="mt-1">No recurring charges</p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* No billing types selected warning */}
        {!formData.billing_types.monthly && !formData.billing_types.annual && !formData.billing_types.one_off && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Please select at least one billing type above
            </p>
          </div>
        )}
      </div>

      {/* Trial Period (for recurring plans only) */}
      {(formData.billing_types.monthly || formData.billing_types.annual) && (
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
          <div className="max-w-xs">
            <Input
              label="Trial Period (Optional)"
              type="number"
              min="0"
              value={formData.trial_period_days?.toString() || ''}
              onChange={(e) =>
                onChange({
                  trial_period_days: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="e.g., 14"
              helperText="Number of free trial days"
            />
          </div>
        </div>
      )}
    </div>
  );
};
