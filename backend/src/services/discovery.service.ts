/**
 * Discovery Service
 * Handles public property directory and search functionality
 */

import { getAnonClient, getAdminClient } from '../config/supabase';
import type {
  PropertySearchFilters,
  PropertySearchResponse,
  PublicPropertySummary,
  PublicPropertyDetail,
  FeaturedPropertiesResponse,
  CategoryProperties,
} from '../types/discovery.types';

const supabase = getAnonClient();
const supabaseAdmin = getAdminClient();

/**
 * Search public properties with filters
 */
export async function searchPublicProperties(
  filters: PropertySearchFilters,
  userId?: string
): Promise<PropertySearchResponse> {
  const {
    country_id,
    province_id,
    city_id,
    checkIn,
    checkOut,
    guests,
    categories,
    amenities,
    priceMin,
    priceMax,
    keyword,
    sortBy = 'popular',
    page = 1,
    limit = 20,
  } = filters;

  // Start with base query for publicly listed properties
  let query = supabase
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
      gallery_images,
      categories,
      amenities,
      currency,
      listing_priority,
      listed_at,
      country_id,
      province_id,
      city_id
    `, { count: 'exact' })
    .eq('is_listed_publicly', true)
    .eq('is_active', true);

  // Location filters (hierarchical)
  if (country_id) {
    query = query.eq('country_id', country_id);
  }
  if (province_id) {
    query = query.eq('province_id', province_id);
  }
  if (city_id) {
    query = query.eq('city_id', city_id);
  }

  // Category filter (JSONB array contains)
  if (categories && categories.length > 0) {
    query = query.contains('categories', categories);
  }

  // Amenity filter (JSONB array contains)
  if (amenities && amenities.length > 0) {
    query = query.contains('amenities', amenities);
  }

  // Keyword search (full-text search)
  if (keyword && keyword.trim()) {
    query = query.textSearch('name, listing_title, listing_description', keyword.trim(), {
      type: 'websearch',
      config: 'english',
    });
  }

  // Execute base query
  const { data: properties, error, count } = await query;

  if (error) {
    console.error('Error searching properties:', error);
    throw new Error(`Failed to search properties: ${error.message}`);
  }

  if (!properties) {
    return {
      properties: [],
      total: 0,
      page,
      limit,
      total_pages: 0,
      has_more: false,
    };
  }

  // Enrich with pricing and capacity data from rooms
  const propertyIds = properties.map((p) => p.id);
  const { data: roomPricing } = await supabase
    .from('rooms')
    .select('property_id, base_price_per_night, currency, max_guests')
    .in('property_id', propertyIds)
    .eq('is_active', true)
    .eq('is_paused', false);

  // Enrich with review stats
  const { data: reviewStats } = await supabase
    .from('property_reviews')
    .select('property_id, rating_overall')
    .in('property_id', propertyIds)
    .eq('status', 'published');

  // Enrich with location names
  const countryIds = [...new Set(properties.map((p) => p.country_id).filter(Boolean))];
  const provinceIds = [...new Set(properties.map((p) => p.province_id).filter(Boolean))];
  const cityIds = [...new Set(properties.map((p) => p.city_id).filter(Boolean))];

  const { data: countries } = await supabase
    .from('countries')
    .select('id, name')
    .in('id', countryIds);

  const { data: provinces } = await supabase
    .from('provinces')
    .select('id, name')
    .in('id', provinceIds);

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name')
    .in('id', cityIds);

  // Check wishlist status if user is authenticated
  let wishlistPropertyIds: string[] = [];
  if (userId) {
    const { data: wishlistItems } = await supabase
      .from('user_wishlists')
      .select('property_id')
      .eq('user_id', userId)
      .in('property_id', propertyIds);

    wishlistPropertyIds = wishlistItems?.map((w) => w.property_id) || [];
  }

  // Build enriched property summaries
  let enrichedProperties: PublicPropertySummary[] = properties.map((property) => {
    // Calculate price range and capacity from rooms
    const propertyRooms = roomPricing?.filter((r) => r.property_id === property.id) || [];
    const prices = propertyRooms.map((r) => r.base_price_per_night).filter(Boolean);
    const min_price = prices.length > 0 ? Math.min(...prices) : null;
    const max_price = prices.length > 0 ? Math.max(...prices) : null;

    // Calculate room count and total max guests (sum all room capacities)
    const room_count = propertyRooms.length;
    const guestCounts = propertyRooms.map((r) => r.max_guests).filter(Boolean);
    const total_max_guests = guestCounts.length > 0 ? guestCounts.reduce((sum, count) => sum + count, 0) : undefined;

    // Calculate review stats
    const propertyReviews = reviewStats?.filter((r) => r.property_id === property.id) || [];
    const ratings = propertyReviews.map((r) => r.rating_overall).filter(Boolean);
    const overall_rating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const review_count = ratings.length;

    // Find location names
    const countryName = countries?.find((c) => c.id === property.country_id)?.name;
    const provinceName = provinces?.find((p) => p.id === property.province_id)?.name;
    const cityName = cities?.find((c) => c.id === property.city_id)?.name;

    return {
      id: property.id,
      slug: property.slug,
      name: property.name,
      listing_title: property.listing_title,
      listing_description: property.listing_description,
      property_type: property.property_type,
      address_city: property.address_city,
      address_state: property.address_state,
      address_country: property.address_country,
      city_name: cityName,
      province_name: provinceName,
      country_name: countryName,
      location_lat: property.location_lat,
      location_lng: property.location_lng,
      featured_image_url: property.featured_image_url,
      gallery_images: property.gallery_images || [],
      categories: property.categories || [],
      amenities: property.amenities || [],
      min_price,
      max_price,
      currency: property.currency || 'ZAR',
      room_count: room_count > 0 ? room_count : undefined,
      total_max_guests,
      overall_rating: overall_rating ? Number(overall_rating.toFixed(1)) : null,
      review_count,
      listing_priority: property.listing_priority || 0,
      listed_at: property.listed_at,
      is_in_wishlist: wishlistPropertyIds.includes(property.id),
    };
  });

  // Apply date/guest availability filter (post-query)
  if (checkIn && checkOut && guests) {
    // TODO: Implement availability checking via check_room_availability() function
    // For now, we'll skip this filter and implement it in Phase 2
  }

  // Apply price range filter (post-query since it comes from rooms)
  if (priceMin !== undefined) {
    enrichedProperties = enrichedProperties.filter(
      (p) => p.min_price !== null && p.min_price >= priceMin
    );
  }
  if (priceMax !== undefined) {
    enrichedProperties = enrichedProperties.filter(
      (p) => p.min_price !== null && p.min_price <= priceMax
    );
  }

  // Sort results
  enrichedProperties.sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return (a.min_price || 0) - (b.min_price || 0);
      case 'price_desc':
        return (b.min_price || 0) - (a.min_price || 0);
      case 'rating':
        return (b.overall_rating || 0) - (a.overall_rating || 0);
      case 'newest':
        return (
          new Date(b.listed_at || 0).getTime() - new Date(a.listed_at || 0).getTime()
        );
      case 'popular':
      default:
        // Sort by priority first, then rating, then review count
        if (b.listing_priority !== a.listing_priority) {
          return b.listing_priority - a.listing_priority;
        }
        if ((b.overall_rating || 0) !== (a.overall_rating || 0)) {
          return (b.overall_rating || 0) - (a.overall_rating || 0);
        }
        return b.review_count - a.review_count;
    }
  });

  // Paginate
  const total = enrichedProperties.length;
  const total_pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedProperties = enrichedProperties.slice(offset, offset + limit);

  return {
    properties: paginatedProperties,
    total,
    page,
    limit,
    total_pages,
    has_more: page < total_pages,
  };
}

/**
 * Search public rooms with filters
 */
export async function searchPublicRooms(
  filters: PropertySearchFilters
): Promise<any> {
  const {
    country_id,
    province_id,
    city_id,
    checkIn,
    checkOut,
    guests,
    amenities,
    priceMin,
    priceMax,
    keyword,
    sortBy = 'popular',
    page = 1,
    limit = 20,
  } = filters;

  // Start with base query for active rooms in publicly listed properties
  let query = supabase
    .from('rooms')
    .select(`
      *,
      properties:property_id (
        id,
        slug,
        name,
        listing_title,
        property_type,
        address_city,
        address_state,
        address_country,
        country_id,
        province_id,
        city_id,
        is_listed_publicly,
        is_active,
        categories
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .eq('is_paused', false)
    .not('properties', 'is', null);

  // Note: Location filters will be applied post-query since Supabase
  // doesn't support filtering on nested relations in the query builder

  // Guest capacity filter
  if (guests) {
    query = query.gte('max_guests', guests);
  }

  // Amenity filter (JSONB array contains)
  if (amenities && amenities.length > 0) {
    query = query.contains('amenities', amenities);
  }

  // Price filter
  if (priceMin) {
    query = query.gte('base_price_per_night', priceMin);
  }
  if (priceMax) {
    query = query.lte('base_price_per_night', priceMax);
  }

  // Keyword search (on room name and description)
  if (keyword && keyword.trim()) {
    query = query.textSearch('name, description', keyword.trim(), {
      type: 'websearch',
      config: 'english',
    });
  }

  // Sorting
  switch (sortBy) {
    case 'price_asc':
      query = query.order('base_price_per_night', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('base_price_per_night', { ascending: false });
      break;
    case 'popular':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  // Execute query
  const { data: rooms, error, count } = await query;

  if (error) {
    console.error('Error searching rooms:', error);
    throw new Error(`Failed to search rooms: ${error.message}`);
  }

  if (!rooms) {
    return {
      rooms: [],
      total: 0,
      page,
      limit,
      total_pages: 0,
      has_more: false,
    };
  }

  // Post-filter for location and property listing status
  let filteredRooms = rooms.filter((room: any) => {
    // Ensure property exists and is publicly listed and active
    if (!room.properties || !room.properties.is_listed_publicly || !room.properties.is_active) {
      return false;
    }

    // Apply location filters
    if (country_id && room.properties.country_id !== country_id) return false;
    if (province_id && room.properties.province_id !== province_id) return false;
    if (city_id && room.properties.city_id !== city_id) return false;

    return true;
  });

  const total = filteredRooms.length;
  const total_pages = Math.ceil(total / limit);

  return {
    rooms: filteredRooms,
    total,
    page,
    limit,
    total_pages,
    has_more: page < total_pages,
  };
}

/**
 * Get public property detail by slug
 */
export async function getPublicPropertyDetail(
  slug: string,
  userId?: string
): Promise<PublicPropertyDetail | null> {
  // OPTIMIZED: Fetch property with all related data in parallel using joins
  // This reduces 13+ sequential queries to 3-4 parallel queries

  console.log('🔍 [Discovery Service] Looking for property with slug:', slug);

  // Query 1: Property with nested relations (company, location)
  const propertyPromise = supabase
    .from('properties')
    .select(`
      *,
      companies:company_id(name, logo_url),
      countries:country_id(name),
      provinces:province_id(name),
      cities:city_id(name)
    `)
    .eq('slug', slug)
    .eq('is_listed_publicly', true)
    .eq('is_active', true)
    .single();

  // Query 2: Rooms with nested beds and seasonal rates
  const roomsPromise = (async () => {
    // First get property to get its ID (from cache or first query)
    const { data: propertyData } = await propertyPromise;
    if (!propertyData) return { data: null, error: null };

    return supabase
      .from('rooms')
      .select(`
        id,
        name,
        description,
        room_code,
        max_guests,
        max_adults,
        max_children,
        base_price_per_night,
        additional_person_rate,
        currency,
        pricing_mode,
        is_active,
        is_paused,
        featured_image,
        gallery_images,
        amenities,
        min_nights,
        max_nights,
        room_beds(room_id, bed_type, quantity, sleeps),
        room_seasonal_rates!room_seasonal_rates_room_id_fkey(
          id,
          room_id,
          start_date,
          end_date,
          price_per_night,
          priority,
          is_active,
          name
        )
      `)
      .eq('property_id', propertyData.id)
      .eq('is_active', true)
      .eq('is_paused', false);
  })();

  // Query 3: Reviews (both stats and recent) - parallel with rooms
  const reviewsPromise = (async () => {
    const { data: propertyData } = await propertyPromise;
    if (!propertyData) return { data: null, error: null };

    return supabase
      .from('property_reviews')
      .select('*')
      .eq('property_id', propertyData.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
  })();

  // Query 4: Promotions (both property-level and room-specific) - parallel
  const promotionsPromise = (async () => {
    const { data: propertyData } = await propertyPromise;
    if (!propertyData) return { data: null, error: null };

    console.log('🎟️ [Discovery Service] Fetching promotions for property:', propertyData.id);

    // Use admin client to bypass RLS since promotions should be publicly visible
    const result = await supabaseAdmin
      .from('room_promotions')
      .select(`
        id,
        room_id,
        name,
        code,
        description,
        discount_type,
        discount_value,
        valid_from,
        valid_until,
        is_active,
        is_claimable,
        max_uses,
        current_uses,
        min_nights
      `)
      .eq('property_id', propertyData.id)
      .eq('is_active', true);

    console.log('🎟️ [Discovery Service] Promotions query result:', {
      data: result.data,
      error: result.error,
      count: result.data?.length || 0,
    });

    return result;
  })();

  // Query 5: Add-ons - parallel
  const addonsPromise = (async () => {
    const { data: propertyData } = await propertyPromise;
    if (!propertyData) return { data: null, error: null };

    console.log('🔍 [Discovery Service] Fetching add-ons for property:', propertyData.id);
    return supabase
      .from('add_ons')
      .select('id, name, description, price, pricing_type, type, currency, max_quantity, is_active, image_url')
      .eq('property_id', propertyData.id)
      .eq('is_active', true)
      .order('name', { ascending: true });
  })();

  // Query 6: Cancellation Policy (if property has one)
  const policyPromise = (async () => {
    const { data: propertyData } = await propertyPromise;

    console.log('🔍 [DISCOVERY] Checking cancellation policy for property:', {
      property_id: propertyData?.id,
      property_name: propertyData?.name,
      cancellation_policy_value: propertyData?.cancellation_policy,
      has_policy: !!propertyData?.cancellation_policy
    });

    if (!propertyData || !propertyData.cancellation_policy) {
      console.log('⚠️ [DISCOVERY] Property has no cancellation_policy assigned');
      return { data: null, error: null };
    }

    // Check if it's a UUID (new schema) or text (old schema)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyData.cancellation_policy);

    console.log('🔍 [DISCOVERY] Cancellation policy type:', {
      isUUID,
      value: propertyData.cancellation_policy
    });

    if (isUUID) {
      const result = await supabase
        .from('cancellation_policies')
        .select('id, name, description, tiers')
        .eq('id', propertyData.cancellation_policy)
        .single();

      console.log('✅ [DISCOVERY] Cancellation policy query result:', {
        found: !!result.data,
        policy_name: result.data?.name,
        tiers_count: result.data?.tiers?.length || 0,
        error: result.error
      });

      return result;
    } else {
      // Old schema: cancellation_policy is the text itself
      console.log('⚠️ [DISCOVERY] Property uses old text-based cancellation policy (not UUID)');
      return { data: null, error: null };
    }
  })();

  // Query 7: Wishlist check (conditional) - parallel
  const wishlistPromise = userId
    ? (async () => {
        const { data: propertyData } = await propertyPromise;
        if (!propertyData) return { data: null, error: null };

        return supabase
          .from('user_wishlists')
          .select('id')
          .eq('user_id', userId)
          .eq('property_id', propertyData.id)
          .maybeSingle();
      })()
    : Promise.resolve({ data: null, error: null });

  // Execute all queries in parallel (after property query completes)
  const [
    { data: property, error: propertyError },
    { data: rooms, error: roomsError },
    { data: reviews, error: reviewsError },
    { data: promotions, error: promotionsError },
    { data: addons, error: addonsError },
    { data: policyData, error: policyError },
    { data: wishlist, error: wishlistError },
  ] = await Promise.all([
    propertyPromise,
    roomsPromise,
    reviewsPromise,
    promotionsPromise,
    addonsPromise,
    policyPromise,
    wishlistPromise,
  ]);

  // Debug logging for query results
  console.log('📊 [Discovery Service] Query results:', {
    property: property ? 'OK' : 'NULL',
    rooms: rooms ? `${rooms.length} rooms` : 'NULL',
    roomsError: roomsError ? roomsError.message : 'None',
    reviews: reviews ? `${reviews.length} reviews` : 'NULL',
    promotions: promotions ? `${promotions.length} promotions` : 'NULL',
    promotionsError: promotionsError ? promotionsError.message : 'None',
    addons: addons ? `${addons.length} addons` : 'NULL',
  });

  if (propertyError || !property) {
    console.error('❌ [Discovery Service] Failed to fetch property:', propertyError);
    console.error('   Slug searched:', slug);
    console.error('   Filters: is_listed_publicly=true, is_active=true');

    // Check if property exists without filters
    const { data: anyProperty } = await supabase
      .from('properties')
      .select('id, slug, name, is_listed_publicly, is_active')
      .eq('slug', slug)
      .single();

    console.error('   Property exists (without filters)?', anyProperty ? 'YES' : 'NO');
    if (anyProperty) {
      console.error('   Property details:', {
        id: anyProperty.id,
        name: anyProperty.name,
        slug: anyProperty.slug,
        is_listed_publicly: anyProperty.is_listed_publicly,
        is_active: anyProperty.is_active,
      });
    }

    return null;
  }

  // Separate promotions into property-level and room-specific
  const propertyLevelPromotions = (promotions || []).filter((p: any) => p.room_id === null);
  const roomSpecificPromotions = (promotions || []).filter((p: any) => p.room_id !== null);

  console.log('🎟️ [Discovery Service] Promotions breakdown:', {
    total: promotions?.length || 0,
    propertyLevel: propertyLevelPromotions.length,
    roomSpecific: roomSpecificPromotions.length,
  });

  // Process rooms data (beds, seasonal rates, and promotions)
  const enrichedRooms = rooms?.map((room: any) => {
    // Get room-specific promotions for this room
    const thisRoomPromotions = roomSpecificPromotions.filter((p: any) => p.room_id === room.id);

    // Combine property-level promotions with room-specific promotions
    const allRoomPromotions = [...propertyLevelPromotions, ...thisRoomPromotions];

    console.log(`🎟️ Room "${room.name}" promotions:`, {
      propertyLevel: propertyLevelPromotions.length,
      roomSpecific: thisRoomPromotions.length,
      total: allRoomPromotions.length,
      promotions: allRoomPromotions,
    });

    return {
      ...room,
      beds: room.room_beds || [],
      seasonal_rates: (room.room_seasonal_rates || []).filter((sr: any) => sr.is_active),
      promotions: allRoomPromotions,
      gallery_images: room.gallery_images || [],
      amenities: room.amenities || [],
    };
  }) || [];

  // Calculate pricing
  const prices = enrichedRooms.map((r) => r.base_price_per_night).filter(Boolean);
  const min_price = prices.length > 0 ? Math.min(...prices) : null;
  const max_price = prices.length > 0 ? Math.max(...prices) : null;

  // Calculate review stats
  const overallRatings = reviews?.map((r: any) => r.rating_overall).filter(Boolean) || [];
  const overall_rating = overallRatings.length > 0
    ? overallRatings.reduce((a, b) => a + b, 0) / overallRatings.length
    : null;

  const rating_breakdown = {
    safety: reviews && reviews.length > 0
      ? reviews.map((r: any) => r.rating_safety).filter(Boolean).reduce((a, b) => a + b, 0) / reviews.length
      : null,
    cleanliness: reviews && reviews.length > 0
      ? reviews.map((r: any) => r.rating_cleanliness).filter(Boolean).reduce((a, b) => a + b, 0) / reviews.length
      : null,
    location: reviews && reviews.length > 0
      ? reviews.map((r: any) => r.rating_location).filter(Boolean).reduce((a, b) => a + b, 0) / reviews.length
      : null,
    comfort: reviews && reviews.length > 0
      ? reviews.map((r: any) => r.rating_comfort).filter(Boolean).reduce((a, b) => a + b, 0) / reviews.length
      : null,
    scenery: reviews && reviews.length > 0
      ? reviews.map((r: any) => r.rating_scenery).filter(Boolean).reduce((a, b) => a + b, 0) / reviews.length
      : null,
  };

  // Get recent reviews (limit to 10)
  const recentReviews = reviews?.slice(0, 10) || [];

  // Extract nested data from joins
  const company = (property as any).companies || null;
  const country = (property as any).countries || null;
  const province = (property as any).provinces || null;
  const city = (property as any).cities || null;

  // Check wishlist status
  const is_in_wishlist = !!wishlist;

  console.log('📦 [Discovery Service] Add-ons fetched:', {
    propertyId: property.id,
    addonsCount: addons?.length || 0,
    addons: addons,
    error: addonsError
  });

  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    listing_title: property.listing_title,
    listing_description: property.listing_description,
    long_description: property.long_description,
    excerpt: property.excerpt,
    video_url: property.video_url,
    show_video: property.show_video !== undefined ? property.show_video : true,
    property_type: property.property_type,
    address_city: property.address_city,
    address_state: property.address_state,
    address_country: property.address_country,
    city_name: city?.name || null,
    province_name: province?.name || null,
    country_name: country?.name || null,
    location_lat: property.location_lat,
    location_lng: property.location_lng,
    featured_image_url: property.featured_image_url,
    gallery_images: property.gallery_images || [],
    categories: property.categories || [],
    amenities: property.amenities || [],
    highlights: property.highlights || [],
    check_in_time: property.check_in_time,
    check_out_time: property.check_out_time,
    cancellation_policy: policyData?.description || policyData?.name || property.cancellation_policy || null,
    cancellation_policy_detail: policyData ? {
      id: policyData.id,
      name: policyData.name,
      description: policyData.description,
      tiers: policyData.tiers || [],
    } : null,
    terms_and_conditions: property.terms_and_conditions || null,
    house_rules: property.house_rules || [],
    whats_included: property.whats_included || [],
    phone: property.phone,
    email: property.email,
    website: property.website,
    company_name: company?.name || null,
    company_logo: company?.logo_url || null,
    owner_id: property.owner_id, // Include owner ID for chat functionality
    min_price,
    max_price,
    currency: property.currency || 'ZAR',
    overall_rating: overall_rating ? Number(overall_rating.toFixed(1)) : null,
    review_count: reviews?.length || 0,
    rating_breakdown,
    recent_reviews: recentReviews,
    listing_priority: property.listing_priority || 0,
    listed_at: property.listed_at,
    rooms: enrichedRooms,
    addons: addons || [],
    is_in_wishlist,
  };

  console.log('📦 [DISCOVERY] Returning property detail with cancellation_policy_detail:', {
    property_id: property.id,
    property_name: property.name,
    has_cancellation_policy_detail: !!propertyDetail.cancellation_policy_detail,
    policy_detail: propertyDetail.cancellation_policy_detail
  });

  return propertyDetail;
}

/**
 * Get featured properties for homepage
 */
export async function getFeaturedProperties(
  limit: number = 12,
  userId?: string
): Promise<FeaturedPropertiesResponse> {
  const { data: properties, error } = await supabase
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
      gallery_images,
      categories,
      amenities,
      currency,
      listing_priority,
      listed_at,
      country_id,
      province_id,
      city_id
    `)
    .eq('is_listed_publicly', true)
    .eq('is_active', true)
    .order('listing_priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !properties) {
    return { properties: [] };
  }

  // If no properties found, return empty array
  if (properties.length === 0) {
    return { properties: [] };
  }

  // Use searchPublicProperties enrichment logic (simplified)
  const propertyIds = properties.map((p) => p.id);

  // Enrich with pricing and capacity
  const { data: roomPricing } = await supabase
    .from('rooms')
    .select('property_id, base_price_per_night, max_guests')
    .in('property_id', propertyIds)
    .eq('is_active', true);

  // Enrich with reviews
  const { data: reviewStats } = await supabase
    .from('property_reviews')
    .select('property_id, rating_overall')
    .in('property_id', propertyIds)
    .eq('status', 'published');

  // Check wishlist
  let wishlistPropertyIds: string[] = [];
  if (userId) {
    const { data: wishlistItems } = await supabase
      .from('user_wishlists')
      .select('property_id')
      .eq('user_id', userId)
      .in('property_id', propertyIds);

    wishlistPropertyIds = wishlistItems?.map((w) => w.property_id) || [];
  }

  const enrichedProperties: PublicPropertySummary[] = properties.map((property) => {
    const propertyRooms = roomPricing?.filter((r) => r.property_id === property.id) || [];
    const prices = propertyRooms.map((r) => r.base_price_per_night).filter(Boolean);
    const min_price = prices.length > 0 ? Math.min(...prices) : null;
    const max_price = prices.length > 0 ? Math.max(...prices) : null;

    // Calculate room count and total max guests (sum all room capacities)
    const room_count = propertyRooms.length;
    const guestCounts = propertyRooms.map((r) => r.max_guests).filter(Boolean);
    const total_max_guests = guestCounts.length > 0 ? guestCounts.reduce((sum, count) => sum + count, 0) : undefined;

    const propertyReviews = reviewStats?.filter((r) => r.property_id === property.id) || [];
    const ratings = propertyReviews.map((r) => r.rating_overall).filter(Boolean);
    const overall_rating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    return {
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
      gallery_images: property.gallery_images || [],
      categories: property.categories || [],
      amenities: property.amenities || [],
      min_price,
      max_price,
      currency: property.currency || 'ZAR',
      room_count: room_count > 0 ? room_count : undefined,
      total_max_guests,
      overall_rating: overall_rating ? Number(overall_rating.toFixed(1)) : null,
      review_count: ratings.length,
      listing_priority: property.listing_priority || 0,
      listed_at: property.listed_at,
      is_in_wishlist: wishlistPropertyIds.includes(property.id),
    };
  });

  return { properties: enrichedProperties };
}

/**
 * Get properties by category
 */
export async function getPropertiesByCategory(
  category: string,
  limit: number = 20,
  userId?: string
): Promise<CategoryProperties> {
  const filters: PropertySearchFilters = {
    categories: [category],
    limit,
    sortBy: 'popular',
  };

  const result = await searchPublicProperties(filters, userId);

  return {
    category,
    properties: result.properties,
    total: result.total,
  };
}
