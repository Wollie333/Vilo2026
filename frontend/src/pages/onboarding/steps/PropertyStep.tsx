/**
 * PropertyStep Component
 *
 * Step 3: Add first property
 * - Property name (required)
 * - Property type (required)
 * - Description (optional)
 * - Address (optional)
 */

import React, { useState } from 'react';
import { Input, Textarea, Select, Alert } from '@/components/ui';
import { OnboardingFooter } from '../components/OnboardingFooter';
import type { OnboardingPropertyData } from '@/types/onboarding.types';

interface PropertyStepProps {
  onSubmit: (data: OnboardingPropertyData) => Promise<void>;
  onSkip: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  initialData?: OnboardingPropertyData;
}

const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'other', label: 'Other' },
];

export const PropertyStep: React.FC<PropertyStepProps> = ({
  onSubmit,
  onSkip,
  onBack,
  isLoading,
  initialData,
}) => {
  const [formData, setFormData] = useState<OnboardingPropertyData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    property_type: initialData?.property_type || 'house',
    address_street: initialData?.address_street || '',
    address_city: initialData?.address_city || '',
    address_state: initialData?.address_state || '',
    address_postal_code: initialData?.address_postal_code || '',
    address_country: initialData?.address_country || '',
  });

  // Update form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        property_type: initialData.property_type || 'house',
        address_street: initialData.address_street || '',
        address_city: initialData.address_city || '',
        address_state: initialData.address_state || '',
        address_postal_code: initialData.address_postal_code || '',
        address_country: initialData.address_country || '',
      });
    }
  }, [initialData]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: keyof OnboardingPropertyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    handleChange(e.target.name as keyof OnboardingPropertyData, e.target.value);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Property name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Property name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create property');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="text-center">
        <span className="inline-flex w-10 h-10 rounded-full bg-primary text-white text-lg font-bold items-center justify-center mb-3">
          3
        </span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add your first property
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You can add more properties later
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-5">
        {submitError && (
          <Alert variant="error" dismissible onDismiss={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <Input
          label="Property Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Beach House Villa"
          helperText="Give your property a memorable name"
          fullWidth
          disabled={isLoading}
          autoFocus
          error={errors.name}
        />

        <Select
          label="Property Type"
          name="property_type"
          value={formData.property_type}
          onChange={handleInputChange}
          options={PROPERTY_TYPES}
          fullWidth
          disabled={isLoading}
          error={errors.property_type}
        />

        <Textarea
          label="Description (optional)"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your property..."
          rows={3}
          fullWidth
          disabled={isLoading}
          error={errors.description}
        />

        {/* Address section */}
        <div className="border-t border-gray-200 dark:border-dark-border pt-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Location (optional)
          </p>

          <div className="space-y-4">
            <Input
              label="Street Address"
              name="address_street"
              type="text"
              value={formData.address_street}
              onChange={handleInputChange}
              placeholder="123 Beach Road"
              fullWidth
              disabled={isLoading}
              error={errors.address_street}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                name="address_city"
                type="text"
                value={formData.address_city}
                onChange={handleInputChange}
                placeholder="Miami"
                fullWidth
                disabled={isLoading}
                error={errors.address_city}
              />

              <Input
                label="State/Province"
                name="address_state"
                type="text"
                value={formData.address_state}
                onChange={handleInputChange}
                placeholder="Florida"
                fullWidth
                disabled={isLoading}
                error={errors.address_state}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postal Code"
                name="address_postal_code"
                type="text"
                value={formData.address_postal_code}
                onChange={handleInputChange}
                placeholder="33101"
                fullWidth
                disabled={isLoading}
                error={errors.address_postal_code}
              />

              <Input
                label="Country"
                name="address_country"
                type="text"
                value={formData.address_country}
                onChange={handleInputChange}
                placeholder="USA"
                fullWidth
                disabled={isLoading}
                error={errors.address_country}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <OnboardingFooter
        onSkip={onSkip}
        onContinue={handleSubmit}
        onBack={onBack}
        showBack
        isLoading={isLoading}
        continueLabel="Save & Continue"
      />
    </div>
  );
};

export default PropertyStep;
