/**
 * Wishlist Service
 * Handles user wishlist/favorites functionality
 */

import { getAdminClient } from '../config/supabase';
import type {
  WishlistWithProperty,
  WishlistResponse,
  WishlistStatusResponse,
} from '../types/wishlist.types';
import { AppError } from '../utils/errors';

/**
 * Add property to user's wishlist
 */
export async function addToWishlist(
  userId: string,
  propertyId: string,
  notes?: string
): Promise<void> {
  // Check if property exists and is publicly listed
  const { data: property, error: propError } = await getAdminClient()
    .from('properties')
    .select('id, is_listed_publicly, is_active')
    .eq('id', propertyId)
    .single();

  if (propError || !property) {
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  if (!property.is_listed_publicly || !property.is_active) {
    throw new AppError('BAD_REQUEST', 'Property is not available for wishlist');
  }

  // Check if already in wishlist
  const { data: existing } = await getAdminClient()
    .from('user_wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existing) {
    throw new AppError('CONFLICT', 'Property is already in your wishlist');
  }

  // Add to wishlist
  const { error: insertError } = await getAdminClient()
    .from('user_wishlists')
    .insert({
      user_id: userId,
      property_id: propertyId,
      notes: notes || null,
    });

  if (insertError) {
    console.error('Error adding to wishlist:', insertError);
    throw new AppError('INTERNAL_ERROR', 'Failed to add property to wishlist');
  }
}

/**
 * Remove property from user's wishlist
 */
export async function removeFromWishlist(
  userId: string,
  propertyId: string
): Promise<void> {
  const { error } = await getAdminClient()
    .from('user_wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('property_id', propertyId);

  if (error) {
    console.error('Error removing from wishlist:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to remove property from wishlist');
  }
}

/**
 * Get user's wishlist with enriched property data
 */
export async function getUserWishlist(userId: string): Promise<WishlistResponse> {
  // Fetch wishlist items
  const { data: wishlistItems, error } = await getAdminClient()
    .from('user_wishlists')
    .select(`
      id,
      user_id,
      property_id,
      notes,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wishlist:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch wishlist');
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return {
      wishlist: [],
      total: 0,
    };
  }

  // Fetch property details
  const propertyIds = wishlistItems.map((item) => item.property_id);
  const { data: properties, error: propError } = await getAdminClient()
    .from('properties')
    .select(`
      id,
      slug,
      name,
      listing_title,
      listing_description,
      property_type,
      address_city,
      address_state,
      address_country,
      location_lat,
      location_lng,
      featured_image_url,
      categories,
      amenities,
      currency,
      listing_priority
    `)
    .in('id', propertyIds)
    .eq('is_listed_publicly', true)
    .eq('is_active', true);

  if (propError) {
    console.error('Error fetching wishlist properties:', propError);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch wishlist properties');
  }

  // Fetch pricing data
  const { data: roomPricing } = await getAdminClient()
    .from('rooms')
    .select('property_id, base_price_per_night')
    .in('property_id', propertyIds)
    .eq('is_active', true)
    .eq('is_paused', false);

  // Fetch review stats
  const { data: reviewStats } = await getAdminClient()
    .from('property_reviews')
    .select('property_id, rating_overall')
    .in('property_id', propertyIds)
    .eq('status', 'published');

  // Build enriched wishlist
  const enrichedWishlist: WishlistWithProperty[] = wishlistItems
    .map((item) => {
      const property = properties?.find((p) => p.id === item.property_id);
      if (!property) return null; // Property no longer available

      // Calculate pricing
      const propertyRooms = roomPricing?.filter((r) => r.property_id === property.id) || [];
      const prices = propertyRooms.map((r) => r.base_price_per_night).filter(Boolean);
      const min_price = prices.length > 0 ? Math.min(...prices) : null;
      const max_price = prices.length > 0 ? Math.max(...prices) : null;

      // Calculate review stats
      const propertyReviews = reviewStats?.filter((r) => r.property_id === property.id) || [];
      const ratings = propertyReviews.map((r) => r.rating_overall).filter(Boolean);
      const overall_rating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

      return {
        id: item.id,
        user_id: item.user_id,
        property_id: item.property_id,
        notes: item.notes,
        created_at: item.created_at,
        property: {
          id: property.id,
          slug: property.slug,
          name: property.name,
          listing_title: property.listing_title,
          listing_description: property.listing_description,
          property_type: property.property_type,
          address_city: property.address_city,
          address_state: property.address_state,
          address_country: property.address_country,
          location_lat: property.location_lat,
          location_lng: property.location_lng,
          featured_image_url: property.featured_image_url,
          categories: property.categories || [],
          amenities: property.amenities || [],
          currency: property.currency || 'ZAR',
          listing_priority: property.listing_priority || 0,
        },
        min_price,
        max_price,
        overall_rating: overall_rating ? Number(overall_rating.toFixed(1)) : null,
        review_count: ratings.length,
      };
    })
    .filter((item): item is WishlistWithProperty => item !== null);

  return {
    wishlist: enrichedWishlist,
    total: enrichedWishlist.length,
  };
}

/**
 * Check if property is in user's wishlist
 */
export async function isPropertyInWishlist(
  userId: string,
  propertyId: string
): Promise<WishlistStatusResponse> {
  const { data: wishlist, error } = await getAdminClient()
    .from('user_wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) {
    console.error('Error checking wishlist status:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to check wishlist status');
  }

  return {
    is_in_wishlist: !!wishlist,
    wishlist_id: wishlist?.id,
  };
}

/**
 * Update wishlist item notes
 */
export async function updateWishlistNotes(
  userId: string,
  propertyId: string,
  notes: string
): Promise<void> {
  const { error } = await getAdminClient()
    .from('user_wishlists')
    .update({ notes })
    .eq('user_id', userId)
    .eq('property_id', propertyId);

  if (error) {
    console.error('Error updating wishlist notes:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to update wishlist notes');
  }
}
