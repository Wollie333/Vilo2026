// ============================================================================
// Property Types
// ============================================================================

import type { GalleryImage } from './room.types';

// Re-export GalleryImage for components that use property.types
export type { GalleryImage } from './room.types';

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

export interface CreatePropertyData {
  company_id: string;
  name: string;
  slug?: string;
  description?: string;
  // Content fields
  long_description?: string;
  excerpt?: string;
  video_url?: string | null;
  show_video?: boolean;
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

export interface UpdatePropertyData {
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
  amenities?: string[];
  house_rules?: string[];
  whats_included?: string[];
  promotions?: Promotion[];
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
// Limit Info
// ============================================================================

export interface PropertyLimitInfo {
  current_count: number;
  max_allowed: number;
  is_unlimited: boolean;
  can_create: boolean;
  remaining: number;
}
