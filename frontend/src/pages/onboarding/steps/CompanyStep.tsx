/**
 * CompanyStep Component
 *
 * Step 2: Set up company/business information
 * - Company name (required)
 * - Contact info (optional)
 * - Address (optional)
 */

import React, { useState } from 'react';
import { Input, PhoneInput, Alert, LocationSelector } from '@/components/ui';
import type { LocationData } from '@/components/ui';
import { OnboardingFooter } from '../components/OnboardingFooter';
import type { OnboardingCompanyData } from '@/types/onboarding.types';

interface CompanyStepProps {
  onSubmit: (data: OnboardingCompanyData) => Promise<void>;
  onSkip: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  initialData?: OnboardingCompanyData;
}

export const CompanyStep: React.FC<CompanyStepProps> = ({
  onSubmit,
  onSkip,
  onBack,
  isLoading,
  initialData,
}) => {
  const [formData, setFormData] = useState<OnboardingCompanyData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    address_street: initialData?.address_street || '',
    address_city: initialData?.address_city || '',
    address_state: initialData?.address_state || '',
    address_postal_code: initialData?.address_postal_code || '',
    address_country: initialData?.address_country || '',
  });

  // Location state for LocationSelector
  const [locationData, setLocationData] = useState<LocationData>({
    countryId: undefined,
    provinceId: undefined,
    cityId: undefined,
  });

  // Update form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        website: initialData.website || '',
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

  const handleChange = (field: keyof OnboardingCompanyData, value: string) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.name as keyof OnboardingCompanyData, e.target.value);
  };

  const handleLocationChange = (data: LocationData) => {
    setLocationData(data);
    // Update form data with location names
    setFormData((prev) => ({
      ...prev,
      address_country: data.countryName || '',
      address_state: data.provinceName || '',
      address_city: data.cityName || '',
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Company name must be at least 2 characters';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://';
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
      setSubmitError(err instanceof Error ? err.message : 'Failed to create company');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="text-center">
        <span className="inline-flex w-10 h-10 rounded-full bg-primary text-white text-lg font-bold items-center justify-center mb-3">
          2
        </span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Set up your company
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          This is your rental management business
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
          label="Company Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="My Vacation Rentals LLC"
          fullWidth
          disabled={isLoading}
          autoFocus
          error={errors.name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email (optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@company.com"
                className="pl-10"
                fullWidth
                disabled={isLoading}
                error={errors.email}
              />
            </div>
          </div>

          <PhoneInput
            label="Phone (optional)"
            name="phone"
            value={formData.phone || ''}
            onChange={(value) => handleChange('phone', value)}
            fullWidth
            disabled={isLoading}
            error={errors.phone}
            helperText="South African mobile number"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Website (optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <Input
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://myrentals.com"
              className="pl-10"
              fullWidth
              disabled={isLoading}
              error={errors.website}
            />
          </div>
        </div>

        {/* Address section */}
        <div className="border-t border-gray-200 dark:border-dark-border pt-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Address (optional)
          </p>

          <div className="space-y-4">
            {/* Location Selector */}
            <LocationSelector
              selectedCountryId={locationData.countryId}
              selectedProvinceId={locationData.provinceId}
              selectedCityId={locationData.cityId}
              onLocationChange={handleLocationChange}
              disabled={isLoading}
              showCoordinates={false}
              helperText="Select your company's location"
            />

            {/* Street Address */}
            <Input
              label="Street Address"
              name="address_street"
              type="text"
              value={formData.address_street}
              onChange={handleInputChange}
              placeholder="123 Business St"
              fullWidth
              disabled={isLoading}
              error={errors.address_street}
            />

            {/* Postal Code */}
            <Input
              label="Postal Code"
              name="address_postal_code"
              type="text"
              value={formData.address_postal_code}
              onChange={handleInputChange}
              placeholder="12345"
              fullWidth
              disabled={isLoading}
              error={errors.address_postal_code}
            />
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

export default CompanyStep;
