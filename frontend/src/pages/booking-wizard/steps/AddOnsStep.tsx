/**
 * AddOnsStep Component
 *
 * Step 2: Select optional add-ons/extras with quantities
 */

import React from 'react';
import { Button } from '@/components/ui';
import { HiPlus, HiMinus, HiX, HiCheck } from 'react-icons/hi';
import type { AddOnSelection } from '@/types/booking-wizard.types';

interface AddOnsStepProps {
  selectedAddOns: AddOnSelection[];
  availableAddOns: any[];
  onAddOnSelect: (addon: AddOnSelection) => void;
  onAddOnRemove: (addonId: string) => void;
  onQuantityChange: (addonId: string, quantity: number) => void;
  isLoading?: boolean;
  currency: string;
  nights: number;
  totalGuests: number;
  roomCount: number;
}

export const AddOnsStep: React.FC<AddOnsStepProps> = ({
  selectedAddOns,
  availableAddOns,
  onAddOnSelect,
  onAddOnRemove,
  onQuantityChange,
  isLoading = false,
  currency,
  nights,
  totalGuests,
  roomCount,
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log('🎁 [AddOnsStep] Component mounted/updated:', {
      availableAddOnsCount: availableAddOns?.length || 0,
      availableAddOns: availableAddOns,
      selectedAddOnsCount: selectedAddOns?.length || 0,
      nights,
      totalGuests,
      roomCount,
      currency
    });
  }, [availableAddOns, selectedAddOns, nights, totalGuests, roomCount, currency]);
  // Check if add-on is selected
  const isAddOnSelected = (addonId: string) => {
    return selectedAddOns.some((a) => a.addon_id === addonId);
  };

  // Get selected add-on quantity
  const getAddOnQuantity = (addonId: string) => {
    const addon = selectedAddOns.find((a) => a.addon_id === addonId);
    return addon?.quantity || 1;
  };

  // Handle add-on toggle
  const handleToggleAddOn = (addon: any) => {
    if (isAddOnSelected(addon.id)) {
      onAddOnRemove(addon.id);
    } else {
      const quantity = 1;
      const totalPrice = calculateAddOnPrice(addon, quantity);

      const newAddOn: AddOnSelection = {
        addon_id: addon.id,
        addon_name: addon.name,
        pricing_type: addon.pricing_type,
        quantity,
        unit_price: addon.price,
        total_price: totalPrice,
      };
      onAddOnSelect(newAddOn);
    }
  };

  // Calculate add-on price based on type
  const calculateAddOnPrice = (addon: any, quantity: number): number => {
    const basePrice = addon.price;

    switch (addon.pricing_type) {
      case 'per_booking':
        return basePrice * quantity;
      case 'per_night':
        return basePrice * quantity * nights;
      case 'per_guest':
        return basePrice * quantity * totalGuests;
      case 'per_room':
        return basePrice * quantity * roomCount;
      default:
        return basePrice * quantity;
    }
  };

  // Update quantity
  const handleQuantityChange = (addon: any, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (addon.max_quantity && newQuantity > addon.max_quantity) return;

    const totalPrice = calculateAddOnPrice(addon, newQuantity);
    onQuantityChange(addon.id, newQuantity);

    // Update the total price in the selected add-ons
    const selectedAddon = selectedAddOns.find((a) => a.addon_id === addon.id);
    if (selectedAddon) {
      selectedAddon.quantity = newQuantity;
      selectedAddon.total_price = totalPrice;
    }
  };

  // Get pricing explanation
  const getPricingExplanation = (addon: any, quantity: number): string => {
    const basePrice = `${currency} ${addon.price.toLocaleString()}`;
    const total = `${currency} ${calculateAddOnPrice(addon, quantity).toLocaleString()}`;

    switch (addon.pricing_type) {
      case 'per_booking':
        return `${basePrice} × ${quantity} = ${total}`;
      case 'per_night':
        return `${basePrice} × ${quantity} × ${nights} nights = ${total}`;
      case 'per_guest':
        return `${basePrice} × ${quantity} × ${totalGuests} guests = ${total}`;
      case 'per_room':
        return `${basePrice} × ${quantity} × ${roomCount} rooms = ${total}`;
      default:
        return total;
    }
  };

  // Get pricing type label
  const getPricingTypeLabel = (type: string): string => {
    switch (type) {
      case 'per_booking':
        return 'Per Booking';
      case 'per_night':
        return 'Per Night';
      case 'per_guest':
        return 'Per Guest';
      case 'per_room':
        return 'Per Room';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Add Extras to Your Stay
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enhance your experience with optional add-ons. You can skip this step if you don't need any extras.
        </p>
      </div>

      {/* Add-ons List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading available add-ons...</div>
      ) : availableAddOns.length === 0 ? (
        <div className="bg-gray-50 dark:bg-dark-border/20 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No add-ons are currently available for this property.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            You can continue to the next step.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {availableAddOns
            .filter((addon) => addon.is_active)
            .map((addon) => {
              const isSelected = isAddOnSelected(addon.id);
              const quantity = getAddOnQuantity(addon.id);

              return (
                <div
                  key={addon.id}
                  className={`border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => !isSelected && handleToggleAddOn(addon)}
                >
                  <div className={`grid grid-cols-1 ${addon.image_url ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-0`}>
                    {/* Add-on Image */}
                    {addon.image_url && (
                      <div className="aspect-video md:aspect-square bg-gray-200 dark:bg-gray-700">
                        <img
                          src={addon.image_url}
                          alt={addon.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className={`flex items-start gap-4 p-6 ${addon.image_url ? 'md:col-span-2' : ''}`}>
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'border-gray-300 dark:border-dark-border'
                          }`}
                        >
                          {isSelected && <HiCheck className="w-4 h-4 text-white" />}
                        </div>
                      </div>

                      {/* Add-on Details */}
                      <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {addon.name}
                          </h4>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-full">
                            {getPricingTypeLabel(addon.pricing_type)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {currency} {addon.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getPricingTypeLabel(addon.pricing_type).toLowerCase()}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {addon.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {addon.description}
                        </p>
                      )}

                      {/* Quantity Selector (only if selected) */}
                      {isSelected && (
                        <div
                          className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Quantity Controls and Remove Button Row */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Quantity:
                              </span>
                              <button
                                onClick={() => handleQuantityChange(addon, quantity - 1)}
                                disabled={quantity <= 1}
                                className="w-8 h-8 rounded-lg border border-gray-300 dark:border-dark-border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <HiMinus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={quantity}
                                onChange={(e) => handleQuantityChange(addon, parseInt(e.target.value) || 1)}
                                min={1}
                                max={addon.max_quantity || undefined}
                                className="w-16 text-center px-2 py-1 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                              />
                              <button
                                onClick={() => handleQuantityChange(addon, quantity + 1)}
                                disabled={addon.max_quantity && quantity >= addon.max_quantity}
                                className="w-8 h-8 rounded-lg border border-gray-300 dark:border-dark-border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <HiPlus className="w-4 h-4" />
                              </button>
                              {addon.max_quantity && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  (max {addon.max_quantity})
                                </span>
                              )}
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => onAddOnRemove(addon.id)}
                              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove add-on"
                            >
                              <HiX className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Selected Add-ons Summary */}
      {selectedAddOns.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selected Add-ons ({selectedAddOns.length})
          </h4>
          <div className="space-y-3">
            {selectedAddOns.map((addon) => {
              const fullAddon = availableAddOns.find((a) => a.id === addon.addon_id);
              return (
                <div
                  key={addon.addon_id}
                  className="flex items-center justify-between text-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-3"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {addon.addon_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {fullAddon && getPricingExplanation(fullAddon, addon.quantity)}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-gray-900 dark:text-white">
                    {currency} {addon.total_price.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
