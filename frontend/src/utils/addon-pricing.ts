/**
 * Add-on Pricing Utilities
 *
 * Helper functions for calculating add-on prices in the checkout flow.
 */

import type { AddOn, AddonPricingType, AddonPriceCalculation } from '@/types/addon.types';

/**
 * Calculate the total price for an add-on based on pricing type
 */
export function calculateAddonPrice(
  addon: AddOn,
  nights: number,
  guests: number,
  quantity: number
): AddonPriceCalculation {
  const basePrice = addon.price * quantity;
  let multiplier = 1;
  let multiplierLabel = 'per booking';
  let calculatedPrice = basePrice;

  switch (addon.pricing_type) {
    case 'per_booking':
      // Flat fee once per booking
      calculatedPrice = basePrice;
      multiplierLabel = 'per booking';
      break;

    case 'per_night':
      // Price multiplied by number of nights
      multiplier = nights;
      calculatedPrice = basePrice * nights;
      multiplierLabel = `× ${nights} night${nights !== 1 ? 's' : ''}`;
      break;

    case 'per_guest':
      // Price multiplied by number of guests
      multiplier = guests;
      calculatedPrice = basePrice * guests;
      multiplierLabel = `× ${guests} guest${guests !== 1 ? 's' : ''}`;
      break;

    case 'per_guest_per_night':
      // Price multiplied by both guests AND nights
      multiplier = guests * nights;
      calculatedPrice = basePrice * guests * nights;
      multiplierLabel = `× ${guests} guest${guests !== 1 ? 's' : ''} × ${nights} night${nights !== 1 ? 's' : ''}`;
      break;
  }

  return {
    addon_id: addon.id,
    addon_name: addon.name,
    quantity,
    unit_price: addon.price,
    calculated_price: calculatedPrice,
    pricing_type: addon.pricing_type,
    breakdown: {
      base_price: basePrice,
      multiplier,
      multiplier_label: multiplierLabel,
    },
  };
}

/**
 * Format pricing type for display
 */
export function formatPricingType(pricingType: AddonPricingType): string {
  const labels: Record<AddonPricingType, string> = {
    per_booking: 'per booking',
    per_night: 'per night',
    per_guest: 'per guest',
    per_guest_per_night: 'per guest/night',
  };
  return labels[pricingType];
}

/**
 * Format price with currency
 */
export function formatAddonPrice(price: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Get pricing type description
 */
export function getPricingTypeDescription(pricingType: AddonPricingType): string {
  const descriptions: Record<AddonPricingType, string> = {
    per_booking: 'A flat fee charged once per booking',
    per_night: 'Price multiplied by the number of nights',
    per_guest: 'Price multiplied by the number of guests',
    per_guest_per_night: 'Price multiplied by guests and nights',
  };
  return descriptions[pricingType];
}

/**
 * Calculate total for multiple selected add-ons
 */
export function calculateAddonsTotal(
  addons: AddOn[],
  selections: Map<string, number>,
  nights: number,
  guests: number
): {
  calculations: AddonPriceCalculation[];
  total: number;
} {
  const calculations: AddonPriceCalculation[] = [];
  let total = 0;

  for (const addon of addons) {
    const quantity = selections.get(addon.id);
    if (quantity && quantity > 0) {
      const calculation = calculateAddonPrice(addon, nights, guests, quantity);
      calculations.push(calculation);
      total += calculation.calculated_price;
    }
  }

  return { calculations, total };
}

/**
 * Check if an add-on is available for a specific room
 */
export function isAddonAvailableForRoom(addon: AddOn, roomId: string): boolean {
  // If room_ids is null or empty, available for all rooms
  if (addon.room_ids === null || addon.room_ids.length === 0) {
    return true;
  }
  // Otherwise, check if the room is in the list
  return addon.room_ids.includes(roomId);
}

/**
 * Filter add-ons by room availability
 */
export function filterAddonsByRoom(addons: AddOn[], roomId: string): AddOn[] {
  return addons.filter((addon) => isAddonAvailableForRoom(addon, roomId));
}

/**
 * Group add-ons by type
 */
export function groupAddonsByType(addons: AddOn[]): Record<string, AddOn[]> {
  return addons.reduce(
    (groups, addon) => {
      const type = addon.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(addon);
      return groups;
    },
    {} as Record<string, AddOn[]>
  );
}
