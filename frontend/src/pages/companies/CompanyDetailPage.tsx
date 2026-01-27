/**
 * CompanyDetailPage Component
 *
 * View and edit company details with a 3-column layout.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { AdminDetailLayout } from '@/components/layout/AdminDetailLayout';
import type { AdminNavSection } from '@/components/layout/AdminDetailLayout';
import {
  Card,
  Input,
  Button,
  Badge,
  Spinner,
  Alert,
  Select,
  PhoneInput,
  MaskedInput,
} from '@/components/ui';
import { useHashTab } from '@/hooks';
import { companyService, propertyService } from '@/services';
import type { CompanyWithPropertyCount, UpdateCompanyData } from '@/types/company.types';
import type { PropertyWithCompany } from '@/types/property.types';
import { CompanyDocumentSettingsTab } from './CompanyDocumentSettingsTab';
import { CompanyTeamMembersTab } from './CompanyTeamMembersTab';

// View configuration for hash tab
const COMPANY_VIEWS = ['overview', 'info', 'address', 'legal', 'social', 'properties', 'team-members', 'document-settings'] as const;
type ViewType = typeof COMPANY_VIEWS[number];

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
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [company, setCompany] = useState<CompanyWithPropertyCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeView, setActiveView] = useHashTab(COMPANY_VIEWS, 'overview');
  const [formData, setFormData] = useState<UpdateCompanyData>({});
  const [originalData, setOriginalData] = useState<UpdateCompanyData>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await companyService.getCompany(id);
        setCompany(data);
        const initialData = {
          name: data.name,
          display_name: data.display_name || '',
          description: data.description || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          website: data.website || '',
          default_currency: data.default_currency || 'USD',
          address_street: data.address_street || '',
          address_city: data.address_city || '',
          address_state: data.address_state || '',
          address_postal_code: data.address_postal_code || '',
          address_country: data.address_country || '',
          vat_number: data.vat_number || '',
          vat_percentage: data.vat_percentage !== null ? data.vat_percentage : 15,
          registration_number: data.registration_number || '',
          linkedin_url: data.linkedin_url || '',
          facebook_url: data.facebook_url || '',
          instagram_url: data.instagram_url || '',
          twitter_url: data.twitter_url || '',
          youtube_url: data.youtube_url || '',
          is_active: data.is_active,
        };
        setFormData(initialData);
        setOriginalData(initialData);
        setHasChanges(false);
      } catch (err) {
        setError('Failed to load company');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  // Fetch properties when viewing properties tab
  useEffect(() => {
    const fetchProperties = async () => {
      if (!id || activeView !== 'properties') return;

      try {
        setLoadingProperties(true);
        const result = await propertyService.getMyProperties({ company_id: id });
        setProperties(result.properties);
      } catch (err) {
        console.error('Failed to load properties:', err);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [id, activeView]);

  // Handle field change (just update state)
  const handleFieldChange = useCallback(
    (field: keyof UpdateCompanyData, value: UpdateCompanyData[keyof UpdateCompanyData]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!id) return;

    setIsSaving(true);
    setError(null);

    console.log('🔵 [CompanyDetailPage] Saving company with data:', formData);
    console.log('🔵 [CompanyDetailPage] VAT Percentage value:', formData.vat_percentage);

    try {
      await companyService.updateCompany(id, formData);
      console.log('✅ [CompanyDetailPage] Company updated successfully');
      setOriginalData(formData);
      setSuccess('Company updated successfully');
      setHasChanges(false);
      // Refresh company data
      const updatedCompany = await companyService.getCompany(id);
      console.log('🔵 [CompanyDetailPage] Refreshed company data:', updatedCompany);
      console.log('🔵 [CompanyDetailPage] VAT Percentage after refresh:', updatedCompany.vat_percentage);
      setCompany(updatedCompany);
    } catch (err) {
      console.error('❌ [CompanyDetailPage] Error saving company:', err);
      setError(err instanceof Error ? err.message : 'Failed to update company');
    } finally {
      setIsSaving(false);
    }
  }, [id, formData]);

  // Handle cancel - reset form to original values
  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setHasChanges(false);
  }, [originalData]);

  // Handle logo click
  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  // Handle logo upload
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    setError(null);
    try {
      const logoUrl = await companyService.uploadLogo(id, file);
      setCompany((prev) => (prev ? { ...prev, logo_url: logoUrl } : prev));
      setSuccess('Company logo updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  // Navigation sections
  const navSections: AdminNavSection[] = [
    {
      title: 'GENERAL',
      items: [{ id: 'overview', label: 'Overview', icon: <GridIcon /> }],
    },
    {
      title: 'DETAILS',
      items: [
        { id: 'info', label: 'Company Info', icon: <InfoIcon /> },
        { id: 'address', label: 'Address', icon: <HomeIcon /> },
        { id: 'legal', label: 'Legal Info', icon: <DocumentIcon /> },
        { id: 'social', label: 'Social Media', icon: <ShareIcon /> },
      ],
    },
    {
      title: 'DOCUMENTS',
      items: [{ id: 'document-settings', label: 'Invoice Settings', icon: <DocumentIcon /> }],
    },
    {
      title: 'LINKED',
      items: [
        { id: 'properties', label: 'Properties', icon: <BuildingIcon />, count: company?.property_count },
        { id: 'team-members', label: 'Team Members', icon: <UsersIcon /> },
      ],
    },
  ];

  // Right sidebar content
  const rightSidebar = (
    <Card className="sticky top-6">
      <div className="p-6 text-center">
        {/* Hidden file input */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />
        {/* Clickable logo */}
        <button
          onClick={handleLogoClick}
          disabled={isUploadingLogo}
          className="relative mx-auto block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl group"
        >
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-24 h-24 rounded-xl object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-3xl">
                {company?.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-xl transition-all flex items-center justify-center">
            {isUploadingLogo ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <svg
                className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </div>
        </button>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Click to upload logo
        </p>
        <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
          {company?.name}
        </h2>
        {company?.display_name && company.display_name !== company.name && (
          <p className="text-gray-500 dark:text-gray-400">{company.display_name}</p>
        )}
        <div className="mt-2">
          <Badge variant={company?.is_active ? 'success' : 'default'}>
            {company?.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    </Card>
  );

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Company Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Properties</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {company?.property_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <Badge variant={company?.is_active ? 'success' : 'default'}>
                      {company?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-gray-900 dark:text-white">
                      {company?.created_at
                        ? new Date(company.created_at).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Currency</p>
                    <p className="text-gray-900 dark:text-white">
                      {company?.default_currency || 'USD'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'info':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Company Information
              </h3>

              <Input
                label="Company Name"
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
                fullWidth
              />

              <Input
                label="Display Name"
                value={formData.display_name || ''}
                onChange={(e) => handleFieldChange('display_name', e.target.value)}
                placeholder="Optional display name"
                fullWidth
              />

              <Input
                label="Description"
                value={formData.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Brief description of your company"
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    onChange={(e) => handleFieldChange('contact_email', e.target.value)}
                    placeholder="company@example.com"
                    className="pl-10"
                    fullWidth
                  />
                </div>
                {formData.contact_email && (
                  <a
                    href={`mailto:${formData.contact_email}`}
                    className="mt-1 inline-flex items-center text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send email
                  </a>
                )}
              </div>

              <div>
                <PhoneInput
                  label="Contact Phone"
                  value={formData.contact_phone || ''}
                  onChange={(value) => handleFieldChange('contact_phone', value)}
                  fullWidth
                />
                {formData.contact_phone && (
                  <a
                    href={`tel:${formData.contact_phone}`}
                    className="mt-1 inline-flex items-center text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </a>
                )}
              </div>

              <Input
                label="Website"
                value={formData.website || ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                placeholder="https://example.com"
                fullWidth
              />

              <Select
                label="Default Currency"
                value={formData.default_currency || 'USD'}
                onChange={(e) => handleFieldChange('default_currency', e.target.value)}
                options={currencyOptions}
                fullWidth
              />

              <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Company is active
                  </span>
                </label>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSaving}
                  disabled={!hasChanges}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'address':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h3>

              <Input
                label="Street Address"
                value={formData.address_street || ''}
                onChange={(e) => handleFieldChange('address_street', e.target.value)}
                fullWidth
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={formData.address_city || ''}
                  onChange={(e) => handleFieldChange('address_city', e.target.value)}
                  fullWidth
                />
                <Input
                  label="State/Province"
                  value={formData.address_state || ''}
                  onChange={(e) => handleFieldChange('address_state', e.target.value)}
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Postal Code"
                  value={formData.address_postal_code || ''}
                  onChange={(e) => handleFieldChange('address_postal_code', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Country"
                  value={formData.address_country || ''}
                  onChange={(e) => handleFieldChange('address_country', e.target.value)}
                  fullWidth
                />
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSaving}
                  disabled={!hasChanges}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'legal':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Legal Information
              </h3>

              <MaskedInput
                label="VAT Number"
                mask="vat"
                value={formData.vat_number || ''}
                onChange={(value) => handleFieldChange('vat_number', value)}
                helperText="10-digit VAT number"
                fullWidth
              />

              <Input
                label="VAT Percentage (%)"
                type="number"
                value={formData.vat_percentage?.toString() || '15'}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    handleFieldChange('vat_percentage', value);
                  }
                }}
                helperText="VAT/Tax percentage rate (0-100). Default: 15%"
                min="0"
                max="100"
                step="0.01"
                fullWidth
              />

              <MaskedInput
                label="Registration Number"
                mask="company_registration"
                value={formData.registration_number || ''}
                onChange={(value) => handleFieldChange('registration_number', value)}
                helperText="Format: YYYY/NNNNNN/NN"
                fullWidth
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSaving}
                  disabled={!hasChanges}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'social':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Social Media
              </h3>

              <Input
                label="LinkedIn"
                value={formData.linkedin_url || ''}
                onChange={(e) => handleFieldChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/company/..."
                fullWidth
              />

              <Input
                label="Facebook"
                value={formData.facebook_url || ''}
                onChange={(e) => handleFieldChange('facebook_url', e.target.value)}
                placeholder="https://facebook.com/..."
                fullWidth
              />

              <Input
                label="Instagram"
                value={formData.instagram_url || ''}
                onChange={(e) => handleFieldChange('instagram_url', e.target.value)}
                placeholder="https://instagram.com/..."
                fullWidth
              />

              <Input
                label="Twitter/X"
                value={formData.twitter_url || ''}
                onChange={(e) => handleFieldChange('twitter_url', e.target.value)}
                placeholder="https://twitter.com/..."
                fullWidth
              />

              <Input
                label="YouTube"
                value={formData.youtube_url || ''}
                onChange={(e) => handleFieldChange('youtube_url', e.target.value)}
                placeholder="https://youtube.com/@..."
                fullWidth
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSaving}
                  disabled={!hasChanges}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'properties':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Linked Properties
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/manage/properties/new')}
              >
                Add Property
              </Button>
            </div>

            {loadingProperties ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : properties.length === 0 ? (
              <Card>
                <div className="p-6 text-center py-8">
                  <BuildingIcon />
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    No properties linked to this company yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/manage/properties/new')}
                  >
                    Create Property
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <Card
                    key={property.id}
                    variant="elevated"
                    padding="none"
                    interactive
                    onClick={() => navigate(`/manage/properties/${property.id}`)}
                    className="overflow-hidden"
                  >
                    {/* Featured Image Banner */}
                    <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-card dark:to-dark-border">
                      {property.featured_image_url ? (
                        <img
                          src={property.featured_image_url}
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}

                      {/* Logo overlay */}
                      <div className="absolute -bottom-6 left-4">
                        {property.logo_url ? (
                          <img
                            src={property.logo_url}
                            alt={property.name}
                            className="w-14 h-14 rounded-lg border-2 border-white dark:border-dark-card shadow-md object-cover bg-white"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center border-2 border-white dark:border-dark-card shadow-md">
                            <span className="text-white font-bold text-lg">
                              {property.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant={property.is_active ? 'success' : 'default'}
                          size="sm"
                        >
                          {property.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-8 px-4 pb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {property.name}
                      </h4>
                      {(property.address_city || property.address_country) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {[property.address_city, property.address_country].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {/* Contact details */}
                      <div className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                        {property.email && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{property.email}</span>
                          </div>
                        )}
                        {property.phone && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{property.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'team-members':
        return id ? <CompanyTeamMembersTab companyId={id} /> : null;

      case 'document-settings':
        return <CompanyDocumentSettingsTab />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!company) {
    return (
      <AuthenticatedLayout>
        <Alert variant="error">Company not found</Alert>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/companies')}>
          <ArrowLeftIcon />
          <span className="ml-2">Back to Companies</span>
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4">
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        </div>
      )}

      <AdminDetailLayout
        navSections={navSections}
        activeId={activeView}
        onNavChange={(id) => setActiveView(id as ViewType)}
        rightSidebar={rightSidebar}
        showRightSidebar
      >
        {renderContent()}
      </AdminDetailLayout>
    </AuthenticatedLayout>
  );
};
