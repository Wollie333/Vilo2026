/**
 * AddonEditorModal Component
 *
 * Modal for creating or editing add-ons from within the Room Wizard.
 * Provides a streamlined interface for quick add-on management without leaving the wizard.
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Alert,
  ImageUpload,
  Spinner,
} from '@/components/ui';
import { HiOutlineX } from 'react-icons/hi';
import type { AddOn, CreateAddOnData, AddonType, AddonPricingType } from '@/types/addon.types';
import { addonService } from '@/services';
import type { AddonEditorModalProps } from './AddonEditorModal.types';

// ============================================================================
// Constants
// ============================================================================

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

interface FormData {
  name: string;
  description: string;
  type: AddonType;
  price: string;
  pricing_type: AddonPricingType;
  max_quantity: string;
  is_active: boolean;
  image_url: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const AddonEditorModal: React.FC<AddonEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  propertyId,
  currency,
  mode,
  addon,
}) => {
  // Initialize form data
  const getInitialFormData = (): FormData => {
    if (mode === 'edit' && addon) {
      return {
        name: addon.name,
        description: addon.description || '',
        type: addon.type,
        price: String(addon.price),
        pricing_type: addon.pricing_type,
        max_quantity: String(addon.max_quantity),
        is_active: addon.is_active,
        image_url: addon.image_url || '',
      };
    }

    return {
      name: '',
      description: '',
      type: 'service',
      price: '',
      pricing_type: 'per_booking',
      max_quantity: '1',
      is_active: true,
      image_url: '',
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Reset form when modal opens/closes or mode/addon changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setError(null);
    }
  }, [isOpen, mode, addon]);

  // Handle field changes
  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Convert file to data URL
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
        setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      } else {
        // In create mode, convert to data URL and store locally
        const dataUrl = await fileToDataUrl(file);
        setFormData((prev) => ({ ...prev, image_url: dataUrl }));
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
      // Clear the image URL
      setFormData((prev) => ({ ...prev, image_url: '' }));
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

    const maxQtyValue = parseInt(formData.max_quantity, 10);
    if (isNaN(maxQtyValue) || maxQtyValue < 1 || maxQtyValue > 100) {
      return 'Max quantity must be between 1 and 100';
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
      setIsSaving(true);
      setError(null);

      const data: CreateAddOnData = {
        property_id: propertyId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        price: parseFloat(formData.price),
        pricing_type: formData.pricing_type,
        currency: currency,
        max_quantity: parseInt(formData.max_quantity, 10),
        is_active: formData.is_active,
        image_url: formData.image_url.trim() || null,
        room_ids: null, // Available for all rooms by default
      };

      let savedAddon: AddOn;
      if (mode === 'edit' && addon) {
        savedAddon = await addonService.updateAddOn(addon.id, data);
      } else {
        savedAddon = await addonService.createAddOn(data);
      }

      // Call the onSave callback with the saved add-on
      onSave(savedAddon);

      // Close modal
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save add-on';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {mode === 'create' ? 'Create New Add-on' : 'Edit Add-on'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {mode === 'create'
                  ? 'Add a new optional extra for guests'
                  : 'Update add-on details'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              disabled={isSaving}
            >
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h3>

              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Airport Transfer, Breakfast Package"
                required
                fullWidth
              />

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what's included in this add-on..."
                rows={3}
                fullWidth
              />

              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                options={TYPE_OPTIONS}
                fullWidth
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Pricing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-md text-sm text-gray-700 dark:text-gray-300">
                    {currency}
                  </div>
                </div>
              </div>

              <Select
                label="Pricing Type"
                value={formData.pricing_type}
                onChange={(e) => handleChange('pricing_type', e.target.value)}
                options={PRICING_TYPE_OPTIONS}
                helperText="Determines how the price is calculated"
                fullWidth
              />
            </div>

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Settings
              </h3>

              <Input
                label="Maximum Quantity"
                type="number"
                min="1"
                max="100"
                value={formData.max_quantity}
                onChange={(e) => handleChange('max_quantity', e.target.value)}
                helperText="How many can a guest select? (1-100)"
                fullWidth
              />

              <ImageUpload
                label="Add-on Image (Optional)"
                value={formData.image_url || null}
                onUpload={handleImageUpload}
                onDelete={handleImageDelete}
                shape="rectangle"
                size="md"
                placeholder="Click to upload"
                helperText="Max 5MB. Recommended: 400x300px"
                loading={isUploadingImage}
              />

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Active
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Only active add-ons are shown to guests
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border px-6 py-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSaving}
              disabled={isSaving || isUploadingImage}
            >
              {mode === 'create' ? 'Create Add-on' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
