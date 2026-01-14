// ============================================================================
// Room Types
// ============================================================================

import type { PaymentRule } from './payment-rules.types';

// Enums matching backend/database
export type PricingMode = 'per_unit' | 'per_person' | 'per_person_sharing';
export type InventoryMode = 'single_unit' | 'room_type';
export type BedType = 'single' | 'twin' | 'double' | 'queen' | 'king' | 'bunk' | 'sofa_bed' | 'futon' | 'floor_mattress' | 'crib';
export type AddonPricingType = 'per_booking' | 'per_night' | 'per_person' | 'per_person_per_night';

// ============================================================================
// Gallery Image
// ============================================================================

export interface GalleryImage {
  url: string;
  caption?: string;
  order: number;
}

// ============================================================================
// Room Bed
// ============================================================================

export interface RoomBed {
  id: string;
  room_id: string;
  bed_type: BedType;
  quantity: number;
  sleeps: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomBedRequest {
  bed_type: BedType;
  quantity: number;
  label?: string;
}

export interface UpdateRoomBedRequest {
  bed_type?: BedType;
  quantity?: number;
  label?: string;
}

// ============================================================================
// Seasonal Rate
// ============================================================================

export interface SeasonalRate {
  id: string;
  room_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  price_per_night: number;
  additional_person_rate?: number | null;
  child_price_per_night?: number | null;
  min_nights?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonalRateRequest {
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  additional_person_rate?: number;
  child_price_per_night?: number;
  min_nights?: number;
  is_active?: boolean;
}

export interface UpdateSeasonalRateRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  price_per_night?: number;
  additional_person_rate?: number;
  child_price_per_night?: number;
  min_nights?: number;
  is_active?: boolean;
}

// ============================================================================
// Room Promotion
// ============================================================================

export interface RoomPromotion {
  id: string;
  room_id: string;
  code: string;
  name: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
  discount_value: number;
  min_nights?: number | null;
  max_uses?: number | null;
  current_uses: number;  // Database field name (number of times used)
  valid_from?: string | null;  // Database field name
  valid_until?: string | null;  // Database field name
  is_active: boolean;
  room_count?: number;  // From promotions_with_room_count view
  created_at: string;
  updated_at: string;
}

export interface CreateRoomPromotionRequest {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
  discount_value: number;
  min_nights?: number;
  max_uses?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface UpdateRoomPromotionRequest {
  code?: string;
  name?: string;
  description?: string;
  discount_type?: 'percentage' | 'fixed_amount' | 'free_nights';
  discount_value?: number;
  min_nights?: number;
  max_uses?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

// ============================================================================
// Add-On
// ============================================================================

export interface AddOn {
  id: string;
  property_id: string;
  name: string;
  description?: string | null;
  price: number;
  pricing_type: AddonPricingType;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAddOnRequest {
  name: string;
  description?: string;
  price: number;
  pricing_type: AddonPricingType;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
}

export interface UpdateAddOnRequest {
  name?: string;
  description?: string;
  price?: number;
  pricing_type?: AddonPricingType;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
}

// ============================================================================
// Availability Block
// ============================================================================

export interface AvailabilityBlock {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface CreateAvailabilityBlockRequest {
  start_date: string;
  end_date: string;
  reason?: string;
}

// ============================================================================
// Room
// ============================================================================

export interface Room {
  id: string;
  property_id: string;
  name: string;
  description?: string | null;
  room_code: string;

  // Pricing
  pricing_mode: PricingMode;
  base_price_per_night: number;
  additional_person_rate?: number | null;
  currency: string;

  // Children pricing
  child_price_per_night?: number | null;
  child_free_until_age?: number | null;
  child_age_limit?: number | null;

  // Capacity
  max_guests: number;
  max_adults?: number | null;
  max_children?: number | null;

  // Booking rules
  min_nights: number;
  max_nights?: number | null;

  // Inventory
  inventory_mode: InventoryMode;
  total_units: number;

  // Features
  amenities: string[];
  extra_options?: Record<string, unknown> | null;

  // Media
  featured_image?: string | null;
  gallery_images: GalleryImage[];

  // Size
  room_size_sqm?: number | null;

  // Status
  is_active: boolean;
  is_paused: boolean;
  paused_reason?: string | null;
  paused_at?: string | null;

  // Completeness
  completeness_score: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface RoomWithDetails extends Room {
  beds: RoomBed[];
  seasonal_rates: SeasonalRate[];
  promotions: RoomPromotion[];
  payment_rules: PaymentRule[];
  property_name?: string;
  property_slug?: string;
}

// ============================================================================
// Room Create/Update DTOs
// ============================================================================

export interface CreateRoomRequest {
  property_id: string;
  name: string;
  description?: string;

  // Pricing
  pricing_mode?: PricingMode;
  base_price_per_night: number;
  additional_person_rate?: number;
  currency?: string;

  // Children pricing
  child_price_per_night?: number;
  child_free_until_age?: number;
  child_age_limit?: number;

  // Capacity
  max_guests: number;
  max_adults?: number;
  max_children?: number;

  // Booking rules
  min_nights?: number;
  max_nights?: number;

  // Inventory
  inventory_mode?: InventoryMode;
  total_units?: number;

  // Features
  amenities?: string[];
  extra_options?: Record<string, unknown>;

  // Media
  featured_image?: string;
  gallery_images?: GalleryImage[];

  // Size
  room_size_sqm?: number;

  // Beds (can be created inline)
  beds?: {
    bed_type: BedType;
    quantity: number;
    sleeps?: number;
    sort_order?: number;
  }[];

  // Seasonal rates (can be created inline)
  seasonal_rates?: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    price_per_night: number;
    additional_person_rate?: number;
    is_active?: boolean;
  }[];

  // Promotions (can be created inline)
  promotions?: {
    code: string;
    name: string;
    description?: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
    discount_value: number;
    valid_from?: string;
    valid_until?: string;
    max_uses?: number;
    min_nights?: number;
    is_active?: boolean;
  }[];
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;

  // Pricing
  pricing_mode?: PricingMode;
  base_price_per_night?: number;
  additional_person_rate?: number;
  currency?: string;

  // Children pricing
  child_price_per_night?: number;
  child_free_until_age?: number;
  child_age_limit?: number;

  // Capacity
  max_guests?: number;
  max_adults?: number;
  max_children?: number;

  // Booking rules
  min_nights?: number;
  max_nights?: number;

  // Inventory
  inventory_mode?: InventoryMode;
  total_units?: number;

  // Features
  amenities?: string[];
  extra_options?: Record<string, unknown>;

  // Media
  featured_image?: string;
  gallery_images?: GalleryImage[];

  // Size
  room_size_sqm?: number;

  // Status
  is_active?: boolean;
}

// ============================================================================
// List/Filter Params
// ============================================================================

export interface RoomListParams {
  property_id?: string;
  is_active?: boolean;
  is_paused?: boolean;
  search?: string;
  pricing_mode?: PricingMode;
  min_price?: number;
  max_price?: number;
  min_guests?: number;
  sortBy?: 'name' | 'base_price_per_night' | 'max_guests' | 'created_at' | 'completeness_score';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RoomListResponse {
  rooms: RoomWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Pricing Calculation
// ============================================================================

export interface PriceCalculationRequest {
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children?: number;
  children_ages?: number[];
  coupon_code?: string;
}

export interface NightlyRate {
  date: string;
  rate: number;
  is_seasonal: boolean;
  seasonal_rate_name?: string;
}

export interface PriceCalculationResponse {
  base_total: number;
  nightly_rates: NightlyRate[];
  adults_total: number;
  children_total: number;
  subtotal: number;
  discount_amount: number;
  discount_description?: string;
  total: number;
  currency: string;
  nights: number;
}

// ============================================================================
// Availability Check
// ============================================================================

export interface AvailabilityCheckRequest {
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  units_requested?: number;
}

export interface AvailabilityCheckResponse {
  room_id: string;
  is_available: boolean;
  available_units: number;
  total_units: number;
  conflicting_bookings: Array<{
    booking_id: string;
    booking_reference: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    status: string;
    unit_number?: number;
  }>;
}

// ============================================================================
// Room Limit Info
// ============================================================================

export interface RoomLimitInfo {
  current_count: number;
  max_allowed: number;
  is_unlimited: boolean;
  can_create: boolean;
  remaining: number;
}

// ============================================================================
// Pause/Unpause
// ============================================================================

export interface PauseRoomRequest {
  reason?: string;
}

// ============================================================================
// Bed Type Labels (for UI)
// ============================================================================

export const BED_TYPE_LABELS: Record<BedType, string> = {
  single: 'Single Bed',
  twin: 'Twin Bed',
  double: 'Double Bed',
  queen: 'Queen Bed',
  king: 'King Bed',
  bunk: 'Bunk Bed',
  sofa_bed: 'Sofa Bed',
  futon: 'Futon',
  floor_mattress: 'Floor Mattress',
  crib: 'Crib',
};

export const PRICING_MODE_LABELS: Record<PricingMode, string> = {
  per_unit: 'Per Night',
  per_person: 'Per Person',
  per_person_sharing: 'Per Person Sharing',
};

export const PRICING_MODE_DESCRIPTIONS: Record<PricingMode, string> = {
  per_unit: 'A flat rate for the entire room, regardless of the number of guests',
  per_person: 'Price calculated per guest (adults and children separately)',
  per_person_sharing: 'Base rate plus additional charge per extra guest',
};

export const INVENTORY_MODE_LABELS: Record<InventoryMode, string> = {
  single_unit: 'Single Unit',
  room_type: 'Room Type (multiple units)',
};

export const ADDON_PRICING_TYPE_LABELS: Record<AddonPricingType, string> = {
  per_booking: 'Per Booking',
  per_night: 'Per Night',
  per_person: 'Per Person',
  per_person_per_night: 'Per Person Per Night',
};

// ============================================================================
// Default Amenities List
// ============================================================================

export const DEFAULT_AMENITIES = [
  'Air Conditioning',
  'Heating',
  'WiFi',
  'TV',
  'Mini Fridge',
  'Coffee Maker',
  'Safe',
  'Hairdryer',
  'Iron',
  'Balcony',
  'Sea View',
  'Garden View',
  'Pool View',
  'Mountain View',
  'Private Bathroom',
  'Shared Bathroom',
  'Bathtub',
  'Shower',
  'Toiletries',
  'Towels',
  'Bed Linen',
  'Desk',
  'Wardrobe',
  'Blackout Curtains',
  'Soundproof',
  'Non-smoking',
  'Smoking Allowed',
  'Pet Friendly',
  'Wheelchair Accessible',
  'Kitchenette',
];
