/**
 * Wishlist Types
 * Types for user wishlist/favorites functionality
 */

export interface Wishlist {
  id: string;
  user_id: string;
  property_id: string;
  notes: string | null;
  created_at: string;
}

export interface WishlistWithProperty extends Wishlist {
  property: {
    id: string;
    slug: string;
    name: string;
    listing_title: string | null;
    listing_description: string | null;
    property_type: string | null;
    address_city: string | null;
    address_state: string | null;
    address_country: string | null;
    location_lat: number | null;
    location_lng: number | null;
    featured_image_url: string | null;
    categories: string[];
    amenities: string[];
    currency: string;
    listing_priority: number;
  };
  min_price: number | null;
  max_price: number | null;
  overall_rating: number | null;
  review_count: number;
}

export interface AddToWishlistRequest {
  property_id: string;
  notes?: string;
}

export interface UpdateWishlistNotesRequest {
  notes: string;
}

export interface WishlistResponse {
  wishlist: WishlistWithProperty[];
  total: number;
}

export interface WishlistStatusResponse {
  is_in_wishlist: boolean;
  wishlist_id?: string;
}
