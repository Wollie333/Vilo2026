import { z } from 'zod';
import { propertyTypeSchema } from '../types/property.types';

// ============================================================================
// Helpers - Convert empty strings to undefined for optional fields
// ============================================================================

// Helper to handle empty strings for URL fields
const optionalUrl = (maxLength = 500) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().url().max(maxLength).optional().nullable()
  );

// Helper to handle empty strings for email fields
const optionalEmail = (maxLength = 255) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().email().max(maxLength).optional().nullable()
  );

// ============================================================================
// Listing Detail Schemas
// ============================================================================

// Gallery image schema
const galleryImageSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
  order: z.number().int().nonnegative(),
});

// Promotion schema
const promotionSchema = z.object({
  code: z.string(),
  discount: z.number(),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
});

// ============================================================================
// Property Schemas
// ============================================================================

export const createPropertySchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional().nullable(),
  // Content fields
  long_description: z.string().optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  video_url: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().optional().nullable()
  ),
  show_video: z.boolean().optional(),
  // Address fields
  address_street: z.string().max(255).optional().nullable(),
  address_city: z.string().max(100).optional().nullable(),
  address_state: z.string().max(100).optional().nullable(),
  address_postal_code: z.string().max(20).optional().nullable(),
  address_country: z.string().max(100).optional().nullable(),
  // Contact
  phone: z.string().max(50).optional().nullable(),
  email: optionalEmail(),
  website: optionalUrl(255),
  // Settings
  settings: z.record(z.unknown()).optional(),
  currency: z.string().max(3).optional().nullable(),
});

export const updatePropertySchema = z.object({
  company_id: z.string().uuid('Invalid company ID').optional(),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().max(255).optional(),
  description: z.string().optional().nullable(),
  // Content fields
  long_description: z.string().optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  // Address fields
  address_street: z.string().max(255).optional().nullable(),
  address_city: z.string().max(100).optional().nullable(),
  address_state: z.string().max(100).optional().nullable(),
  address_postal_code: z.string().max(20).optional().nullable(),
  address_country: z.string().max(100).optional().nullable(),
  // Contact
  phone: z.string().max(50).optional().nullable(),
  email: optionalEmail(),
  website: optionalUrl(255),
  // Settings
  settings: z.record(z.unknown()).optional(),
  currency: z.string().max(3).optional().nullable(),
  // Status
  is_active: z.boolean().optional(),

  // ============================================================================
  // Listing Detail Fields
  // ============================================================================

  // Property Type & Categories
  property_type: propertyTypeSchema.optional().nullable(),
  categories: z.array(z.string()).optional(),

  // Location
  country_id: z.string().uuid().optional().nullable(),
  province_id: z.string().uuid().optional().nullable(),
  city_id: z.string().uuid().optional().nullable(),
  location_lat: z.number().optional().nullable(),
  location_lng: z.number().optional().nullable(),

  // Showcase
  listing_title: z.string().max(255).optional().nullable(),
  listing_description: z.string().optional().nullable(),
  highlights: z.array(z.string()).optional(),
  gallery_images: z.array(galleryImageSchema).optional(),
  video_url: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().optional().nullable()
  ),
  show_video: z.boolean().optional(),
  featured_image_url: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().optional().nullable()
  ),

  // Stay Details
  check_in_time: z.string().optional().nullable(),
  check_out_time: z.string().optional().nullable(),
  cancellation_policy: z.string().max(2000).optional().nullable(), // Increased from 100 to 2000 chars
  terms_and_conditions: z.string().optional().nullable(), // Property-specific Terms & Conditions HTML
  amenities: z.array(z.string()).optional(),
  house_rules: z.array(z.string()).optional(),
  whats_included: z.array(z.string()).optional(),

  // Marketing
  promotions: z.array(promotionSchema).optional(),
});

export const propertyIdParamSchema = z.object({
  id: z.string().uuid('Invalid property ID'),
});

export const propertyListQuerySchema = z.object({
  company_id: z.string().uuid().optional(),
  is_active: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});
