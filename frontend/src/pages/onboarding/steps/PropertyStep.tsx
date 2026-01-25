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
import { Input, Textarea, Select, Alert, AddressAutocomplete, ImageUpload, PhoneInput } from '@/components/ui';
import type { AddressData } from '@/components/ui';
import { Mail, Globe } from 'lucide-react';
import { OnboardingFooter } from '../components/OnboardingFooter';
import type { OnboardingPropertyData } from '@/types/onboarding.types';
import { PropertyType, PROPERTY_TYPE_LABELS } from '@/types/property.types';
import { propertyService } from '@/services';

interface PropertyStepProps {
  onSubmit: (data: OnboardingPropertyData) => Promise<void>;
  onSkip: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  initialData?: OnboardingPropertyData;
}

// Generate property type options from enum
const PROPERTY_TYPES = Object.values(PropertyType).map((value) => ({
  value,
  label: PROPERTY_TYPE_LABELS[value],
}));

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
    // Contact information
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    // Address fields
    address_street: initialData?.address_street || '',
    address_city: initialData?.address_city || '',
    address_state: initialData?.address_state || '',
    address_postal_code: initialData?.address_postal_code || '',
    address_country: initialData?.address_country || '',
    // Hierarchical location fields
    country_id: initialData?.country_id,
    province_id: initialData?.province_id,
    city_id: initialData?.city_id,
    location_lat: initialData?.location_lat,
    location_lng: initialData?.location_lng,
  });

  // State for address autocomplete search
  const [addressSearch, setAddressSearch] = useState('');

  // State for image uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Update form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        property_type: initialData.property_type || 'house',
        // Contact information
        phone: initialData.phone || '',
        email: initialData.email || '',
        website: initialData.website || '',
        // Address fields
        address_street: initialData.address_street || '',
        address_city: initialData.address_city || '',
        address_state: initialData.address_state || '',
        address_postal_code: initialData.address_postal_code || '',
        address_country: initialData.address_country || '',
        // Hierarchical location fields
        country_id: initialData.country_id,
        province_id: initialData.province_id,
        city_id: initialData.city_id,
        location_lat: initialData.location_lat,
        location_lng: initialData.location_lng,
      });

      // Set image previews if there are existing images
      if (initialData.logo_url) {
        setLogoPreview(initialData.logo_url);
      }
      if (initialData.featured_image_url) {
        setFeaturedImagePreview(initialData.featured_image_url);
      }
    }
  }, [initialData]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: keyof OnboardingPropertyData, value: string) => {
    // Log address field changes
    if (field.startsWith('address_')) {
      console.log(`[PropertyStep] Address field changed: ${field} = "${value}"`);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    handleChange(e.target.name as keyof OnboardingPropertyData, e.target.value);
  };

  const handleAddressSelect = (address: AddressData) => {
    console.log('[PropertyStep] Address selected from autocomplete:', address);

    setFormData((prev) => ({
      ...prev,
      address_street: address.street || prev.address_street,
      address_city: address.city || prev.address_city,
      address_state: address.state || prev.address_state,
      address_postal_code: address.postal_code || prev.address_postal_code,
      address_country: address.country || prev.address_country,
    }));

    console.log('[PropertyStep] Form data updated with autocomplete address');
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
      console.log('[PropertyStep] Validation failed');
      return;
    }

    console.log('[PropertyStep] === Submitting property data ===');
    console.log('[PropertyStep] Full form data:', JSON.stringify(formData, null, 2));
    console.log('[PropertyStep] Address fields:', {
      street: formData.address_street,
      city: formData.address_city,
      state: formData.address_state,
      postal: formData.address_postal_code,
      country: formData.address_country,
    });

    try {
      // First, save property data and get the property ID from response
      const response = await onSubmit(formData);
      console.log('[PropertyStep] Save successful, property ID:', response?.propertyId);

      // If images selected, upload them using the returned property ID
      if ((logoFile || featuredImageFile) && response?.propertyId) {
        setUploadingImages(true);
        try {
          console.log('[PropertyStep] Uploading property images for ID:', response.propertyId);

          // Upload logo
          if (logoFile) {
            await propertyService.uploadLogo(response.propertyId, logoFile);
            console.log('[PropertyStep] Logo upload successful');
          }

          // Upload featured image
          if (featuredImageFile) {
            await propertyService.uploadFeaturedImage(response.propertyId, featuredImageFile);
            console.log('[PropertyStep] Featured image upload successful');
          }
        } catch (imageErr) {
          console.error('[PropertyStep] Image upload failed:', imageErr);
          // Don't block onboarding if upload fails - user can upload later
        } finally {
          setUploadingImages(false);
        }
      }
    } catch (err) {
      console.error('[PropertyStep] Save failed:', err);
      console.error('[PropertyStep] Error details:', err instanceof Error ? err.stack : 'N/A');
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

        {/* Contact Information section */}
        <div className="border-t border-gray-200 dark:border-dark-border pt-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Contact Information (optional)
          </p>

          <div className="space-y-4">
            <PhoneInput
              label="Phone"
              value={formData.phone || ''}
              onChange={(value) => handleChange('phone', value)}
              placeholder="+27 21 123 4567"
              defaultCountry="ZA"
              disabled={isLoading}
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="bookings@property.com"
              leftIcon={<Mail className="w-5 h-5" />}
              fullWidth
              disabled={isLoading}
            />

            <Input
              label="Website"
              name="website"
              type="url"
              value={formData.website || ''}
              onChange={handleInputChange}
              placeholder="https://www.yourproperty.com"
              leftIcon={<Globe className="w-5 h-5" />}
              fullWidth
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Property Logo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Property Logo (Optional)
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
            size="md"
            disabled={isLoading || uploadingImages}
            showDelete={true}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Upload your property's brand logo (max 5MB)
          </p>
        </div>

        {/* Featured Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Featured Image (Optional)
          </label>
          <ImageUpload
            value={featuredImagePreview}
            onUpload={async (file) => {
              setFeaturedImageFile(file);
              setFeaturedImagePreview(URL.createObjectURL(file));
            }}
            onDelete={async () => {
              setFeaturedImageFile(null);
              setFeaturedImagePreview(null);
            }}
            shape="rectangle"
            size="lg"
            disabled={isLoading || uploadingImages}
            showDelete={true}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Upload a hero image for your property (max 10MB)
          </p>
        </div>

        {/* Address section */}
        <div className="border-t border-gray-200 dark:border-dark-border pt-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Location (optional)
          </p>

          <div className="space-y-4">
            {/* Address Autocomplete */}
            <AddressAutocomplete
              value={addressSearch}
              onChange={handleAddressSelect}
              onInputChange={setAddressSearch}
              placeholder="Search for your property address..."
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
              placeholder="123 Beach Road"
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
                placeholder="Miami"
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
                placeholder="Florida"
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
