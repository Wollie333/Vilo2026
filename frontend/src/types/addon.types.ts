// ============================================================================
// Add-on Types
// ============================================================================

// Enums
export type AddonType = 'service' | 'product' | 'experience';
export type AddonPricingType = 'per_booking' | 'per_night' | 'per_guest' | 'per_guest_per_night';

// Main entity
export interface AddOn {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  price: number;
  pricing_type: AddonPricingType;
  currency: string;
  type: AddonType;
  max_quantity: number;
  is_active: boolean;
  room_ids: string[] | null;
  image_url: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

// Create DTO
export interface CreateAddOnData {
  property_id: string;
  name: string;
  description?: string;
  price: number;
  pricing_type: AddonPricingType;
  currency?: string;
  type: AddonType;
  max_quantity?: number;
  is_active?: boolean;
  room_ids?: string[] | null;
  image_url?: string | null;
  sort_order?: number;
}

// Update DTO
export interface UpdateAddOnData {
  name?: string;
  description?: string;
  price?: number;
  pricing_type?: AddonPricingType;
  currency?: string;
  type?: AddonType;
  max_quantity?: number;
  is_active?: boolean;
  room_ids?: string[] | null;
  image_url?: string | null;
  sort_order?: number;
}

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

// Helper type labels
export const ADDON_TYPE_LABELS: Record<AddonType, string> = {
  service: 'Service',
  product: 'Product',
  experience: 'Experience',
};

export const ADDON_PRICING_TYPE_LABELS: Record<AddonPricingType, string> = {
  per_booking: 'Per Booking',
  per_night: 'Per Night',
  per_guest: 'Per Guest',
  per_guest_per_night: 'Per Guest/Night',
};
