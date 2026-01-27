// ============================================================================
// Room Types
// ============================================================================

import { PaymentRule } from './payment-rules.types';
import { BookingStatus } from './booking.types';

// Enums matching database
export type PricingMode = 'per_unit' | 'per_person' | 'per_person_sharing';
export type InventoryMode = 'single_unit' | 'room_type';
export type BedType =
  | 'king'
  | 'queen'
  | 'double'
  | 'twin'
  | 'single'
  | 'bunk'
  | 'sofa_bed'
  | 'futon'
  | 'crib'
  | 'floor_mattress';
export type AddonPricingType =
  | 'per_booking'
  | 'per_night'
  | 'per_guest'
  | 'per_room'
  | 'per_guest_per_night';

// ============================================================================
// Gallery Image (shared with property)
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
  sleeps?: number;
  sort_order?: number;
}

export interface UpdateRoomBedRequest {
  bed_type?: BedType;
  quantity?: number;
  sleeps?: number;
  sort_order?: number;
}

// ============================================================================
// Seasonal Rate
// ============================================================================

export interface SeasonalRate {
  id: string;
  room_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  price_per_night: number;
  additional_person_rate: number | null;
  pricing_mode_override: PricingMode | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonalRateRequest {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  additional_person_rate?: number;
  pricing_mode_override?: PricingMode;
  priority?: number;
  is_active?: boolean;
}

export interface UpdateSeasonalRateRequest {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  price_per_night?: number;
  additional_person_rate?: number;
  pricing_mode_override?: PricingMode | null;
  priority?: number;
  is_active?: boolean;
}

// ============================================================================
// Room Promotion
// ============================================================================

export interface RoomPromotion {
  id: string;
  room_id: string | null;
  property_id: string | null;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
  discount_value: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  max_uses_per_customer: number;
  current_uses: number;
  min_booking_amount: number | null;
  min_nights: number | null;
  is_claimable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePromotionRequest {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_nights';
  discount_value: number;
  valid_from?: string;
  valid_until?: string;
  max_uses?: number;
  max_uses_per_customer?: number;
  min_booking_amount?: number;
  min_nights?: number;
  is_claimable?: boolean;
  is_active?: boolean;
}

export interface UpdatePromotionRequest {
  code?: string;
  name?: string;
  description?: string;
  discount_type?: 'percentage' | 'fixed_amount' | 'free_nights';
  discount_value?: number;
  valid_from?: string;
  valid_until?: string;
  max_uses?: number;
  max_uses_per_customer?: number;
  min_booking_amount?: number;
  min_nights?: number;
  is_claimable?: boolean;
  is_active?: boolean;
}

// ============================================================================
// Add-On
// ============================================================================

export type AddonType = 'service' | 'product' | 'experience';

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
  created_at: string;
  updated_at: string;
}

export interface CreateAddOnRequest {
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

export interface UpdateAddOnRequest {
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

// ============================================================================
// Availability Block
// ============================================================================

export interface AvailabilityBlock {
  id: string;
  room_id: string;
  block_type: 'maintenance' | 'personal_use' | 'renovation' | 'other';
  reason: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateAvailabilityBlockRequest {
  block_type: 'maintenance' | 'personal_use' | 'renovation' | 'other';
  reason?: string;
  start_date: string;
  end_date: string;
}

export interface UpdateAvailabilityBlockRequest {
  block_type?: 'maintenance' | 'personal_use' | 'renovation' | 'other';
  reason?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// Room (Main Entity)
// ============================================================================

export interface Room {
  id: string;
  property_id: string;

  // Basic Info
  name: string;
  description: string | null;
  room_code: string;
  room_size_sqm: number | null;

  // Pricing Configuration
  pricing_mode: PricingMode;
  base_price_per_night: number;
  additional_person_rate: number;
  currency: string;

  // Children Pricing
  child_price_per_night: number | null;
  child_free_until_age: number;
  child_age_limit: number;

  // Guest Capacity
  max_guests: number;
  max_adults: number | null;
  max_children: number | null;

  // Stay Duration Rules
  min_nights: number;
  max_nights: number | null;

  // Inventory Configuration
  inventory_mode: InventoryMode;
  total_units: number;

  // Features
  amenities: string[];
  extra_options: string[];

  // Media
  featured_image: string | null;
  gallery_images: GalleryImage[];

  // Status
  is_active: boolean;
  is_paused: boolean;
  paused_reason: string | null;
  paused_at: string | null;

  // Completeness tracking
  completeness_score: number;

  // Sort order
  sort_order: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
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
// Create/Update DTOs
// ============================================================================

export interface CreateRoomRequest {
  property_id: string;

  // Basic Info
  name: string;
  description?: string;
  room_size_sqm?: number;

  // Pricing Configuration
  pricing_mode?: PricingMode;
  base_price_per_night: number;
  additional_person_rate?: number;
  currency?: string;

  // Children Pricing
  child_price_per_night?: number;
  child_free_until_age?: number;
  child_age_limit?: number;

  // Guest Capacity
  max_guests: number;
  max_adults?: number;
  max_children?: number;

  // Stay Duration Rules
  min_nights?: number;
  max_nights?: number;

  // Inventory Configuration
  inventory_mode?: InventoryMode;
  total_units?: number;

  // Features
  amenities?: string[];
  extra_options?: string[];

  // Media
  featured_image?: string;
  gallery_images?: GalleryImage[];

  // Beds (can be created inline)
  beds?: CreateRoomBedRequest[];

  // Seasonal rates (can be created inline)
  seasonal_rates?: CreateSeasonalRateRequest[];

  // Promotions (can be created inline)
  promotions?: CreatePromotionRequest[];

  // Sort order
  sort_order?: number;
}

export interface UpdateRoomRequest {
  // Basic Info
  name?: string;
  description?: string;
  room_size_sqm?: number | null;

  // Pricing Configuration
  pricing_mode?: PricingMode;
  base_price_per_night?: number;
  additional_person_rate?: number;
  currency?: string;

  // Children Pricing
  child_price_per_night?: number | null;
  child_free_until_age?: number;
  child_age_limit?: number;

  // Guest Capacity
  max_guests?: number;
  max_adults?: number | null;
  max_children?: number | null;

  // Stay Duration Rules
  min_nights?: number;
  max_nights?: number | null;

  // Inventory Configuration
  inventory_mode?: InventoryMode;
  total_units?: number;

  // Features
  amenities?: string[];
  extra_options?: string[];

  // Media
  featured_image?: string | null;
  gallery_images?: GalleryImage[];

  // Status
  is_active?: boolean;

  // Sort order
  sort_order?: number;
}

export interface PauseRoomRequest {
  reason?: string;
}

// ============================================================================
// List/Filter Params
// ============================================================================

export interface RoomListParams {
  property_id?: string;
  is_active?: boolean;
  is_paused?: boolean;
  pricing_mode?: PricingMode;
  min_price?: number;
  max_price?: number;
  min_guests?: number;
  search?: string;
  sortBy?: 'name' | 'base_price_per_night' | 'created_at' | 'sort_order' | 'completeness_score';
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
  check_in: string;
  check_out: string;
  adults: number;
  children?: number;
  children_ages?: number[];
}

export interface NightlyRate {
  date: string;
  rate: number;
  rate_name: string;
  is_seasonal: boolean;
}

export interface PriceCalculationResponse {
  room_id: string;
  pricing_mode: PricingMode;
  currency: string;
  nightly_rates: NightlyRate[];
  total_nights: number;
  base_room_total: number;
  adult_total: number;
  child_total: number;
  room_total: number;
  breakdown: {
    adults: number;
    children: number;
    paying_children: number;
    free_children: number;
    per_night_average: number;
  };
}

// ============================================================================
// Availability Check
// ============================================================================

export interface AvailabilityCheckRequest {
  check_in: string;
  check_out: string;
  exclude_booking_id?: string;
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
    status: BookingStatus;
  }>;
}

// ============================================================================
// Limit Check
// ============================================================================

export interface RoomLimitInfo {
  current_count: number;
  max_allowed: number;
  is_unlimited: boolean;
  can_create: boolean;
  remaining: number;
}

// ============================================================================
// Effective Price Response (from database function)
// ============================================================================

export interface EffectivePrice {
  price_per_night: number;
  additional_person_rate: number;
  pricing_mode: PricingMode;
  rate_name: string;
  is_seasonal: boolean;
}
