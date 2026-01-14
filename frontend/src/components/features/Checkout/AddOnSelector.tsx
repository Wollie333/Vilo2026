/**
 * AddOnSelector
 *
 * Component for selecting add-ons during the booking checkout flow.
 * Displays available add-ons and allows quantity selection.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Spinner, Alert } from '@/components/ui';
import { addonService } from '@/services';
import type { AddOn, AddonType } from '@/types/addon.types';
import {
  calculateAddonPrice,
  formatAddonPrice,
  formatPricingType,
  groupAddonsByType,
  filterAddonsByRoom,
  calculateAddonsTotal,
} from '@/utils/addon-pricing';
import { ADDON_TYPE_LABELS } from '@/types/addon.types';

export interface AddOnSelectorProps {
  propertyId: string;
  roomId?: string;
  nights: number;
  guests: number;
  selections: Map<string, number>;
  onSelectionsChange: (selections: Map<string, number>) => void;
}

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ServiceIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ProductIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ExperienceIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const getTypeIcon = (type: AddonType) => {
  switch (type) {
    case 'service':
      return <ServiceIcon />;
    case 'product':
      return <ProductIcon />;
    case 'experience':
      return <ExperienceIcon />;
  }
};

export const AddOnSelector: React.FC<AddOnSelectorProps> = ({
  propertyId,
  roomId,
  nights,
  guests,
  selections,
  onSelectionsChange,
}) => {
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load add-ons
  useEffect(() => {
    const loadAddons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await addonService.getAddOns({
          property_id: propertyId,
          is_active: true,
          sortBy: 'sort_order',
          sortOrder: 'asc',
          limit: 100,
        });
        setAddons(response.addons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load add-ons');
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) {
      loadAddons();
    }
  }, [propertyId]);

  // Filter by room and group by type
  const availableAddons = useMemo(() => {
    let filtered = addons;
    if (roomId) {
      filtered = filterAddonsByRoom(addons, roomId);
    }
    return filtered;
  }, [addons, roomId]);

  const groupedAddons = useMemo(() => {
    return groupAddonsByType(availableAddons);
  }, [availableAddons]);

  // Calculate totals
  const { total } = useMemo(() => {
    return calculateAddonsTotal(availableAddons, selections, nights, guests);
  }, [availableAddons, selections, nights, guests]);

  // Handle selection change
  const handleQuantityChange = (addonId: string, quantity: number, maxQuantity: number) => {
    const newSelections = new Map(selections);
    if (quantity <= 0) {
      newSelections.delete(addonId);
    } else {
      newSelections.set(addonId, Math.min(quantity, maxQuantity));
    }
    onSelectionsChange(newSelections);
  };

  const toggleAddon = (addon: AddOn) => {
    const currentQty = selections.get(addon.id) || 0;
    handleQuantityChange(addon.id, currentQty > 0 ? 0 : 1, addon.max_quantity);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" dismissible onDismiss={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (availableAddons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No add-ons available for this booking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add-ons by type */}
      {Object.entries(groupedAddons).map(([type, typeAddons]) => (
        <div key={type}>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            {getTypeIcon(type as AddonType)}
            {ADDON_TYPE_LABELS[type as AddonType]}s
            <span className="text-xs font-normal text-gray-400">({typeAddons.length})</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {typeAddons.map((addon) => {
              const selectedQty = selections.get(addon.id) || 0;
              const isSelected = selectedQty > 0;
              const calculation = isSelected
                ? calculateAddonPrice(addon, nights, guests, selectedQty)
                : null;

              return (
                <div
                  key={addon.id}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  onClick={() => addon.max_quantity === 1 && toggleAddon(addon)}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                      <CheckIcon />
                    </div>
                  )}

                  {/* Image */}
                  {addon.image_url && (
                    <div className="mb-3 rounded-lg overflow-hidden h-20 bg-gray-100 dark:bg-dark-border">
                      <img
                        src={addon.image_url}
                        alt={addon.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="pr-8">
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                      {addon.name}
                    </h5>
                    {addon.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {addon.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatAddonPrice(addon.price, addon.currency)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        {formatPricingType(addon.pricing_type)}
                      </span>
                    </div>

                    {/* Quantity selector (for max_quantity > 1) */}
                    {addon.max_quantity > 1 && (
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(addon.id, selectedQty - 1, addon.max_quantity)}
                          disabled={selectedQty === 0}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MinusIcon />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                          {selectedQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(addon.id, selectedQty + 1, addon.max_quantity)}
                          disabled={selectedQty >= addon.max_quantity}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Calculated price */}
                  {calculation && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">
                      Subtotal: <span className="font-medium text-gray-900 dark:text-white">{formatAddonPrice(calculation.calculated_price, addon.currency)}</span>
                      {calculation.breakdown.multiplier > 1 && (
                        <span className="ml-1">({calculation.breakdown.multiplier_label})</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Total */}
      {selections.size > 0 && (
        <Card variant="bordered">
          <Card.Body className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selections.size} add-on{selections.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500 dark:text-gray-400">Add-ons total:</span>
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  {formatAddonPrice(total, 'ZAR')}
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default AddOnSelector;
