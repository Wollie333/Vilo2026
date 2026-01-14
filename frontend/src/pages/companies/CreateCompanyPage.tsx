/**
 * CreateCompanyPage Component
 *
 * Form to create a new company.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Input,
  Button,
  Alert,
  PhoneInput,
  MaskedInput,
  Select,
} from '@/components/ui';
import { AddressField } from '@/components/features';
import { companyService } from '@/services';
import type { CreateCompanyData, CompanyLimitInfo } from '@/types/company.types';
import type { AddressData } from '@/types/location.types';

// Currency options
const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
];

// Icons
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export const CreateCompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const [limitInfo, setLimitInfo] = useState<CompanyLimitInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    display_name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    default_currency: 'USD',
    address_street: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
    address_country: '',
    vat_number: '',
    registration_number: '',
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
  });

  // Address state for the AddressField component
  const [addressData, setAddressData] = useState<AddressData>({
    street_address: '',
    street_address_2: '',
    country: '',
    country_id: '',
    province: '',
    province_id: '',
    city: '',
    city_id: '',
    postal_code: '',
  });

  // Check limit on mount
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const limit = await companyService.getCompanyLimit();
        setLimitInfo(limit);
        if (!limit.can_create) {
          setError('You have reached your company limit. Please upgrade your plan to create more companies.');
        }
      } catch (err) {
        console.error('Failed to check company limit', err);
      }
    };
    checkLimit();
  }, []);

  // Handle form field change
  const handleChange = (field: keyof CreateCompanyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle address changes from AddressField
  const handleAddressChange = (data: AddressData) => {
    setAddressData(data);
    // Map AddressData to CreateCompanyData address fields
    // Combine street_address and street_address_2
    const streetAddress = [data.street_address, data.street_address_2]
      .filter(Boolean)
      .join(', ');
    setFormData((prev) => ({
      ...prev,
      address_street: streetAddress,
      address_city: data.city || '',
      address_state: data.province || '',
      address_postal_code: data.postal_code || '',
      address_country: data.country || '',
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const company = await companyService.createCompany(formData);
      navigate(`/companies/${company.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const canCreate = limitInfo?.can_create ?? true;

  return (
    <AuthenticatedLayout title="Create Company" subtitle="Add a new company to your portfolio">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/companies')}
          className="mb-6"
        >
          <ArrowLeftIcon />
          <span className="ml-2">Back to Companies</span>
        </Button>

        {/* Error alert */}
        {error && (
          <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Limit warning */}
        {limitInfo && !limitInfo.can_create && (
          <Alert variant="warning" className="mb-6">
            You have reached your company limit ({limitInfo.max_allowed} companies).
            Please upgrade your plan to create more companies.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <Card className="mb-6">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>

              <Input
                label="Company Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter company name"
                required
                fullWidth
              />

              <Input
                label="Display Name"
                value={formData.display_name || ''}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="Optional display name"
                helperText="This will be shown instead of the company name if provided"
                fullWidth
              />

              <Input
                label="Description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of your company"
                fullWidth
              />

              <Select
                label="Default Currency"
                value={formData.default_currency || 'USD'}
                onChange={(e) => handleChange('default_currency', e.target.value)}
                options={currencyOptions}
                fullWidth
              />
            </div>
          </Card>

          {/* Contact Info */}
          <Card className="mb-6">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <Input
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="company@example.com"
                    className="pl-10"
                    fullWidth
                  />
                </div>
              </div>

              <PhoneInput
                label="Contact Phone"
                value={formData.contact_phone || ''}
                onChange={(value) => handleChange('contact_phone', value)}
                fullWidth
              />

              <Input
                label="Website"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
                fullWidth
              />
            </div>
          </Card>

          {/* Address */}
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Address
              </h3>

              <AddressField
                value={addressData}
                onChange={handleAddressChange}
                disabled={loading}
              />
            </div>
          </Card>

          {/* Legal Info */}
          <Card className="mb-6">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Legal Information
              </h3>

              <MaskedInput
                label="VAT Number"
                mask="vat"
                value={formData.vat_number || ''}
                onChange={(value) => handleChange('vat_number', value)}
                helperText="10-digit VAT number"
                fullWidth
              />

              <MaskedInput
                label="Registration Number"
                mask="company_registration"
                value={formData.registration_number || ''}
                onChange={(value) => handleChange('registration_number', value)}
                helperText="Format: YYYY/NNNNNN/NN"
                fullWidth
              />
            </div>
          </Card>

          {/* Social Media */}
          <Card className="mb-6">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Social Media
              </h3>

              <Input
                label="LinkedIn"
                value={formData.linkedin_url || ''}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/company/..."
                fullWidth
              />

              <Input
                label="Facebook"
                value={formData.facebook_url || ''}
                onChange={(e) => handleChange('facebook_url', e.target.value)}
                placeholder="https://facebook.com/..."
                fullWidth
              />

              <Input
                label="Instagram"
                value={formData.instagram_url || ''}
                onChange={(e) => handleChange('instagram_url', e.target.value)}
                placeholder="https://instagram.com/..."
                fullWidth
              />

              <Input
                label="Twitter/X"
                value={formData.twitter_url || ''}
                onChange={(e) => handleChange('twitter_url', e.target.value)}
                placeholder="https://twitter.com/..."
                fullWidth
              />

              <Input
                label="YouTube"
                value={formData.youtube_url || ''}
                onChange={(e) => handleChange('youtube_url', e.target.value)}
                placeholder="https://youtube.com/@..."
                fullWidth
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/companies')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              disabled={!canCreate}
            >
              Create Company
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
};
