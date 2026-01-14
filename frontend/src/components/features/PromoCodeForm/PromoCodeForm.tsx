/**
 * PromoCodeForm Component
 *
 * Full-page form for creating/editing promo codes at property level.
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select, Card, DateInput } from '@/components/ui';
import { PromoCodeFormProps, PromoCodeFormData } from './PromoCodeForm.types';

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'free_nights', label: 'Free Nights' },
];

const createEmptyFormData = (): PromoCodeFormData => ({
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  min_nights: undefined,
  max_uses: undefined,
  start_date: '',
  end_date: '',
  is_active: true,
});

const convertToFormData = (promo: any): PromoCodeFormData => ({
  code: promo.code,
  name: promo.name,
  description: promo.description || '',
  discount_type: promo.discount_type,
  discount_value: promo.discount_value,
  min_nights: promo.min_nights || undefined,
  max_uses: promo.max_uses || undefined,
  start_date: promo.valid_from ? extractDatePart(promo.valid_from) : '',  // Map from database field
  end_date: promo.valid_until ? extractDatePart(promo.valid_until) : '',   // Map from database field
  is_active: promo.is_active,
});

/**
 * Extract date part from datetime string for date inputs
 * "2026-01-15T00:00:00.000Z" -> "2026-01-15"
 */
const extractDatePart = (datetime: string): string => {
  if (!datetime) return '';
  // If already date-only, return as-is
  if (!datetime.includes('T')) return datetime;
  // Extract YYYY-MM-DD from ISO datetime string
  return datetime.split('T')[0];
};

export const PromoCodeForm: React.FC<PromoCodeFormProps> = ({
  mode,
  promoCode,
  propertyId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PromoCodeFormData>(() =>
    mode === 'edit' && promoCode ? convertToFormData(promoCode) : createEmptyFormData()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when promo code changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && promoCode) {
      setFormData(convertToFormData(promoCode));
      setHasChanges(false);
    }
  }, [mode, promoCode]);

  const handleFieldChange = <K extends keyof PromoCodeFormData>(
    field: K,
    value: PromoCodeFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!formData.code.trim()) return false;
    if (!formData.name.trim()) return false;
    if (formData.discount_value <= 0) return false;

    // Validate percentage range
    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      return false;
    }

    // Validate date range
    if (formData.start_date && formData.end_date) {
      return new Date(formData.start_date) <= new Date(formData.end_date);
    }

    return true;
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a unique promo code for your guests
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <Input
              label="Promo Code"
              name="code"
              value={formData.code}
              onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
              placeholder="SUMMER2026"
              required
              error={!formData.code.trim() ? 'Promo code is required' : undefined}
            />

            <Input
              label="Display Name"
              name="name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Summer Special"
              required
              error={!formData.name.trim() ? 'Display name is required' : undefined}
            />

            <Textarea
              label="Description (Optional)"
              name="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Describe this promotion..."
              rows={2}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Discount Terms */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold">Discount Terms</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure the discount details
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Discount Type"
                name="discount_type"
                value={formData.discount_type}
                onChange={(e) =>
                  handleFieldChange(
                    'discount_type',
                    e.target.value as 'percentage' | 'fixed_amount' | 'free_nights'
                  )
                }
                options={DISCOUNT_TYPE_OPTIONS}
                required
              />

              <Input
                label={
                  formData.discount_type === 'percentage'
                    ? 'Discount Percentage'
                    : formData.discount_type === 'free_nights'
                    ? 'Number of Free Nights'
                    : 'Discount Amount'
                }
                name="discount_value"
                type="number"
                min={0}
                max={formData.discount_type === 'percentage' ? 100 : undefined}
                value={formData.discount_value.toString()}
                onChange={(e) =>
                  handleFieldChange('discount_value', parseFloat(e.target.value) || 0)
                }
                required
                error={
                  formData.discount_value <= 0
                    ? 'Discount value must be greater than 0'
                    : formData.discount_type === 'percentage' && formData.discount_value > 100
                    ? 'Percentage cannot exceed 100'
                    : undefined
                }
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Usage Restrictions */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold">Usage Restrictions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Optional limits and requirements
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Nights (Optional)"
                name="min_nights"
                type="number"
                min={1}
                value={formData.min_nights?.toString() || ''}
                onChange={(e) =>
                  handleFieldChange('min_nights', e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="No minimum"
              />

              <Input
                label="Maximum Uses (Optional)"
                name="max_uses"
                type="number"
                min={1}
                value={formData.max_uses?.toString() || ''}
                onChange={(e) =>
                  handleFieldChange('max_uses', e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="Unlimited"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Start Date (Optional)"
                value={formData.start_date}
                onChange={(value) => handleFieldChange('start_date', value)}
                placeholder="Select start date"
              />

              <DateInput
                label="End Date (Optional)"
                value={formData.end_date}
                onChange={(value) => handleFieldChange('end_date', value)}
                placeholder="Select end date"
                minDate={formData.start_date ? new Date(formData.start_date) : undefined}
              />
            </div>

            {formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date) && (
              <p className="text-sm text-red-500">End date must be after start date</p>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Settings */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold">Settings</h2>
        </Card.Header>
        <Card.Body>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleFieldChange('is_active', e.target.checked)}
              className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary dark:bg-dark-bg dark:border-dark-border"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-900 dark:text-white">
              Promo code is active
            </label>
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
          {mode === 'create' ? 'Create Promo Code' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
