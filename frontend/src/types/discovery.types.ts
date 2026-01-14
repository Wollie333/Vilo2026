/**
 * Discovery/Directory Types (Frontend)
 */

import type { Review } from './review.types';

export interface PropertySearchFilters {
  // Location filters
  country_id?: string;
  province_id?: string;
  city_id?: string;

  // Date filters
  checkIn?: string; // ISO date string
  checkOut?: string; // ISO date string

  // Guest filters
  guests?: number;

  // Category/amenity filters
  categories?: string[];
  amenities?: string[];

  // Price filters
  priceMin?: number;
  priceMax?: number;

  // Keyword search
  keyword?: string;

  // Sorting
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';

  // Pagination
  page?: number;
  limit?: number;
}

export interface PublicPropertySummary {
  id: string;
  slug: string;
  name: string;
  listing_title: string | null;
  listing_description: string | null;
  property_type: string | null;

  // Location
  address_city: string | null;
  address_state: string | null;
  address_country: string | null;
  city_name?: string;
  province_name?: string;
  country_name?: string;
  location_lat: number | null;
  location_lng: number | null;

  // Media
  featured_image_url: string | null;
  gallery_images: Array<{ url: string; caption?: string; order?: number }>;

  // Categorization
  categories: string[];
  amenities: string[];

  // Pricing
  min_price: number | null;
  max_price: number | null;
  currency: string;

  // Capacity (aggregated from rooms)
  room_count?: number;
  total_max_guests?: number;

  // Reviews
  overall_rating: number | null;
  review_count: number;

  // Priority
  listing_priority: number;
  listed_at: string | null;

  // Wishlist status
  is_in_wishlist?: boolean;
}

export interface PublicPropertyDetail extends PublicPropertySummary {
  // Full description
  long_description: string | null;
  excerpt: string | null;
  highlights: string[];
  video_url: string | null;
  show_video: boolean;

  // Stay details
  check_in_time: string | null;
  check_out_time: string | null;
  cancellation_policy: string | null;
  house_rules: string[];
  whats_included: string[];

  // Contact
  phone: string | null;
  email: string | null;
  website: string | null;

  // Company info
  company_name?: string;
  company_logo?: string;

  // Rooms
  rooms: PublicRoomSummary[];

  // Add-ons
  addons: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    pricing_type: 'per_guest' | 'per_booking' | 'per_night' | 'per_room';
    type: string; // e.g., 'experience', 'service', 'amenity'
    currency: string;
    max_quantity: number | null;
    is_active: boolean;
    image_url: string | null;
  }>;

  // Reviews
  rating_breakdown: {
    safety: number | null;
    cleanliness: number | null;
    location: number | null;
    comfort: number | null;
    scenery: number | null;
  };

  // Recent reviews (for display)
  recent_reviews: Review[];
}

export interface PublicRoomSummary {
  id: string;
  name: string;
  description: string | null;
  room_code: string;

  // Capacity
  max_guests: number;
  max_adults: number | null;
  max_children: number | null;

  // Pricing
  base_price_per_night: number;
  additional_person_rate: number | null;
  currency: string;
  pricing_mode: 'per_unit' | 'per_person' | 'per_person_sharing';

  // Availability
  is_active: boolean;
  is_paused: boolean;

  // Media
  featured_image: string | null;
  gallery_images: string[];

  // Amenities
  amenities: string[];

  // Bed configuration
  beds: Array<{
    bed_type: string;
    quantity: number;
    sleeps: number;
  }>;

  // Stay requirements
  min_nights: number | null;
  max_nights: number | null;
}

export interface PropertySearchResponse {
  properties: PublicPropertySummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}

export interface FeaturedPropertiesResponse {
  properties: PublicPropertySummary[];
}

export interface CategoryProperties {
  category: string;
  properties: PublicPropertySummary[];
  total: number;
}
