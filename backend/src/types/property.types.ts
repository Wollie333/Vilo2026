import { z } from 'zod';

// ============================================================================
// Property Type Enum
// ============================================================================

export enum PropertyType {
  // Core Residential
  HOUSE = 'house',
  APARTMENT = 'apartment',
  VILLA = 'villa',
  CONDO = 'condo',
  TOWNHOUSE = 'townhouse',
  COTTAGE = 'cottage',
  CABIN = 'cabin',

  // Hospitality
  HOTEL = 'hotel',
  LODGE = 'lodge',
  BNB = 'bnb',
  GUEST_HOUSE = 'guesthouse',
  HOSTEL = 'hostel',

  // Unique
  RESORT = 'resort',
  GLAMPING = 'glamping',
  BOUTIQUE = 'boutique',
  OTHER = 'other',
}

// Display labels for property types
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.HOUSE]: 'House',
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.VILLA]: 'Villa',
  [PropertyType.CONDO]: 'Condo',
  [PropertyType.TOWNHOUSE]: 'Townhouse',
  [PropertyType.COTTAGE]: 'Cottage',
  [PropertyType.CABIN]: 'Cabin',
  [PropertyType.HOTEL]: 'Hotel',
  [PropertyType.LODGE]: 'Lodge',
  [PropertyType.BNB]: 'Bed & Breakfast',
  [PropertyType.GUEST_HOUSE]: 'Guest House',
  [PropertyType.HOSTEL]: 'Hostel',
  [PropertyType.RESORT]: 'Resort',
  [PropertyType.GLAMPING]: 'Glamping',
  [PropertyType.BOUTIQUE]: 'Boutique',
  [PropertyType.OTHER]: 'Other',
};

// Zod schema for property type validation
export const propertyTypeSchema = z.nativeEnum(PropertyType);

// ============================================================================
// Property Types
// ============================================================================

// Gallery image structure
export interface GalleryImage {
  url: string;
  caption?: string;
  order: number;
}

// Promotion structure
export interface Promotion {
  code: string;
  discount: number;
  discount_type?: 'percentage' | 'fixed';
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface Property {
  id: string;
  company_id: string | null;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  // Content fields
  long_description: string | null;
  excerpt: string | null;
  featured_image_url: string | null;
  logo_url: string | null;
  // Address fields
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string;
  // Contact
  phone: string | null;
  email: string | null;
  website: string | null;
  // Settings
  settings: Record<string, unknown>;
  currency: string | null;
  // Status
  is_active: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;

  // ============================================================================
  // Listing Details Fields
  // ============================================================================

  // ESSENTIALS
  property_type: string | null;
  categories: string[];
  // Hierarchical location
  country_id: string | null;
  province_id: string | null;
  city_id: string | null;
  location_lat: number | null;
  location_lng: number | null;

  // SHOWCASE
  listing_title: string | null;
  listing_description: string | null;
  highlights: string[];
  gallery_images: GalleryImage[];
  video_url: string | null;
  show_video: boolean;

  // STAY DETAILS
  check_in_time: string | null;
  check_out_time: string | null;
  cancellation_policy: string | null;
  terms_and_conditions: string | null;
  amenities: string[];
  house_rules: string[];
  whats_included: string[];

  // MARKETING
  promotions: Promotion[];

  // PUBLIC LISTING
  is_listed_publicly: boolean | null;
  listed_at: string | null;
  listing_priority: number | null;
}

export interface PropertyWithCompany extends Property {
  company_name: string | null;
  company_logo_url: string | null;
  owner_full_name: string | null;
}

// ============================================================================
// Create/Update DTOs
// ============================================================================

export interface CreatePropertyRequest {
  company_id: string;
  name: string;
  slug?: string; // Will be auto-generated if not provided
  description?: string;
  // Content fields
  long_description?: string;
  excerpt?: string;
  video_url?: string | null;
  show_video?: boolean;
  terms_and_conditions?: string;
  // Address fields
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  // Contact
  phone?: string;
  email?: string;
  website?: string;
  // Settings
  settings?: Record<string, unknown>;
  currency?: string;
}

export interface UpdatePropertyRequest {
  company_id?: string;
  name?: string;
  slug?: string;
  description?: string;
  // Content fields
  long_description?: string;
  excerpt?: string;
  // Address fields
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  // Contact
  phone?: string;
  email?: string;
  website?: string;
  // Settings
  settings?: Record<string, unknown>;
  currency?: string;
  // Status
  is_active?: boolean;

  // Listing Details Fields
  property_type?: string;
  categories?: string[];
  // Hierarchical location
  country_id?: string;
  province_id?: string;
  city_id?: string;
  location_lat?: number;
  location_lng?: number;
  listing_title?: string;
  listing_description?: string;
  highlights?: string[];
  gallery_images?: GalleryImage[];
  video_url?: string | null;
  show_video?: boolean;
  featured_image_url?: string | null;
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
  terms_and_conditions?: string;
  amenities?: string[];
  house_rules?: string[];
  whats_included?: string[];
  promotions?: Promotion[];
  // Public listing fields
  is_listed_publicly?: boolean;
  listed_at?: string;
  listing_priority?: number;
}

// ============================================================================
// List/Filter Params
// ============================================================================

export interface PropertyListParams {
  company_id?: string;
  is_active?: boolean;
  search?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PropertyListResponse {
  properties: PropertyWithCompany[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Limit Check
// ============================================================================

export interface PropertyLimitInfo {
  current_count: number;
  max_allowed: number;
  is_unlimited: boolean;
  can_create: boolean;
  remaining: number;
}
