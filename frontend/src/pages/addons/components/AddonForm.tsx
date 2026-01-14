/**
 * AddonForm Component
 *
 * Form for creating and editing addons using AdminDetailLayout.
 * Features sectioned navigation similar to RoomWizard but simplified.
 */

import React, { useState, useMemo } from 'react';
import { Card, Select, Alert, Badge, Button, Input, Textarea, ImageUpload } from '@/components/ui';
import { AdminDetailLayout } from '@/components/layout';
import type { AdminNavSection } from '@/components/layout/AdminDetailLayout/AdminDetailLayout.types';
import {
  HiOutlineInformationCircle,
  HiOutlineCurrencyDollar,
  HiOutlineCog,
  HiOutlineCheckCircle,
  HiOutlineHome,
} from 'react-icons/hi';
import type { AddOn, CreateAddOnData, AddonType, AddonPricingType } from '@/types/addon.types';
import type { PropertyWithCompany } from '@/types/property.types';
import { addonService } from '@/services';

// ============================================================================
// Types
// ============================================================================

interface AddonFormProps {
  mode: 'create' | 'edit';
  addon?: AddOn;
  property?: PropertyWithCompany;
  properties?: PropertyWithCompany[];
  onSubmit: (data: CreateAddOnData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface AddonFormData {
  property_id: string;
  name: string;
  description: string;
  type: AddonType;
  price: string;
  pricingType: AddonPricingType;
  currency: string;
  maxQuantity: string;
  isActive: boolean;
  imageUrl: string;
  availableForAllRooms: boolean;
}

type FormSection = 'basic-info' | 'pricing' | 'settings';

// ============================================================================
// Constants
// ============================================================================

const SECTION_CONFIG = [
  {
    id: 'basic-info' as FormSection,
    label: 'Basic Info',
    icon: <HiOutlineInformationCircle className="w-5 h-5" />,
    description: 'Name, description, type',
  },
  {
    id: 'pricing' as FormSection,
    label: 'Pricing',
    icon: <HiOutlineCurrencyDollar className="w-5 h-5" />,
    description: 'Price and pricing model',
  },
  {
    id: 'settings' as FormSection,
    label: 'Settings',
    icon: <HiOutlineCog className="w-5 h-5" />,
    description: 'Quantity, image, availability',
  },
];

const TYPE_OPTIONS = [
  { value: 'service', label: 'Service' },
  { value: 'product', label: 'Product' },
  { value: 'experience', label: 'Experience' },
];

const PRICING_TYPE_OPTIONS = [
  { value: 'per_booking', label: 'Per Booking (one-time fee)' },
  { value: 'per_night', label: 'Per Night' },
  { value: 'per_guest', label: 'Per Guest' },
  { value: 'per_guest_per_night', label: 'Per Guest Per Night' },
];

const CURRENCY_OPTIONS = [
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
];

const DEFAULT_FORM_DATA: Omit<AddonFormData, 'property_id'> = {
  name: '',
  description: '',
  type: 'service',
  price: '',
  pricingType: 'per_booking',
  currency: 'ZAR',
  maxQuantity: '1',
  isActive: true,
  imageUrl: '',
  availableForAllRooms: true,
};

// ============================================================================
// Property Header Component
// ============================================================================

interface PropertyHeaderProps {
  property?: {
    name: string;
    featured_image_url?: string | null;
  };
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({ property }) => {
  if (!property) return null;

  return (
    <div className="p-3 border-b border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-3">
        {property.featured_image_url ? (
          <img
            src={property.featured_image_url}
            alt={property.name}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <HiOutlineHome className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Property</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {property.name}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Completion Status Component
// ============================================================================

interface CompletionStatusProps {
  formData: AddonFormData;
  currentSection: FormSection;
}

const CompletionStatus: React.FC<CompletionStatusProps> = ({
  formData,
  currentSection,
}) => {
  const checkBasicInfo = () => !!formData.name.trim();
  const checkPricing = () => {
    const price = parseFloat(formData.price);
    return !isNaN(price) && price >= 0;
  };
  const checkSettings = () => true; // Settings are optional

  const sections = [
    { label: 'Basic Info', complete: checkBasicInfo(), id: 'basic-info' as FormSection },
    { label: 'Pricing', complete: checkPricing(), id: 'pricing' as FormSection },
    { label: 'Settings', complete: checkSettings(), id: 'settings' as FormSection },
  ];

  const requiredComplete = sections.filter((s) => s.complete).length;
  const totalRequired = 2; // Basic Info and Pricing are required
  const progressPercent = Math.round(
    (Math.min(requiredComplete, totalRequired) / totalRequired) * 100
  );

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card variant="bordered">
        <Card.Header className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Completion Status
            </h3>
            <Badge
              variant={progressPercent === 100 ? 'success' : progressPercent >= 50 ? 'warning' : 'default'}
              size="sm"
            >
              {progressPercent}%
            </Badge>
          </div>
        </Card.Header>
        <Card.Body className="pt-2">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {Math.min(requiredComplete, totalRequired)} of {totalRequired} required sections complete
            </p>
          </div>

          {/* Section Checklist */}
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.label}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  currentSection === section.id
                    ? 'bg-primary/10'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-card'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    section.complete
                      ? 'bg-green-500 text-white'
                      : currentSection === section.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-dark-border text-gray-500'
                  }`}
                >
                  {section.complete ? (
                    <HiOutlineCheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    section.complete
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {section.label}
                  {index === 2 && <span className="text-xs ml-1">(optional)</span>}
                </span>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Quick Tips */}
      <Card variant="gradient">
        <Card.Body className="p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Quick Tips
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Use clear, descriptive names</li>
            <li>• Set competitive pricing for your area</li>
            <li>• Add images to increase bookings</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

// ============================================================================
// Section Components
// ============================================================================

interface BasicInfoSectionProps {
  formData: AddonFormData;
  onChange: (data: Partial<AddonFormData>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, onChange }) => (
  <div className="space-y-6">
    <Input
      label="Name"
      value={formData.name}
      onChange={(e) => onChange({ name: e.target.value })}
      placeholder="e.g., Airport Transfer, Breakfast Package"
      required
      helperText="Give your add-on a clear, descriptive name"
    />

    <Textarea
      label="Description"
      value={formData.description}
      onChange={(e) => onChange({ description: e.target.value })}
      placeholder="Describe what's included in this add-on..."
      rows={3}
      helperText="Help guests understand what they're getting"
    />

    <Select
      label="Type"
      value={formData.type}
      onChange={(e) => onChange({ type: e.target.value as AddonType })}
      options={TYPE_OPTIONS}
      helperText="Categorize your add-on for easier organization"
    />
  </div>
);

interface PricingSectionProps {
  formData: AddonFormData;
  onChange: (data: Partial<AddonFormData>) => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ formData, onChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Input
        label="Price"
        type="number"
        min="0"
        step="0.01"
        value={formData.price}
        onChange={(e) => onChange({ price: e.target.value })}
        placeholder="0.00"
        required
      />

      <Select
        label="Currency"
        value={formData.currency}
        onChange={(e) => onChange({ currency: e.target.value })}
        options={CURRENCY_OPTIONS}
      />
    </div>

    <Select
      label="Pricing Type"
      value={formData.pricingType}
      onChange={(e) => onChange({ pricingType: e.target.value as AddonPricingType })}
      options={PRICING_TYPE_OPTIONS}
      helperText="Determines how the price is calculated based on booking details"
    />

    {/* Pricing explanation */}
    <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HiOutlineInformationCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            How pricing works
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formData.pricingType === 'per_booking' && (
              'A flat fee charged once per booking, regardless of guests or nights.'
            )}
            {formData.pricingType === 'per_night' && (
              'Price multiplied by the number of nights in the booking.'
            )}
            {formData.pricingType === 'per_guest' && (
              'Price multiplied by the number of guests.'
            )}
            {formData.pricingType === 'per_guest_per_night' && (
              'Price multiplied by both the number of guests AND nights.'
            )}
          </p>
        </div>
      </div>
    </div>
  </div>
);

interface SettingsSectionProps {
  formData: AddonFormData;
  onChange: (data: Partial<AddonFormData>) => void;
  addonId?: string;
  onImageUpload: (file: File) => Promise<void>;
  onImageDelete: () => Promise<void>;
  isUploadingImage: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  formData,
  onChange,
  onImageUpload,
  onImageDelete,
  isUploadingImage,
}) => (
  <div className="space-y-6">
    <Input
      label="Maximum Quantity"
      type="number"
      min="1"
      max="100"
      value={formData.maxQuantity}
      onChange={(e) => onChange({ maxQuantity: e.target.value })}
      helperText="How many can a guest select? (1-100)"
    />

    {/* Image Upload */}
    <ImageUpload
      label="Add-on Image (Optional)"
      value={formData.imageUrl || null}
      onUpload={onImageUpload}
      onDelete={onImageDelete}
      shape="rectangle"
      size="lg"
      placeholder="Click or drag to upload an image"
      helperText="Recommended size: 400x300 pixels. Max 5MB."
      loading={isUploadingImage}
    />

    {/* Room availability toggle */}
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Available for all rooms
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          When enabled, this add-on will be available for all rooms in the property
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={formData.availableForAllRooms}
          onChange={(e) => onChange({ availableForAllRooms: e.target.checked })}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    </div>

    {/* Active status toggle */}
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Active</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Only active add-ons are shown to guests during checkout
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => onChange({ isActive: e.target.checked })}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    </div>
  </div>
);

// ============================================================================
// Main AddonForm Component
// ============================================================================

export const AddonForm: React.FC<AddonFormProps> = ({
  mode,
  addon,
  property,
  properties,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  // Initialize form data
  const initialFormData = useMemo((): AddonFormData => {
    if (mode === 'edit' && addon) {
      return {
        property_id: addon.property_id,
        name: addon.name,
        description: addon.description || '',
        type: addon.type,
        price: String(addon.price),
        pricingType: addon.pricing_type,
        currency: addon.currency,
        maxQuantity: String(addon.max_quantity),
        isActive: addon.is_active,
        imageUrl: addon.image_url || '',
        availableForAllRooms: addon.room_ids === null || addon.room_ids.length === 0,
      };
    }

    return {
      property_id: property?.id || '',
      ...DEFAULT_FORM_DATA,
      currency: property?.currency || 'ZAR',
    };
  }, [mode, addon, property]);

  // State
  const [currentSection, setCurrentSection] = useState<FormSection>('basic-info');
  const [formData, setFormData] = useState<AddonFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Get selected property
  const selectedProperty = useMemo(() => {
    if (property) return property;
    if (properties && formData.property_id) {
      return properties.find((p) => p.id === formData.property_id);
    }
    return undefined;
  }, [property, properties, formData.property_id]);

  // Check section completion
  const getSectionStatus = (section: FormSection): boolean => {
    switch (section) {
      case 'basic-info':
        return !!formData.name.trim();
      case 'pricing':
        const price = parseFloat(formData.price);
        return !isNaN(price) && price >= 0;
      case 'settings':
        return true; // Optional
      default:
        return false;
    }
  };

  // Handle form data changes
  const handleChange = (data: Partial<AddonFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Convert file to data URL (for create mode)
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      if (mode === 'edit' && addon?.id) {
        // In edit mode, upload to server immediately
        const imageUrl = await addonService.uploadImage(addon.id, file);
        setFormData((prev) => ({ ...prev, imageUrl }));
      } else {
        // In create mode, convert to data URL and store locally
        const dataUrl = await fileToDataUrl(file);
        setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle image delete
  const handleImageDelete = async () => {
    setIsUploadingImage(true);
    try {
      if (mode === 'edit' && addon?.id) {
        // In edit mode, delete from server
        await addonService.deleteImage(addon.id);
      }
      // Clear the image URL in form data
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Add-on name is required';
    }

    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue < 0) {
      return 'Price must be a valid non-negative number';
    }

    const maxQtyValue = parseInt(formData.maxQuantity, 10);
    if (isNaN(maxQtyValue) || maxQtyValue < 1 || maxQtyValue > 100) {
      return 'Max quantity must be between 1 and 100';
    }

    if (!formData.property_id) {
      return 'Please select a property';
    }

    return null;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const data: CreateAddOnData = {
        property_id: formData.property_id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        price: parseFloat(formData.price),
        pricing_type: formData.pricingType,
        currency: formData.currency,
        max_quantity: parseInt(formData.maxQuantity, 10),
        is_active: formData.isActive,
        image_url: formData.imageUrl.trim() || null,
        room_ids: formData.availableForAllRooms ? null : [],
      };

      await onSubmit(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save add-on';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Show property selector if needed
  const showPropertySelector = mode === 'create' && !property && properties && properties.length > 1;

  if (showPropertySelector && !formData.property_id) {
    return (
      <Card variant="bordered">
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Property
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose which property this add-on belongs to
          </p>
        </Card.Header>
        <Card.Body className="p-6">
          <Select
            label="Property"
            value={formData.property_id}
            onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
            options={[
              { value: '', label: 'Select a property...' },
              ...properties!.map((p) => ({ value: p.id, label: p.name })),
            ]}
            required
          />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Build navigation sections
  const navSections: AdminNavSection[] = [
    {
      title: 'ADD-ON SETUP',
      items: SECTION_CONFIG.map((config) => ({
        id: config.id,
        label: config.label,
        icon: config.icon,
        isComplete: getSectionStatus(config.id),
      })),
    },
  ];

  // Render current section
  const renderSection = () => {
    const sectionConfig = SECTION_CONFIG.find((s) => s.id === currentSection);

    return (
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-dark-border">
          <div className="p-3 bg-primary/10 rounded-xl">
            {sectionConfig?.icon &&
              React.cloneElement(sectionConfig.icon as React.ReactElement, {
                className: 'w-6 h-6 text-primary',
              })}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {sectionConfig?.label}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sectionConfig?.description}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="default" size="sm">
              Section {SECTION_CONFIG.findIndex((s) => s.id === currentSection) + 1} of 3
            </Badge>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Section Content */}
        <Card variant="bordered">
          <Card.Body className="p-6">
            {currentSection === 'basic-info' && (
              <BasicInfoSection formData={formData} onChange={handleChange} />
            )}
            {currentSection === 'pricing' && (
              <PricingSection formData={formData} onChange={handleChange} />
            )}
            {currentSection === 'settings' && (
              <SettingsSection
                formData={formData}
                onChange={handleChange}
                addonId={addon?.id}
                onImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
                isUploadingImage={isUploadingImage}
              />
            )}
          </Card.Body>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
          <div>
            {currentSection !== 'basic-info' && (
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = SECTION_CONFIG.findIndex((s) => s.id === currentSection);
                  if (currentIndex > 0) {
                    setCurrentSection(SECTION_CONFIG[currentIndex - 1].id);
                  }
                }}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {currentSection !== 'settings' ? (
              <Button
                variant="primary"
                onClick={() => {
                  const currentIndex = SECTION_CONFIG.findIndex((s) => s.id === currentSection);
                  if (currentIndex < SECTION_CONFIG.length - 1) {
                    setCurrentSection(SECTION_CONFIG[currentIndex + 1].id);
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={submitting || isLoading}
              >
                {mode === 'create' ? 'Create Add-on' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Property header for sidebar
  const navHeader = selectedProperty ? <PropertyHeader property={selectedProperty} /> : null;

  // Right sidebar with completion status
  const rightSidebar = (
    <CompletionStatus formData={formData} currentSection={currentSection} />
  );

  return (
    <AdminDetailLayout
      navSections={navSections}
      activeId={currentSection}
      onNavChange={(id) => setCurrentSection(id as FormSection)}
      navHeader={navHeader}
      rightSidebar={rightSidebar}
      showRightSidebar={true}
      variant="wide-content"
    >
      {renderSection()}
    </AdminDetailLayout>
  );
};
