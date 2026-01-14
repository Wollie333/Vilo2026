/**
 * AddonEditorModal
 *
 * Modal for creating and editing add-ons.
 * Includes pricing configuration and room availability settings.
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Alert, Select } from '@/components/ui';
import type { AddOn, CreateAddOnData, AddonType, AddonPricingType } from '@/types/addon.types';

interface AddonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAddOnData) => Promise<void>;
  addon?: AddOn | null;
  propertyId: string;
}

// Type options
const TYPE_OPTIONS = [
  { value: 'service', label: 'Service' },
  { value: 'product', label: 'Product' },
  { value: 'experience', label: 'Experience' },
];

// Pricing type options
const PRICING_TYPE_OPTIONS = [
  { value: 'per_booking', label: 'Per Booking (one-time fee)' },
  { value: 'per_night', label: 'Per Night' },
  { value: 'per_guest', label: 'Per Guest' },
  { value: 'per_guest_per_night', label: 'Per Guest Per Night' },
];

// Currency options
const CURRENCY_OPTIONS = [
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
];

export const AddonEditorModal: React.FC<AddonEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  addon,
  propertyId,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AddonType>('service');
  const [price, setPrice] = useState('');
  const [pricingType, setPricingType] = useState<AddonPricingType>('per_booking');
  const [currency, setCurrency] = useState('ZAR');
  const [maxQuantity, setMaxQuantity] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [availableForAllRooms, setAvailableForAllRooms] = useState(true);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(addon);

  // Reset form when modal opens/closes or addon changes
  useEffect(() => {
    if (isOpen) {
      if (addon) {
        setName(addon.name);
        setDescription(addon.description || '');
        setType(addon.type);
        setPrice(String(addon.price));
        setPricingType(addon.pricing_type);
        setCurrency(addon.currency);
        setMaxQuantity(String(addon.max_quantity));
        setIsActive(addon.is_active);
        setImageUrl(addon.image_url || '');
        setAvailableForAllRooms(addon.room_ids === null || addon.room_ids.length === 0);
      } else {
        setName('');
        setDescription('');
        setType('service');
        setPrice('');
        setPricingType('per_booking');
        setCurrency('ZAR');
        setMaxQuantity('1');
        setIsActive(true);
        setImageUrl('');
        setAvailableForAllRooms(true);
      }
      setError(null);
    }
  }, [isOpen, addon]);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Add-on name is required');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue < 0) {
      setError('Price must be a valid non-negative number');
      return;
    }

    const maxQtyValue = parseInt(maxQuantity, 10);
    if (isNaN(maxQtyValue) || maxQtyValue < 1 || maxQtyValue > 100) {
      setError('Max quantity must be between 1 and 100');
      return;
    }

    setIsSaving(true);
    try {
      const data: CreateAddOnData = {
        property_id: propertyId,
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        price: priceValue,
        pricing_type: pricingType,
        currency,
        max_quantity: maxQtyValue,
        is_active: isActive,
        image_url: imageUrl.trim() || null,
        room_ids: availableForAllRooms ? null : [], // Empty array for now, can be extended for room selection
      };

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save add-on');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header onClose={onClose}>
        {isEditing ? 'Edit Add-on' : 'Create Add-on'}
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-6">
          {error && (
            <Alert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Airport Transfer, Breakfast Package"
              required
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's included in this add-on..."
              rows={2}
            />

            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as AddonType)}
              options={TYPE_OPTIONS}
              helperText="Categorize your add-on for easier organization"
            />
          </div>

          {/* Pricing */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Pricing</h4>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />

              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={CURRENCY_OPTIONS}
              />
            </div>

            <div className="mt-4">
              <Select
                label="Pricing Type"
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as AddonPricingType)}
                options={PRICING_TYPE_OPTIONS}
                helperText="Determines how the price is calculated based on booking details"
              />
            </div>

            {/* Pricing explanation */}
            <div className="mt-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg text-sm text-gray-600 dark:text-gray-400">
              {pricingType === 'per_booking' && (
                <p>A flat fee charged once per booking, regardless of guests or nights.</p>
              )}
              {pricingType === 'per_night' && (
                <p>Price multiplied by the number of nights in the booking.</p>
              )}
              {pricingType === 'per_guest' && (
                <p>Price multiplied by the number of guests.</p>
              )}
              {pricingType === 'per_guest_per_night' && (
                <p>Price multiplied by both the number of guests AND nights.</p>
              )}
            </div>
          </div>

          {/* Quantity & Availability */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Settings</h4>

            <div className="space-y-4">
              <Input
                label="Maximum Quantity"
                type="number"
                min="1"
                max="100"
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(e.target.value)}
                helperText="How many can a guest select? (1-100)"
              />

              <Input
                label="Image URL"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                helperText="Optional image to display with this add-on"
              />

              {/* Room availability toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
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
                    checked={availableForAllRooms}
                    onChange={(e) => setAvailableForAllRooms(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Active status toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Active
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Only active add-ons are shown to guests during checkout
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-dark-border peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} isLoading={isSaving}>
          {isEditing ? 'Save Changes' : 'Create Add-on'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
