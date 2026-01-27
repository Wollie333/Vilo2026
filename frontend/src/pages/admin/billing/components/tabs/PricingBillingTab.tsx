/**
 * PricingBillingTab Component
 *
 * Enhanced pricing interface with clear sections for:
 * - Billing types (monthly, annual, one-off)
 * - Pricing for each active type
 * - Trial periods
 * - Currency settings
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui';
import type { PlanFormData } from '../SubscriptionPlansTab';

// Icons
const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

interface PricingBillingTabProps {
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
}

// Collapsible section component
interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-dark-border rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
        <div
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <ChevronDownIcon />
        </div>
      </button>
      {isOpen && <div className="p-4 pt-0 border-t border-gray-200 dark:border-dark-border">{children}</div>}
    </div>
  );
};

// Billing type card component
interface BillingTypeCardProps {
  type: 'monthly' | 'annual' | 'one_off';
  label: string;
  description: string;
  isSelected: boolean;
  priceValue: string;
  currency: string;
  onToggle: () => void;
  onPriceChange: (value: string) => void;
}

const BillingTypeCard: React.FC<BillingTypeCardProps> = ({
  type,
  label,
  description,
  isSelected,
  priceValue,
  currency,
  onToggle,
  onPriceChange,
}) => {
  return (
    <div
      className={`
        relative p-4 border-2 rounded-lg transition-all cursor-pointer
        ${
          isSelected
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
      onClick={onToggle}
    >
      {/* Checkmark */}
      <div className="absolute top-3 right-3">
        <div
          className={`
            w-6 h-6 rounded-full flex items-center justify-center transition-colors
            ${isSelected ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}
          `}
        >
          {isSelected && <CheckIcon />}
        </div>
      </div>

      {/* Content */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{label}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{description}</p>

        {/* Price Input (only if selected) */}
        {isSelected && (
          <div onClick={(e) => e.stopPropagation()}>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price ({currency})
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">{currency}</span>
              <input
                type="number"
                value={priceValue}
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md
                           bg-white dark:bg-dark-card text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            {type === 'monthly' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per month</p>
            )}
            {type === 'annual' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per year (billed annually)</p>
            )}
            {type === 'one_off' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">One-time payment</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const PricingBillingTab: React.FC<PricingBillingTabProps> = ({ formData, onChange }) => {
  // Check if at least one billing type is selected
  const hasActiveBillingType =
    formData.billing_types.monthly ||
    formData.billing_types.annual ||
    formData.billing_types.one_off;

  return (
    <div className="space-y-6">
      {/* Billing Types Section */}
      <CollapsibleSection
        title="Billing Types"
        description="Select which billing options to offer for this plan"
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Validation Warning */}
          {!hasActiveBillingType && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">
                <InfoIcon />
              </div>
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">At least one billing type required</p>
                <p className="text-xs mt-1">Select monthly, annual, or one-off billing</p>
              </div>
            </div>
          )}

          {/* Billing Type Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BillingTypeCard
              type="monthly"
              label="Monthly Billing"
              description="Recurring monthly subscription"
              isSelected={formData.billing_types.monthly}
              priceValue={formData.monthly_price}
              currency={formData.currency}
              onToggle={() =>
                onChange({
                  billing_types: {
                    ...formData.billing_types,
                    monthly: !formData.billing_types.monthly,
                  },
                })
              }
              onPriceChange={(value) => onChange({ monthly_price: value })}
            />

            <BillingTypeCard
              type="annual"
              label="Annual Billing"
              description="Recurring yearly subscription (save more)"
              isSelected={formData.billing_types.annual}
              priceValue={formData.annual_price}
              currency={formData.currency}
              onToggle={() =>
                onChange({
                  billing_types: {
                    ...formData.billing_types,
                    annual: !formData.billing_types.annual,
                  },
                })
              }
              onPriceChange={(value) => onChange({ annual_price: value })}
            />

            <BillingTypeCard
              type="one_off"
              label="One-Time Payment"
              description="Single payment, lifetime access"
              isSelected={formData.billing_types.one_off}
              priceValue={formData.one_off_price}
              currency={formData.currency}
              onToggle={() =>
                onChange({
                  billing_types: {
                    ...formData.billing_types,
                    one_off: !formData.billing_types.one_off,
                  },
                })
              }
              onPriceChange={(value) => onChange({ one_off_price: value })}
            />
          </div>

          {/* Savings Calculator (if both monthly and annual are selected) */}
          {formData.billing_types.monthly && formData.billing_types.annual && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                Annual Savings Calculator
              </p>
              {(() => {
                const monthly = parseFloat(formData.monthly_price) || 0;
                const annual = parseFloat(formData.annual_price) || 0;
                const monthlyTotal = monthly * 12;
                const savings = monthlyTotal - annual;
                const savingsPercent =
                  monthlyTotal > 0 ? Math.round((savings / monthlyTotal) * 100) : 0;

                if (savings > 0) {
                  return (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Customers save {formData.currency} {savings.toFixed(2)} ({savingsPercent}%) with
                      annual billing
                    </p>
                  );
                } else if (savings < 0) {
                  return (
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Warning: Annual plan costs more than 12 months of monthly
                    </p>
                  );
                } else {
                  return (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No savings with annual billing
                    </p>
                  );
                }
              })()}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Currency Section */}
      <CollapsibleSection
        title="Currency Settings"
        description="Set the currency for this plan"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="ZAR">ZAR - South African Rand</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All prices will be displayed in this currency
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Trial Period Section */}
      <CollapsibleSection
        title="Trial Period (Optional)"
        description="Offer a free trial before charging"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div>
            <Input
              type="number"
              label="Trial Period Days"
              value={formData.trial_period_days?.toString() || ''}
              onChange={(e) => {
                const value = e.target.value;
                onChange({
                  trial_period_days: value === '' ? null : parseInt(value, 10),
                });
              }}
              placeholder="0"
              helperText="Number of days for free trial (0 or empty = no trial)"
              min="0"
              max="365"
            />
          </div>

          {formData.trial_period_days && formData.trial_period_days > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ✓ Users will get {formData.trial_period_days} days of free access before being
                charged
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Advanced Settings Section */}
      <CollapsibleSection
        title="Advanced Settings"
        description="Technical billing configuration"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Billing Cycle Days
            </label>
            <input
              type="number"
              value={formData.billing_cycle_days || 30}
              onChange={(e) => onChange({ billing_cycle_days: parseInt(e.target.value, 10) })}
              placeholder="30"
              min="1"
              max="365"
              className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Days in a billing cycle (default: 30 for monthly)
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Recurring Billing</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enable automatic recurring charges
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ is_recurring: !formData.is_recurring })}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                border-2 border-transparent transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${formData.is_recurring ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full
                  bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${formData.is_recurring ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};
