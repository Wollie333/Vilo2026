/**
 * PricingStep Component
 *
 * Step 3 of the Room Wizard: Pricing mode, base rates, and children pricing.
 */

import React, { useState } from 'react';
import { Input, Button, Select } from '@/components/ui';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import type { PricingStepProps } from './RoomWizard.types';
import {
  PRICING_MODE_LABELS,
  PRICING_MODE_DESCRIPTIONS,
  PricingMode,
} from '@/types/room.types';

// ============================================================================
// Currency Options
// ============================================================================

const CURRENCY_OPTIONS = [
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'NAD', label: 'NAD - Namibian Dollar' },
  { value: 'BWP', label: 'BWP - Botswana Pula' },
];

// ============================================================================
// PricingStep Component
// ============================================================================

export const PricingStep: React.FC<PricingStepProps> = ({
  data,
  currency: defaultCurrency,
  onChange,
  onNext,
  onBack,
  isLoading,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
    // 💰 PRICE DEBUG: Log when price changes
    if (field === 'base_price_per_night') {
      console.log('=== 💰 [PRICING_STEP] Price input changed ===');
      console.log('💰 [PRICING_STEP] New value:', value);
      console.log('💰 [PRICING_STEP] Value type:', typeof value);
    }

    onChange({ ...data, [field]: value });

    // Clear error when field is edited
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: data.currency || defaultCurrency || 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.base_price_per_night <= 0) {
      newErrors.base_price_per_night = 'Base price must be greater than 0';
    }

    if (data.pricing_mode === 'per_person_sharing' && !data.additional_person_rate) {
      newErrors.additional_person_rate = 'Additional person rate is required for this pricing mode';
    }

    if (data.child_free_until_age !== null && data.child_free_until_age < 0) {
      newErrors.child_free_until_age = 'Age cannot be negative';
    }

    if (data.child_age_limit !== null && data.child_age_limit < 0) {
      newErrors.child_age_limit = 'Age cannot be negative';
    }

    if (
      data.child_free_until_age !== null &&
      data.child_age_limit !== null &&
      data.child_free_until_age >= data.child_age_limit
    ) {
      newErrors.child_free_until_age = 'Free age must be less than child age limit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const pricingModeOptions = Object.entries(PRICING_MODE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Set your pricing model and rates.
        </p>
      </div>

      {/* Pricing Mode */}
      <div className="space-y-2">
        <Select
          label="Pricing Mode"
          value={data.pricing_mode}
          onChange={(e) => handleChange('pricing_mode', e.target.value as PricingMode)}
          options={pricingModeOptions}
        />
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <HiOutlineInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {PRICING_MODE_DESCRIPTIONS[data.pricing_mode]}
          </p>
        </div>
      </div>

      {/* Currency */}
      <Select
        label="Currency"
        value={data.currency}
        onChange={(e) => handleChange('currency', e.target.value)}
        options={CURRENCY_OPTIONS}
      />

      {/* Base Price */}
      <Input
        label="Base Price Per Night *"
        type="number"
        min={0}
        step={0.01}
        value={data.base_price_per_night || ''}
        onChange={(e) => handleChange('base_price_per_night', parseFloat(e.target.value) || 0)}
        error={errors.base_price_per_night}
        helperText={
          data.pricing_mode === 'per_unit'
            ? 'This is the flat rate for the entire room per night'
            : data.pricing_mode === 'per_person'
              ? 'This is the rate per person per night'
              : 'This is the base rate for the first guest per night'
        }
        fullWidth
      />

      {/* Additional Person Rate (for per_person_sharing) */}
      {data.pricing_mode === 'per_person_sharing' && (
        <Input
          label="Additional Person Rate *"
          type="number"
          min={0}
          step={0.01}
          value={data.additional_person_rate || ''}
          onChange={(e) => handleChange('additional_person_rate', parseFloat(e.target.value) || null)}
          error={errors.additional_person_rate}
          helperText="Extra charge per additional guest beyond the first"
          fullWidth
        />
      )}

      {/* Children Pricing Section */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Children Pricing (Optional)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Configure special pricing rules for children. Leave empty to charge children at full adult rates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Child Price Per Night"
            type="number"
            min={0}
            step={0.01}
            value={data.child_price_per_night || ''}
            onChange={(e) => handleChange('child_price_per_night', e.target.value ? parseFloat(e.target.value) : null)}
            helperText="Special rate for children"
            fullWidth
          />
          <Input
            label="Free Until Age"
            type="number"
            min={0}
            max={18}
            value={data.child_free_until_age || ''}
            onChange={(e) => handleChange('child_free_until_age', e.target.value ? parseInt(e.target.value) : null)}
            error={errors.child_free_until_age}
            helperText="Children under this age stay free"
            fullWidth
          />
        </div>

        <Input
          label="Child Age Limit"
          type="number"
          min={1}
          max={18}
          value={data.child_age_limit || ''}
          onChange={(e) => handleChange('child_age_limit', e.target.value ? parseInt(e.target.value) : null)}
          error={errors.child_age_limit}
          helperText="Maximum age to be considered a child (usually 12-18)"
          fullWidth
        />
      </div>

      {/* Price Preview */}
      {data.base_price_per_night > 0 && (
        <div className="p-4 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Price Preview
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <p>
              <span className="font-medium">Base rate:</span>{' '}
              {formatCurrency(data.base_price_per_night)}/night
            </p>
            {data.pricing_mode === 'per_person_sharing' && data.additional_person_rate && (
              <p>
                <span className="font-medium">Extra person:</span>{' '}
                +{formatCurrency(data.additional_person_rate)}/night
              </p>
            )}
            {data.child_price_per_night && (
              <p>
                <span className="font-medium">Child rate:</span>{' '}
                {formatCurrency(data.child_price_per_night)}/night
              </p>
            )}
            {data.child_free_until_age && (
              <p>
                <span className="font-medium">Free:</span>{' '}
                Children under {data.child_free_until_age} years
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  );
};
