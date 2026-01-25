/**
 * CompanyStep Component
 *
 * Step 2: Set up company/business information
 * - Company name (required)
 * - Contact info (optional)
 * - Address (optional)
 */

import React, { useState } from 'react';
import { Mail, Globe } from 'lucide-react';
import { Input, PhoneInput, Alert, AddressAutocomplete, ImageUpload, Select } from '@/components/ui';
import type { AddressData } from '@/components/ui';
import { OnboardingFooter } from '../components/OnboardingFooter';
import type { OnboardingCompanyData } from '@/types/onboarding.types';
import { companyService } from '@/services';
import { CURRENCY_SELECT_OPTIONS } from '@/utils/currencies';

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
    default_currency: initialData?.default_currency || 'USD',
    address_street: initialData?.address_street || '',
    address_city: initialData?.address_city || '',
    address_state: initialData?.address_state || '',
    address_postal_code: initialData?.address_postal_code || '',
    address_country: initialData?.address_country || '',
  });

  // State for address autocomplete search
  const [addressSearch, setAddressSearch] = useState('');

  // State for logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Update form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        website: initialData.website || '',
        default_currency: initialData.default_currency || 'USD',
        address_street: initialData.address_street || '',
        address_city: initialData.address_city || '',
        address_state: initialData.address_state || '',
        address_postal_code: initialData.address_postal_code || '',
        address_country: initialData.address_country || '',
      });

      // Set logo preview if there's an existing logo URL
      if (initialData.logo_url) {
        setLogoPreview(initialData.logo_url);
      }
    }
  }, [initialData]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: keyof OnboardingCompanyData, value: string) => {
    // Log address field changes
    if (field.startsWith('address_')) {
      console.log(`[CompanyStep] Address field changed: ${field} = "${value}"`);
    }

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

  const handleAddressSelect = (address: AddressData) => {
    console.log('[CompanyStep] Address selected from autocomplete:', address);

    setFormData((prev) => ({
      ...prev,
      address_street: address.street || prev.address_street,
      address_city: address.city || prev.address_city,
      address_state: address.state || prev.address_state,
      address_postal_code: address.postal_code || prev.address_postal_code,
      address_country: address.country || prev.address_country,
    }));

    console.log('[CompanyStep] Form data updated with autocomplete address');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Company name must be at least 2 characters';
    }

    // Email is optional - only validate if provided
    if (formData.email && formData.email.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Website is optional - only validate if provided
    if (formData.website && formData.website.trim() !== '') {
      if (!formData.website.startsWith('http')) {
        newErrors.website = 'Website must start with http:// or https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!validateForm()) {
      console.log('[CompanyStep] Validation failed');
      return;
    }

    console.log('[CompanyStep] === Submitting company data ===');
    console.log('[CompanyStep] Full form data:', JSON.stringify(formData, null, 2));
    console.log('[CompanyStep] Address fields:', {
      street: formData.address_street,
      city: formData.address_city,
      state: formData.address_state,
      postal: formData.address_postal_code,
      country: formData.address_country,
    });

    try {
      // First, save company data and get the company ID from response
      const response = await onSubmit(formData);
      console.log('[CompanyStep] Save successful, company ID:', response?.companyId);

      // If logo selected, upload it using the returned company ID
      if (logoFile && response?.companyId) {
        setUploadingLogo(true);
        try {
          console.log('[CompanyStep] Uploading company logo for ID:', response.companyId);
          await companyService.uploadLogo(response.companyId, logoFile);
          console.log('[CompanyStep] Logo upload successful');
        } catch (logoErr) {
          console.error('[CompanyStep] Logo upload failed:', logoErr);
          // Don't block onboarding if upload fails - user can upload later
        } finally {
          setUploadingLogo(false);
        }
      }
    } catch (err) {
      console.error('[CompanyStep] Save failed:', err);
      console.error('[CompanyStep] Error details:', err instanceof Error ? err.stack : 'N/A');
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
          <Input
            label="Email (optional)"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="contact@company.com"
            leftIcon={<Mail className="w-5 h-5" />}
            fullWidth
            disabled={isLoading}
            error={errors.email}
          />

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

        <Input
          label="Website (optional)"
          name="website"
          type="url"
          value={formData.website}
          onChange={handleInputChange}
          placeholder="https://myrentals.com"
          leftIcon={<Globe className="w-5 h-5" />}
          fullWidth
          disabled={isLoading}
          error={errors.website}
        />

        {/* Currency Selector */}
        <div className="space-y-2">
          <Select
            label="Default Currency"
            name="default_currency"
            value={formData.default_currency}
            onChange={handleInputChange}
            options={CURRENCY_SELECT_OPTIONS}
            fullWidth
            disabled={isLoading}
            helperText="This will be used as the default currency for all pricing, invoices, and payments"
          />
        </div>

        {/* Company Logo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Logo (Optional)
          </label>
          <ImageUpload
            value={logoPreview}
            onUpload={async (file) => {
              setLogoFile(file);
              setLogoPreview(URL.createObjectURL(file));
            }}
            onDelete={async () => {
              setLogoFile(null);
              setLogoPreview(null);
            }}
            shape="square"
            size="lg"
            disabled={isLoading || uploadingLogo}
            showDelete={true}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Upload your company logo (max 2MB, JPG/PNG/SVG)
          </p>
        </div>

        {/* Address section */}
        <div className="border-t border-gray-200 dark:border-dark-border pt-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Address (optional)
          </p>

          <div className="space-y-4">
            {/* Address Autocomplete */}
            <AddressAutocomplete
              value={addressSearch}
              onChange={handleAddressSelect}
              onInputChange={setAddressSearch}
              placeholder="Search for your company address..."
              disabled={isLoading}
              label="Search Address"
            />

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Start typing to search for an address, or fill in the fields manually below
            </p>

            {/* Street Address */}
            <Input
              label="Street Address"
              name="address_street"
              type="text"
              value={formData.address_street}
              onChange={handleInputChange}
              placeholder="123 Business Street"
              fullWidth
              disabled={isLoading}
              error={errors.address_street}
            />

            {/* City and State/Province in a row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City"
                name="address_city"
                type="text"
                value={formData.address_city}
                onChange={handleInputChange}
                placeholder="Cape Town"
                fullWidth
                disabled={isLoading}
                error={errors.address_city}
              />

              <Input
                label="State / Province"
                name="address_state"
                type="text"
                value={formData.address_state}
                onChange={handleInputChange}
                placeholder="Western Cape"
                fullWidth
                disabled={isLoading}
                error={errors.address_state}
              />
            </div>

            {/* Postal Code and Country in a row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Postal Code"
                name="address_postal_code"
                type="text"
                value={formData.address_postal_code}
                onChange={handleInputChange}
                placeholder="8001"
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
                placeholder="South Africa"
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

export default CompanyStep;
