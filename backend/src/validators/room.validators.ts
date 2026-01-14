import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const pricingModeEnum = z.enum(['per_unit', 'per_person', 'per_person_sharing']);
export const inventoryModeEnum = z.enum(['single_unit', 'room_type']);
export const bedTypeEnum = z.enum([
  'king', 'queen', 'double', 'twin', 'single',
  'bunk', 'sofa_bed', 'futon', 'crib', 'floor_mattress'
]);
export const addonPricingTypeEnum = z.enum([
  'per_booking', 'per_night', 'per_guest', 'per_guest_per_night'
]);
export const discountTypeEnum = z.enum(['percentage', 'fixed_amount', 'free_nights']);

// ============================================================================
// Param Schemas
// ============================================================================

export const roomIdParamSchema = z.object({
  id: z.string().uuid('Invalid room ID'),
});

export const propertyIdParamSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
});

export const bedIdParamSchema = z.object({
  id: z.string().uuid('Invalid room ID'),
  bedId: z.string().uuid('Invalid bed ID'),
});

export const rateIdParamSchema = z.object({
  id: z.string().uuid('Invalid room ID'),
  rateId: z.string().uuid('Invalid rate ID'),
});

export const promotionIdParamSchema = z.object({
  id: z.string().uuid('Invalid room ID'),
  promotionId: z.string().uuid('Invalid promotion ID'),
});

export const addonIdParamSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  addonId: z.string().uuid('Invalid add-on ID'),
});

// ============================================================================
// Gallery Image Schema
// ============================================================================

const galleryImageSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(255).optional(),
  order: z.number().int().min(0),
});

// ============================================================================
// Room Bed Schemas
// ============================================================================

export const createRoomBedSchema = z.object({
  bed_type: bedTypeEnum,
  quantity: z.number().int().min(1).max(10),
  sleeps: z.number().int().min(1).max(10).optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateRoomBedSchema = z.object({
  bed_type: bedTypeEnum.optional(),
  quantity: z.number().int().min(1).max(10).optional(),
  sleeps: z.number().int().min(1).max(10).optional(),
  sort_order: z.number().int().min(0).optional(),
});

// ============================================================================
// Seasonal Rate Schemas
// ============================================================================

export const createSeasonalRateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  price_per_night: z.number().min(0),
  additional_person_rate: z.number().min(0).optional(),
  pricing_mode_override: pricingModeEnum.optional().nullable(),
  priority: z.number().int().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be on or after start date' }
);

export const updateSeasonalRateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  price_per_night: z.number().min(0).optional(),
  additional_person_rate: z.number().min(0).optional().nullable(),
  pricing_mode_override: pricingModeEnum.optional().nullable(),
  priority: z.number().int().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

// ============================================================================
// Promotion Schemas
// ============================================================================

export const createPromotionSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  discount_type: discountTypeEnum,
  discount_value: z.number().min(0),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional().nullable(),
  max_uses: z.number().int().min(1).optional().nullable(),
  max_uses_per_customer: z.number().int().min(1).optional(),
  min_booking_amount: z.number().min(0).optional().nullable(),
  min_nights: z.number().int().min(1).optional().nullable(),
  is_claimable: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const updatePromotionSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/i).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  discount_type: discountTypeEnum.optional(),
  discount_value: z.number().min(0).optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional().nullable(),
  max_uses: z.number().int().min(1).optional().nullable(),
  max_uses_per_customer: z.number().int().min(1).optional(),
  min_booking_amount: z.number().min(0).optional().nullable(),
  min_nights: z.number().int().min(1).optional().nullable(),
  is_claimable: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// ============================================================================
// Add-On Schemas
// ============================================================================

export const createAddOnSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().min(0),
  pricing_type: addonPricingTypeEnum,
  currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
  room_ids: z.array(z.string().uuid()).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateAddOnSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().min(0).optional(),
  pricing_type: addonPricingTypeEnum.optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
  room_ids: z.array(z.string().uuid()).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
});

// ============================================================================
// Room Schemas
// ============================================================================

export const createRoomSchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),
  name: z.string().min(1, 'Room name is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  room_size_sqm: z.number().min(0).optional().nullable(),

  // Pricing
  pricing_mode: pricingModeEnum.optional(),
  base_price_per_night: z.number().min(0, 'Base price must be >= 0'),
  additional_person_rate: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),

  // Children Pricing
  child_price_per_night: z.number().min(0).optional().nullable(),
  child_free_until_age: z.number().int().min(0).max(18).optional(),
  child_age_limit: z.number().int().min(0).max(18).optional(),

  // Capacity
  max_guests: z.number().int().min(1, 'Max guests must be at least 1'),
  max_adults: z.number().int().min(1).optional().nullable(),
  max_children: z.number().int().min(0).optional().nullable(),

  // Stay Rules
  min_nights: z.number().int().min(1).optional(),
  max_nights: z.number().int().min(1).optional().nullable(),

  // Inventory
  inventory_mode: inventoryModeEnum.optional(),
  total_units: z.number().int().min(1).optional(),

  // Features
  amenities: z.array(z.string().max(100)).optional(),
  extra_options: z.array(z.string().max(100)).optional(),

  // Media
  featured_image: z.string().url().optional().nullable(),
  gallery_images: z.array(galleryImageSchema).optional(),

  // Beds (inline creation)
  beds: z.array(createRoomBedSchema).optional(),

  // Seasonal rates (inline creation)
  seasonal_rates: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    price_per_night: z.number().min(0),
    additional_person_rate: z.number().min(0).optional().nullable(),
    pricing_mode_override: pricingModeEnum.optional().nullable(),
    priority: z.number().int().min(0).max(100).optional(),
    is_active: z.boolean().optional(),
  })).optional(),

  // Promotions (inline creation)
  promotions: z.array(z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    discount_type: discountTypeEnum,
    discount_value: z.number().min(0),
    valid_from: z.string().optional(),
    valid_until: z.string().optional().nullable(),
    max_uses: z.number().int().min(1).optional().nullable(),
    max_uses_per_customer: z.number().int().min(1).optional(),
    min_booking_amount: z.number().min(0).optional().nullable(),
    min_nights: z.number().int().min(1).optional().nullable(),
    is_claimable: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })).optional(),

  // Sort
  sort_order: z.number().int().min(0).optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  room_size_sqm: z.number().min(0).optional().nullable(),

  // Pricing
  pricing_mode: pricingModeEnum.optional(),
  base_price_per_night: z.number().min(0).optional(),
  additional_person_rate: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),

  // Children Pricing
  child_price_per_night: z.number().min(0).optional().nullable(),
  child_free_until_age: z.number().int().min(0).max(18).optional(),
  child_age_limit: z.number().int().min(0).max(18).optional(),

  // Capacity
  max_guests: z.number().int().min(1).optional(),
  max_adults: z.number().int().min(1).optional().nullable(),
  max_children: z.number().int().min(0).optional().nullable(),

  // Stay Rules
  min_nights: z.number().int().min(1).optional(),
  max_nights: z.number().int().min(1).optional().nullable(),

  // Inventory
  inventory_mode: inventoryModeEnum.optional(),
  total_units: z.number().int().min(1).optional(),

  // Features
  amenities: z.array(z.string().max(100)).optional(),
  extra_options: z.array(z.string().max(100)).optional(),

  // Media
  featured_image: z.string().url().optional().nullable(),
  gallery_images: z.array(galleryImageSchema).optional(),

  // Status
  is_active: z.boolean().optional(),

  // Sort
  sort_order: z.number().int().min(0).optional(),
});

export const pauseRoomSchema = z.object({
  reason: z.string().max(500).optional(),
});

// ============================================================================
// Pricing & Availability Schemas
// ============================================================================

export const priceCalculationSchema = z.object({
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).optional(),
  children_ages: z.array(z.number().int().min(0).max(17)).optional(),
}).refine(
  (data) => new Date(data.check_out) > new Date(data.check_in),
  { message: 'Check-out must be after check-in' }
);

export const availabilityCheckSchema = z.object({
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  exclude_booking_id: z.string().uuid().optional(),
}).refine(
  (data) => new Date(data.check_out) > new Date(data.check_in),
  { message: 'Check-out must be after check-in' }
);
