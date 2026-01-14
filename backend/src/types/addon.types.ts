// ============================================================================
// Add-on Extended Types
// Base types (AddOn, AddonType, AddonPricingType, CreateAddOnRequest, UpdateAddOnRequest)
// are exported from room.types.ts
// ============================================================================

import type { AddonType, AddonPricingType, AddOn } from './room.types';

// Re-export for convenience
export type { AddOn, AddonType, AddonPricingType };

// List/Filter params
export interface AddonListParams {
  property_id?: string;
  type?: AddonType;
  is_active?: boolean;
  room_id?: string;
  search?: string;
  sortBy?: 'name' | 'price' | 'sort_order' | 'type' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Paginated response
export interface AddonListResponse {
  addons: AddOn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Price calculation request
export interface AddonPriceCalculationRequest {
  nights: number;
  guests: number;
  quantity: number;
}

// Price calculation response
export interface AddonPriceCalculation {
  addon_id: string;
  addon_name: string;
  quantity: number;
  unit_price: number;
  calculated_price: number;
  pricing_type: AddonPricingType;
  breakdown: {
    base_price: number;
    multiplier: number;
    multiplier_label: string;
  };
}

// Selected add-on for booking
export interface SelectedAddOn {
  addon_id: string;
  quantity: number;
}

// Add-on with calculated price for checkout summary
export interface AddOnWithCalculatedPrice extends AddOn {
  selected_quantity: number;
  calculated_price: number;
}
