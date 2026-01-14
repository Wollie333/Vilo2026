/**
 * AddonsStep Component
 *
 * Step 3 of the booking wizard: Select add-ons.
 */

import React from 'react';
import { Spinner } from '@/components/ui';
import { BookingFooter } from '../components/BookingFooter';
import type { AddonsStepProps, BookingAddonSelection } from '../CreateBookingPage.types';
import type { AddOn } from '@/types/addon.types';
import { ADDON_PRICING_TYPE_LABELS, ADDON_TYPE_LABELS } from '@/types/addon.types';
import { formatCurrency } from '@/types/booking.types';

// ============================================================================
// Icons
// ============================================================================

const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
    />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the price of an addon based on its pricing type
 */
const calculateAddonPrice = (
  addon: AddOn,
  quantity: number,
  nights: number,
  totalGuests: number
): number => {
  const basePrice = addon.price * quantity;

  switch (addon.pricing_type) {
    case 'per_booking':
      return basePrice;
    case 'per_night':
      return basePrice * nights;
    case 'per_guest':
      return basePrice * totalGuests;
    case 'per_guest_per_night':
      return basePrice * totalGuests * nights;
    default:
      return basePrice;
  }
};

/**
 * Get pricing description for display
 */
const getPricingDescription = (addon: AddOn, currency: string): string => {
  const price = formatCurrency(addon.price, currency);
  switch (addon.pricing_type) {
    case 'per_booking':
      return `${price} total`;
    case 'per_night':
      return `${price} / night`;
    case 'per_guest':
      return `${price} / guest`;
    case 'per_guest_per_night':
      return `${price} / guest / night`;
    default:
      return price;
  }
};

// ============================================================================
// Addon Card Component
// ============================================================================

interface AddonCardProps {
  addon: AddOn;
  quantity: number;
  nights: number;
  totalGuests: number;
  currency: string;
  onQuantityChange: (quantity: number) => void;
}

const AddonCard: React.FC<AddonCardProps> = ({
  addon,
  quantity,
  nights,
  totalGuests,
  currency,
  onQuantityChange,
}) => {
  const isSelected = quantity > 0;
  const calculatedPrice = calculateAddonPrice(addon, quantity, nights, totalGuests);

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < addon.max_quantity) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  return (
    <div
      className={`
        p-4 rounded-lg border-2 transition-all duration-200
        ${
          isSelected
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Image or Icon */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {addon.image_url ? (
            <img
              src={addon.image_url}
              alt={addon.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <GiftIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{addon.name}</h4>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {ADDON_TYPE_LABELS[addon.type]}
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-gray-900 dark:text-white">
                {getPricingDescription(addon, currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {ADDON_PRICING_TYPE_LABELS[addon.pricing_type]}
              </p>
            </div>
          </div>

          {addon.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {addon.description}
            </p>
          )}

          {/* Quantity Controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity === 0}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  ${
                    quantity === 0
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                <MinusIcon />
              </button>
              <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= addon.max_quantity}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  ${
                    quantity >= addon.max_quantity
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }
                `}
              >
                <PlusIcon />
              </button>
              {addon.max_quantity > 1 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  max {addon.max_quantity}
                </span>
              )}
            </div>

            {/* Calculated Price */}
            {isSelected && (
              <p className="text-sm font-medium text-primary">
                {formatCurrency(calculatedPrice, currency)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const AddonsStep: React.FC<AddonsStepProps> = ({
  formData,
  onUpdate,
  availableAddons,
  addonsLoading,
  nights,
  totalGuests,
  currency,
  onBack,
  onContinue,
  onCancel,
  isLoading,
}) => {
  // Handle addon quantity change
  const handleAddonQuantityChange = (addon: AddOn, quantity: number) => {
    const existingIndex = formData.addons.findIndex((a) => a.addon_id === addon.id);

    if (quantity === 0) {
      // Remove addon
      onUpdate({
        addons: formData.addons.filter((a) => a.addon_id !== addon.id),
      });
    } else if (existingIndex >= 0) {
      // Update quantity
      const newAddons = [...formData.addons];
      newAddons[existingIndex] = { ...newAddons[existingIndex], quantity };
      onUpdate({ addons: newAddons });
    } else {
      // Add new addon
      const newAddon: BookingAddonSelection = {
        addon_id: addon.id,
        addon,
        quantity,
      };
      onUpdate({ addons: [...formData.addons, newAddon] });
    }
  };

  // Calculate total addons price
  const totalAddonsPrice = formData.addons.reduce((sum, selection) => {
    return sum + calculateAddonPrice(selection.addon, selection.quantity, nights, totalGuests);
  }, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 text-primary items-center justify-center mb-4">
          <GiftIcon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add-ons</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Enhance the stay with optional extras
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {addonsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading add-ons...</p>
          </div>
        ) : availableAddons.length === 0 ? (
          <div className="text-center py-12">
            <GiftIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No add-ons available for this property.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              You can continue without selecting any add-ons.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableAddons.map((addon) => {
              const selectedAddon = formData.addons.find((a) => a.addon_id === addon.id);
              const quantity = selectedAddon?.quantity || 0;

              return (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  quantity={quantity}
                  nights={nights}
                  totalGuests={totalGuests}
                  currency={currency}
                  onQuantityChange={(qty) => handleAddonQuantityChange(addon, qty)}
                />
              );
            })}
          </div>
        )}

        {/* Add-ons Summary */}
        {formData.addons.length > 0 && (
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {formData.addons.length} add-on{formData.addons.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                  {formData.addons.reduce((sum, a) => sum + a.quantity, 0)} total items
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-purple-600 dark:text-purple-400">Add-ons Total</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(totalAddonsPrice, currency)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <BookingFooter
        onCancel={onCancel}
        onContinue={onContinue}
        onBack={onBack}
        showBack
        continueLabel={formData.addons.length > 0 ? 'Continue with Add-ons' : 'Skip Add-ons'}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AddonsStep;
