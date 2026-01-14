/**
 * Wishlist Service (Frontend)
 * API client for user wishlist/favorites
 */

import { api } from './api.service';

export interface WishlistItem {
  id: string;
  user_id: string;
  property_id: string;
  notes: string | null;
  created_at: string;
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

export interface WishlistResponse {
  wishlist: WishlistItem[];
  total: number;
}

export interface WishlistStatusResponse {
  is_in_wishlist: boolean;
  wishlist_id?: string;
}

/**
 * Add property to wishlist
 */
export async function addToWishlist(
  propertyId: string,
  notes?: string
): Promise<void> {
  await api.post('/wishlist', {
    property_id: propertyId,
    notes,
  });
}

/**
 * Remove property from wishlist
 */
export async function removeFromWishlist(propertyId: string): Promise<void> {
  await api.delete(`/wishlist/${propertyId}`);
}

/**
 * Get user's wishlist
 */
export async function getUserWishlist(): Promise<WishlistResponse> {
  const response = await api.get('/wishlist');
  return response.data;
}

/**
 * Check if property is in wishlist
 */
export async function isPropertyInWishlist(
  propertyId: string
): Promise<WishlistStatusResponse> {
  const response = await api.get(`/wishlist/check/${propertyId}`);
  return response.data;
}

/**
 * Update wishlist item notes
 */
export async function updateWishlistNotes(
  propertyId: string,
  notes: string
): Promise<void> {
  await api.patch(`/wishlist/${propertyId}/notes`, { notes });
}
