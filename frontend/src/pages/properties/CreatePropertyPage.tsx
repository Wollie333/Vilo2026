/**
 * CreatePropertyPage Component
 *
 * Form to create a new property with 3-column layout.
 * Matches the design pattern of other detail pages.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { AdminDetailLayout } from '@/components/layout/AdminDetailLayout';
import type { AdminNavSection } from '@/components/layout/AdminDetailLayout';
import {
  Card,
  Button,
  Alert,
  Input,
  Textarea,
  Select,
  Spinner,
  Badge,
} from '@/components/ui';
import { AddressField } from '@/components/features';
import { propertyService, companyService } from '@/services';
import type { CreatePropertyData, PropertyLimitInfo } from '@/types/property.types';
import type { CompanyWithPropertyCount } from '@/types/company.types';
import type { AddressData } from '@/types/location.types';

// Types
type ViewType = 'info' | 'description' | 'address' | 'contact';

// Currency options
const currencyOptions = [
  { value: '', label: 'Inherit from company' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
];

// Icons
const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const BuildingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

export const CreatePropertyPage: React.FC = () => {
  const navigate = useNavigate();

  // Page state
  const [activeView, setActiveView] = useState<ViewType>('info');
  const [companies, setCompanies] = useState<CompanyWithPropertyCount[]>([]);
  const [limitInfo, setLimitInfo] = useState<PropertyLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePropertyData>({
    company_id: '',
    name: '',
    slug: '',
    description: '',
    long_description: '',
    excerpt: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
    address_country: '',
    phone: '',
    email: '',
    website: '',
    currency: '',
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

  // Load companies and limit info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [companiesRes, limitRes] = await Promise.all([
          companyService.getMyCompanies({ is_active: true }),
          propertyService.getPropertyLimit(),
        ]);
        setCompanies(companiesRes.companies);
        setLimitInfo(limitRes);

        // Pre-select first company if only one
        if (companiesRes.companies.length === 1) {
          setFormData((prev) => ({ ...prev, company_id: companiesRes.companies[0].id }));
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form field changes
  const handleChange = useCallback((field: keyof CreatePropertyData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle address changes from AddressField
  const handleAddressChange = useCallback((data: AddressData) => {
    setAddressData(data);
    // Map AddressData to CreatePropertyData address fields
    const streetAddress = [data.street_address, data.street_address_2].filter(Boolean).join(', ');
    setFormData((prev) => ({
      ...prev,
      address_street: streetAddress,
      address_city: data.city || '',
      address_state: data.province || '',
      address_postal_code: data.postal_code || '',
      address_country: data.country || '',
    }));
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle name change - auto-generate slug
  const handleNameChange = useCallback((name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_id) {
      setError('Please select a company');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter a property name');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const property = await propertyService.createProperty({
        ...formData,
        slug: formData.slug || undefined,
      });

      navigate(`/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setSaving(false);
    }
  };

  // Build company options
  const companyOptions = [
    { value: '', label: 'Select a company' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Navigation sections
  const navSections: AdminNavSection[] = [
    {
      title: 'DETAILS',
      items: [
        { id: 'info', label: 'Basic Info', icon: <InfoIcon /> },
        { id: 'description', label: 'Description', icon: <DocumentIcon /> },
        { id: 'address', label: 'Address', icon: <HomeIcon /> },
        { id: 'contact', label: 'Contact', icon: <PhoneIcon /> },
      ],
    },
  ];

  // Calculate completion status
  const getCompletionStatus = () => {
    return {
      info: !!(formData.name && formData.company_id),
      description: !!(formData.description || formData.long_description),
      address: !!(formData.address_city),
      contact: !!(formData.email || formData.phone),
    };
  };

  const completionStatus = getCompletionStatus();

  // Right sidebar - Property Preview
  const rightSidebar = (
    <div className="space-y-6">
      {/* Preview Card */}
      <Card variant="bordered" className="overflow-hidden">
        {/* Green Banner */}
        <div className="h-24 bg-gradient-to-br from-primary to-primary-600 relative">
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white dark:border-dark-card shadow-lg">
              <BuildingIcon className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="pt-12 pb-4 px-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formData.name || 'New Property'}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="default" size="sm">
              Draft
            </Badge>
            {formData.slug && (
              <span className="text-sm text-gray-500 dark:text-gray-400">/{formData.slug}</span>
            )}
          </div>
          {formData.excerpt && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {formData.excerpt}
            </p>
          )}
        </div>
      </Card>

      {/* Completion Status */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Completion Status
          </h3>
        </Card.Header>
        <Card.Body className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Basic Info</span>
            <Badge variant={completionStatus.info ? 'success' : 'warning'} size="sm">
              {completionStatus.info ? 'Complete' : 'Required'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Description</span>
            <Badge variant={completionStatus.description ? 'success' : 'default'} size="sm">
              {completionStatus.description ? 'Complete' : 'Optional'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Address</span>
            <Badge variant={completionStatus.address ? 'success' : 'default'} size="sm">
              {completionStatus.address ? 'Complete' : 'Optional'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Contact</span>
            <Badge variant={completionStatus.contact ? 'success' : 'default'} size="sm">
              {completionStatus.contact ? 'Complete' : 'Optional'}
            </Badge>
          </div>
        </Card.Body>
      </Card>

      {/* Help Card */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tips
          </h3>
        </Card.Header>
        <Card.Body>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>You can add images after creating the property</li>
            <li>All optional fields can be edited later</li>
            <li>Property will be created as active by default</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout title="Create Property" subtitle="Add a new property">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // No companies available
  if (companies.length === 0) {
    return (
      <AuthenticatedLayout title="Create Property" subtitle="Add a new property">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/manage/properties')} className="mb-6">
            <ArrowLeftIcon />
            <span className="ml-2">Back to Properties</span>
          </Button>

          <Alert variant="warning" className="mb-6">
            You need to create a company before you can add properties.
          </Alert>

          <Card>
            <Card.Body className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                No Companies Available
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Properties must be associated with a company. Please create a company first.
              </p>
              <Button onClick={() => navigate('/companies/new')}>Create Company</Button>
            </Card.Body>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Limit reached
  if (limitInfo && !limitInfo.can_create) {
    return (
      <AuthenticatedLayout title="Create Property" subtitle="Add a new property">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/manage/properties')} className="mb-6">
            <ArrowLeftIcon />
            <span className="ml-2">Back to Properties</span>
          </Button>

          <Alert variant="warning">
            You have reached your property limit ({limitInfo.max_allowed}). Please upgrade your plan
            to create more properties.
          </Alert>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'info':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Required property details
                </p>
              </div>

              <Select
                label="Company"
                value={formData.company_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleChange('company_id', e.target.value)
                }
                options={companyOptions}
                required
                fullWidth
              />

              <Input
                label="Property Name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Beach House Villa"
                required
                fullWidth
              />

              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="beach-house-villa"
                helperText="URL-friendly identifier (auto-generated if left empty)"
                fullWidth
              />

              <Select
                label="Currency"
                value={formData.currency || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleChange('currency', e.target.value)
                }
                options={currencyOptions}
                helperText="Leave empty to use company's currency"
                fullWidth
              />
            </div>
          </Card>
        );

      case 'description':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Marketing content for your property
                </p>
              </div>

              <Input
                label="Excerpt"
                value={formData.excerpt || ''}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                placeholder="A short summary for listings and cards"
                helperText={`${(formData.excerpt || '').length}/500 characters`}
                maxLength={500}
                fullWidth
              />

              <Textarea
                label="Short Description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of your property..."
                helperText="Used in search results and property cards"
                rows={3}
              />

              <Textarea
                label="Full Description"
                value={formData.long_description || ''}
                onChange={(e) => handleChange('long_description', e.target.value)}
                placeholder="Detailed description of your property including amenities, location highlights, and unique features..."
                helperText="Displayed on the property detail page"
                rows={8}
              />
            </div>
          </Card>
        );

      case 'address':
        return (
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Address</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Property location</p>
              </div>

              <AddressField value={addressData} onChange={handleAddressChange} disabled={saving} />
            </div>
          </Card>
        );

      case 'contact':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contact Information
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Property contact details
                </p>
              </div>

              <Input
                label="Phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+27 21 123 4567"
                fullWidth
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="bookings@property.com"
                    className="pl-10"
                    fullWidth
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Website
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <Input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://www.yourproperty.com"
                    className="pl-10"
                    fullWidth
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout title="Create Property" subtitle="Add a new property to your portfolio">
      {/* Error Alert */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/manage/properties')} className="mb-6">
        <ArrowLeftIcon />
        <span className="ml-2">Back to Properties</span>
      </Button>

      <form onSubmit={handleSubmit}>
        <AdminDetailLayout
          navSections={navSections}
          activeId={activeView}
          onNavChange={(id) => setActiveView(id as ViewType)}
          rightSidebar={rightSidebar}
        >
          {renderContent()}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
            <Button type="button" variant="outline" onClick={() => navigate('/manage/properties')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Create Property
            </Button>
          </div>
        </AdminDetailLayout>
      </form>
    </AuthenticatedLayout>
  );
};
