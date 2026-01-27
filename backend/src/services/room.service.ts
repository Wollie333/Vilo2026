import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { getUserSubscription } from './billing.service';
import { getProperty } from './property.service';
import {
  Room,
  RoomWithDetails,
  CreateRoomRequest,
  UpdateRoomRequest,
  PauseRoomRequest,
  RoomListParams,
  RoomListResponse,
  RoomLimitInfo,
  RoomBed,
  CreateRoomBedRequest,
  UpdateRoomBedRequest,
  SeasonalRate,
  CreateSeasonalRateRequest,
  UpdateSeasonalRateRequest,
  RoomPromotion,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  AddOn,
  CreateAddOnRequest,
  UpdateAddOnRequest,
  AvailabilityBlock,
  CreateAvailabilityBlockRequest,
  UpdateAvailabilityBlockRequest,
  PriceCalculationRequest,
  PriceCalculationResponse,
  AvailabilityCheckRequest,
  AvailabilityCheckResponse,
  NightlyRate,
  EffectivePrice,
  GalleryImage,
} from '../types/room.types';

// ============================================================================
// ROOM CRUD OPERATIONS
// ============================================================================

/**
 * Generate a URL-friendly slug from a room name
 */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 150);
};

/**
 * Generate a unique slug for a room within a property
 */
const generateUniqueRoomSlug = async (
  propertyId: string,
  name: string,
  excludeRoomId?: string
): Promise<string> => {
  const supabase = getAdminClient();
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabase
      .from('rooms')
      .select('id')
      .eq('property_id', propertyId)
      .eq('slug', slug);

    if (excludeRoomId) {
      query = query.neq('id', excludeRoomId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[RoomService] Slug check error:', error);
      // If check fails, append timestamp to be safe
      return `${baseSlug}-${Date.now()}`;
    }

    if (!data || data.length === 0) {
      // Slug is unique
      return slug;
    }

    // Slug exists, try with counter
    counter++;
    slug = `${baseSlug}-${counter}`;

    // Safety check - prevent infinite loop
    if (counter > 100) {
      return `${baseSlug}-${Date.now()}`;
    }
  }
};

/**
 * List rooms with filters
 */
export const listRooms = async (
  userId: string,
  params?: RoomListParams
): Promise<RoomListResponse> => {
  const supabase = getAdminClient();

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  // Build base query
  let query = supabase
    .from('rooms')
    .select(`
      *,
      properties!inner (
        id,
        name,
        slug,
        owner_id
      )
    `, { count: 'exact' })
    .eq('properties.owner_id', userId);

  // Filters
  if (params?.property_id) {
    query = query.eq('property_id', params.property_id);
  }

  if (params?.is_active !== undefined) {
    query = query.eq('is_active', params.is_active);
  }

  if (params?.is_paused !== undefined) {
    query = query.eq('is_paused', params.is_paused);
  }

  if (params?.pricing_mode) {
    query = query.eq('pricing_mode', params.pricing_mode);
  }

  if (params?.min_price !== undefined) {
    query = query.gte('base_price_per_night', params.min_price);
  }

  if (params?.max_price !== undefined) {
    query = query.lte('base_price_per_night', params.max_price);
  }

  if (params?.min_guests !== undefined) {
    query = query.gte('max_guests', params.min_guests);
  }

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,room_code.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  // Sorting
  const sortBy = params?.sortBy || 'created_at';
  const sortOrder = params?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Supabase error fetching rooms:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to fetch rooms: ${error.message}`);
  }

  const total = count || 0;

  // Fetch related data for each room
  const roomIds = (data || []).map((r: any) => r.id);

  // Fetch beds
  const { data: bedsData } = await supabase
    .from('room_beds')
    .select('*')
    .in('room_id', roomIds)
    .order('sort_order', { ascending: true });

  // Fetch seasonal rates
  const { data: ratesData } = await supabase
    .from('room_seasonal_rates')
    .select('*')
    .in('room_id', roomIds)
    .order('priority', { ascending: false });

  // Fetch promotions via junction table
  const { data: promotionAssignments } = await supabase
    .from('room_promotion_assignments')
    .select(`
      room_id,
      promotion_id,
      room_promotions (*)
    `)
    .in('room_id', roomIds);

  // Fetch payment rules via junction table
  const { data: paymentRuleAssignments } = await supabase
    .from('room_payment_rule_assignments')
    .select(`
      room_id,
      payment_rule_id,
      room_payment_rules (*)
    `)
    .in('room_id', roomIds);

  // Group promotions by room_id
  const promotionsByRoom: Record<string, any[]> = {};
  (promotionAssignments || []).forEach((assignment: any) => {
    if (!promotionsByRoom[assignment.room_id]) {
      promotionsByRoom[assignment.room_id] = [];
    }
    if (assignment.room_promotions) {
      promotionsByRoom[assignment.room_id].push(assignment.room_promotions);
    }
  });

  // Group payment rules by room_id
  const paymentRulesByRoom: Record<string, any[]> = {};
  (paymentRuleAssignments || []).forEach((assignment: any) => {
    if (!paymentRulesByRoom[assignment.room_id]) {
      paymentRulesByRoom[assignment.room_id] = [];
    }
    if (assignment.room_payment_rules) {
      paymentRulesByRoom[assignment.room_id].push(assignment.room_payment_rules);
    }
  });

  // Map to RoomWithDetails format
  const rooms: RoomWithDetails[] = (data || []).map((room: any) => ({
    ...room,
    beds: (bedsData || []).filter((b: any) => b.room_id === room.id),
    seasonal_rates: (ratesData || []).filter((r: any) => r.room_id === room.id),
    promotions: promotionsByRoom[room.id] || [],
    payment_rules: paymentRulesByRoom[room.id] || [],
    property_name: room.properties?.name,
    property_slug: room.properties?.slug,
    properties: undefined,
  }));

  return {
    rooms,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a single room by ID
 */
export const getRoomById = async (
  id: string,
  userId?: string
): Promise<RoomWithDetails> => {
  const supabase = getAdminClient();

  let query = supabase
    .from('rooms')
    .select(`
      *,
      properties!inner (
        id,
        name,
        slug,
        owner_id
      )
    `)
    .eq('id', id);

  if (userId) {
    query = query.eq('properties.owner_id', userId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Room not found');
  }

  // Fetch related data
  const [bedsResult, ratesResult, promotionsResult, paymentRulesResult] = await Promise.all([
    supabase
      .from('room_beds')
      .select('*')
      .eq('room_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('room_seasonal_rates')
      .select('*')
      .eq('room_id', id)
      .order('priority', { ascending: false }),
    // Query promotions via junction table to get assigned promotions
    supabase
      .from('room_promotion_assignments')
      .select(`
        promotion_id,
        room_promotions (*)
      `)
      .eq('room_id', id),
    // Query payment rules via junction table to get assigned rules
    supabase
      .from('room_payment_rule_assignments')
      .select(`
        payment_rule_id,
        room_payment_rules (*)
      `)
      .eq('room_id', id),
  ]);

  // Extract promotions from junction table results
  console.log('[RoomService] getRoomById - Raw promotions result:', JSON.stringify(promotionsResult, null, 2));
  const promotions = (promotionsResult.data || [])
    .map((assignment: any) => assignment.room_promotions)
    .filter(Boolean);
  console.log('[RoomService] getRoomById - Extracted promotions:', JSON.stringify(promotions, null, 2));

  // Extract payment rules from junction table results
  const paymentRules = (paymentRulesResult.data || [])
    .map((assignment: any) => assignment.room_payment_rules)
    .filter(Boolean);

  return {
    ...data,
    beds: bedsResult.data || [],
    seasonal_rates: ratesResult.data || [],
    promotions: promotions,
    payment_rules: paymentRules,
    property_name: data.properties?.name,
    property_slug: data.properties?.slug,
    properties: undefined,
  };
};

/**
 * Create a new room
 * Optimized for performance with parallel operations
 */
export const createRoom = async (
  userId: string,
  input: CreateRoomRequest
): Promise<RoomWithDetails> => {
  const supabase = getAdminClient();

  // Validate required fields first (no DB calls needed)
  if (!input.name || !input.name.trim()) {
    throw new AppError('VALIDATION_ERROR', 'Room name is required');
  }

  if (input.base_price_per_night === undefined || input.base_price_per_night < 0) {
    throw new AppError('VALIDATION_ERROR', 'Base price per night is required and must be >= 0');
  }

  // 💰 PRICE DEBUG: Log input price to track transformations
  console.log('=== 💰 [ROOM_SERVICE] createRoom - PRICE DEBUG ===');
  console.log('💰 [ROOM_SERVICE] Input price:', input.base_price_per_night);
  console.log('💰 [ROOM_SERVICE] Input price type:', typeof input.base_price_per_night);
  console.log('💰 [ROOM_SERVICE] Full input object:', JSON.stringify(input, null, 2));

  if (!input.max_guests || input.max_guests < 1) {
    throw new AppError('VALIDATION_ERROR', 'Max guests must be at least 1');
  }

  // Run limit check and property ownership check in parallel
  const [limitInfo, property] = await Promise.all([
    getRoomLimitInfo(userId),
    getProperty(input.property_id),
  ]);

  if (!limitInfo.can_create) {
    throw new AppError(
      'FORBIDDEN',
      `You have reached your room limit (${limitInfo.max_allowed}). Please upgrade your subscription to create more rooms.`
    );
  }

  if (property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not own this property');
  }

  // Generate unique slug for the room
  console.log('[RoomService] Generating unique slug for room:', input.name);
  const slug = await generateUniqueRoomSlug(input.property_id, input.name);
  console.log('[RoomService] Generated slug:', slug);

  // Insert the room
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      property_id: input.property_id,
      name: input.name.trim(),
      slug: slug,
      description: input.description?.trim() || null,
      room_size_sqm: input.room_size_sqm || null,
      pricing_mode: input.pricing_mode || 'per_unit',
      base_price_per_night: input.base_price_per_night,
      additional_person_rate: input.additional_person_rate || 0,
      currency: input.currency || 'ZAR',
      child_price_per_night: input.child_price_per_night || null,
      child_free_until_age: input.child_free_until_age ?? 2,
      child_age_limit: input.child_age_limit ?? 12,
      max_guests: input.max_guests,
      max_adults: input.max_adults || null,
      max_children: input.max_children || null,
      min_nights: input.min_nights ?? 1,
      max_nights: input.max_nights || null,
      inventory_mode: input.inventory_mode || 'single_unit',
      total_units: input.total_units ?? 1,
      amenities: input.amenities || [],
      extra_options: input.extra_options || [],
      featured_image: input.featured_image || null,
      gallery_images: input.gallery_images || [],
      sort_order: input.sort_order ?? 0,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create room:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to create room');
  }

  // 💰 PRICE DEBUG: Log stored price from database
  console.log('💰 [ROOM_SERVICE] Database insert successful - Room ID:', data.id);
  console.log('💰 [ROOM_SERVICE] Stored price:', data.base_price_per_night);
  console.log('💰 [ROOM_SERVICE] Stored price type:', typeof data.base_price_per_night);
  console.log('💰 [ROOM_SERVICE] Full stored object:', JSON.stringify(data, null, 2));

  // Prepare all related inserts to run in parallel
  const bedsPromise = input.beds && input.beds.length > 0
    ? supabase.from('room_beds').insert(
        input.beds.map((bed, index) => ({
          room_id: data.id,
          bed_type: bed.bed_type,
          quantity: bed.quantity,
          sleeps: bed.sleeps ?? getBedDefaultSleeps(bed.bed_type),
          sort_order: bed.sort_order ?? index,
        }))
      ).select()
    : Promise.resolve({ data: [] });

  const ratesPromise = input.seasonal_rates && input.seasonal_rates.length > 0
    ? supabase.from('room_seasonal_rates').insert(
        input.seasonal_rates.map((rate, index) => ({
          room_id: data.id,
          name: rate.name.trim(),
          description: rate.description?.trim() || null,
          start_date: rate.start_date,
          end_date: rate.end_date,
          price_per_night: rate.price_per_night,
          additional_person_rate: rate.additional_person_rate || null,
          pricing_mode_override: rate.pricing_mode_override || null,
          priority: rate.priority ?? index,
          is_active: rate.is_active ?? true,
        }))
      ).select()
    : Promise.resolve({ data: [] });

  const promotionsPromise = input.promotions && input.promotions.length > 0
    ? supabase.from('room_promotions').insert(
        input.promotions.map((promo) => ({
          room_id: data.id,
          property_id: input.property_id,
          code: promo.code.toUpperCase().replace(/[^A-Z0-9]/g, ''),
          name: promo.name.trim(),
          description: promo.description?.trim() || null,
          discount_type: promo.discount_type,
          discount_value: promo.discount_value,
          valid_from: promo.valid_from || new Date().toISOString(),
          valid_until: promo.valid_until || null,
          max_uses: promo.max_uses || null,
          max_uses_per_customer: promo.max_uses_per_customer ?? 1,
          min_booking_amount: promo.min_booking_amount || null,
          min_nights: promo.min_nights || null,
          is_claimable: promo.is_claimable ?? false,
          is_active: promo.is_active ?? true,
        }))
      ).select()
    : Promise.resolve({ data: [] });

  // Execute all parallel operations (audit log is fire-and-forget)
  const [bedsResult, ratesResult, promotionsResult] = await Promise.all([
    bedsPromise,
    ratesPromise,
    promotionsPromise,
  ]);

  // Create audit log (non-blocking, don't wait for it)
  createAuditLog({
    actor_id: userId,
    action: 'room.created' as any,
    entity_type: 'room' as any,
    entity_id: data.id,
    new_data: input as unknown as Record<string, unknown>,
  }).catch(err => console.error('Failed to create audit log:', err));

  // Return the room with related data directly (no re-fetch needed)
  return {
    ...data,
    beds: bedsResult.data || [],
    seasonal_rates: ratesResult.data || [],
    promotions: promotionsResult.data || [],
    property_name: property.name,
    property_slug: property.slug,
  };
};

/**
 * Update a room
 * Optimized to avoid double-fetch and run operations in parallel
 */
export const updateRoom = async (
  id: string,
  userId: string,
  input: UpdateRoomRequest
): Promise<RoomWithDetails> => {
  console.log('[RoomService] updateRoom started for room:', id);
  console.log('[RoomService] Update input:', JSON.stringify(input, null, 2));

  // 💰 PRICE DEBUG: Log input price if it's being updated
  if (input.base_price_per_night !== undefined) {
    console.log('=== 💰 [ROOM_SERVICE] updateRoom - PRICE DEBUG ===');
    console.log('💰 [ROOM_SERVICE] Input price:', input.base_price_per_night);
    console.log('💰 [ROOM_SERVICE] Input price type:', typeof input.base_price_per_night);
  }

  const supabase = getAdminClient();

  // Verify ownership (need this for audit log old_data)
  console.log('[RoomService] Fetching current room data...');
  const current = await getRoomById(id, userId);
  console.log('[RoomService] Current room data fetched successfully');

  const updateData: any = {
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  // Only update fields that are provided
  if (input.name !== undefined) {
    updateData.name = input.name.trim();
    // Regenerate slug if name changes
    if (input.name.trim() !== current.name) {
      console.log('[RoomService] Name changed, regenerating slug...');
      const newSlug = await generateUniqueRoomSlug(current.property_id, input.name, id);
      updateData.slug = newSlug;
      console.log('[RoomService] New slug:', newSlug);
    }
  }
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.room_size_sqm !== undefined) updateData.room_size_sqm = input.room_size_sqm;
  if (input.pricing_mode !== undefined) updateData.pricing_mode = input.pricing_mode;
  if (input.base_price_per_night !== undefined) updateData.base_price_per_night = input.base_price_per_night;
  if (input.additional_person_rate !== undefined) updateData.additional_person_rate = input.additional_person_rate;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.child_price_per_night !== undefined) updateData.child_price_per_night = input.child_price_per_night;
  if (input.child_free_until_age !== undefined) updateData.child_free_until_age = input.child_free_until_age;
  if (input.child_age_limit !== undefined) updateData.child_age_limit = input.child_age_limit;
  if (input.max_guests !== undefined) updateData.max_guests = input.max_guests;
  if (input.max_adults !== undefined) updateData.max_adults = input.max_adults;
  if (input.max_children !== undefined) updateData.max_children = input.max_children;
  if (input.min_nights !== undefined) updateData.min_nights = input.min_nights;
  if (input.max_nights !== undefined) updateData.max_nights = input.max_nights;
  if (input.inventory_mode !== undefined) updateData.inventory_mode = input.inventory_mode;
  if (input.total_units !== undefined) updateData.total_units = input.total_units;
  if (input.amenities !== undefined) updateData.amenities = input.amenities;
  if (input.extra_options !== undefined) updateData.extra_options = input.extra_options;
  if (input.featured_image !== undefined) updateData.featured_image = input.featured_image;
  if (input.gallery_images !== undefined) updateData.gallery_images = input.gallery_images;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  // Update and return the updated room data in one query
  console.log('[RoomService] Updating room in database...');
  console.log('[RoomService] Update data:', JSON.stringify(updateData, null, 2));

  const { data: updatedRoom, error } = await supabase
    .from('rooms')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  console.log('[RoomService] Database update completed');
  console.log('[RoomService] Error:', error);
  console.log('[RoomService] Updated room:', updatedRoom);

  if (error || !updatedRoom) {
    console.error('[RoomService] Update failed:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to update room');
  }

  // 💰 PRICE DEBUG: Log stored price from database after update
  if (input.base_price_per_night !== undefined) {
    console.log('💰 [ROOM_SERVICE] Database update successful - Room ID:', updatedRoom.id);
    console.log('💰 [ROOM_SERVICE] Stored price:', updatedRoom.base_price_per_night);
    console.log('💰 [ROOM_SERVICE] Stored price type:', typeof updatedRoom.base_price_per_night);
  }

  // Create audit log (non-blocking)
  console.log('[RoomService] Creating audit log (non-blocking)...');
  createAuditLog({
    actor_id: userId,
    action: 'room.updated' as any,
    entity_type: 'room' as any,
    entity_id: id,
    old_data: current as unknown as Record<string, unknown>,
    new_data: input as unknown as Record<string, unknown>,
  }).catch(err => console.error('Failed to create audit log:', err));

  // Return merged data - keep existing relationships from current, update room fields
  console.log('[RoomService] Preparing return data...');
  const result = {
    ...current,
    ...updatedRoom,
    // Preserve existing related data
    beds: current.beds,
    seasonal_rates: current.seasonal_rates,
    promotions: current.promotions,
    property_name: current.property_name,
    property_slug: current.property_slug,
  };

  console.log('[RoomService] updateRoom completed successfully');
  return result;
};

/**
 * Delete a room
 */
export const deleteRoom = async (
  id: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getRoomById(id, userId);

  // Check for existing bookings
  const { count: bookingCount } = await supabase
    .from('booking_rooms')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', id);

  if (bookingCount && bookingCount > 0) {
    throw new AppError(
      'CONFLICT',
      'Cannot delete room with existing bookings. Please deactivate it instead.'
    );
  }

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete room');
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'room.deleted' as any,
    entity_type: 'room' as any,
    entity_id: id,
    old_data: current as unknown as Record<string, unknown>,
  });
};

/**
 * Pause a room
 */
export const pauseRoom = async (
  id: string,
  userId: string,
  input: PauseRoomRequest
): Promise<RoomWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  await getRoomById(id, userId);

  const { error } = await supabase
    .from('rooms')
    .update({
      is_paused: true,
      paused_reason: input.reason || null,
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to pause room');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'room.paused' as any,
    entity_type: 'room' as any,
    entity_id: id,
    new_data: { reason: input.reason },
  });

  return getRoomById(id, userId);
};

/**
 * Unpause a room
 */
export const unpauseRoom = async (
  id: string,
  userId: string
): Promise<RoomWithDetails> => {
  const supabase = getAdminClient();

  // Verify ownership
  await getRoomById(id, userId);

  const { error } = await supabase
    .from('rooms')
    .update({
      is_paused: false,
      paused_reason: null,
      paused_at: null,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to unpause room');
  }

  await createAuditLog({
    actor_id: userId,
    action: 'room.unpaused' as any,
    entity_type: 'room' as any,
    entity_id: id,
  });

  return getRoomById(id, userId);
};

// ============================================================================
// ROOM BEDS
// ============================================================================

/**
 * Get default sleeps value for bed type
 */
const getBedDefaultSleeps = (bedType: string): number => {
  const defaults: Record<string, number> = {
    king: 2,
    queen: 2,
    double: 2,
    twin: 2,
    single: 1,
    bunk: 2,
    sofa_bed: 2,
    futon: 2,
    crib: 1,
    floor_mattress: 2,
  };
  return defaults[bedType] || 2;
};

/**
 * Add a bed to a room
 */
export const addRoomBed = async (
  roomId: string,
  userId: string,
  input: CreateRoomBedRequest
): Promise<RoomBed> => {
  const supabase = getAdminClient();

  // Verify room ownership
  await getRoomById(roomId, userId);

  const { data, error } = await supabase
    .from('room_beds')
    .insert({
      room_id: roomId,
      bed_type: input.bed_type,
      quantity: input.quantity,
      sleeps: input.sleeps ?? getBedDefaultSleeps(input.bed_type),
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to add bed');
  }

  return data;
};

/**
 * Update a room bed
 */
export const updateRoomBed = async (
  roomId: string,
  bedId: string,
  userId: string,
  input: UpdateRoomBedRequest
): Promise<RoomBed> => {
  const supabase = getAdminClient();

  // Verify room ownership
  await getRoomById(roomId, userId);

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.bed_type !== undefined) updateData.bed_type = input.bed_type;
  if (input.quantity !== undefined) updateData.quantity = input.quantity;
  if (input.sleeps !== undefined) updateData.sleeps = input.sleeps;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from('room_beds')
    .update(updateData)
    .eq('id', bedId)
    .eq('room_id', roomId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Bed not found');
  }

  return data;
};

/**
 * Delete a room bed
 */
export const deleteRoomBed = async (
  roomId: string,
  bedId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify room ownership
  await getRoomById(roomId, userId);

  const { error } = await supabase
    .from('room_beds')
    .delete()
    .eq('id', bedId)
    .eq('room_id', roomId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete bed');
  }
};

// ============================================================================
// SEASONAL RATES
// ============================================================================

/**
 * Add a seasonal rate
 */
export const addSeasonalRate = async (
  roomId: string,
  userId: string,
  input: CreateSeasonalRateRequest
): Promise<SeasonalRate> => {
  const supabase = getAdminClient();

  // Verify room ownership
  await getRoomById(roomId, userId);

  const { data, error } = await supabase
    .from('room_seasonal_rates')
    .insert({
      room_id: roomId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      start_date: input.start_date,
      end_date: input.end_date,
      price_per_night: input.price_per_night,
      additional_person_rate: input.additional_person_rate || null,
      pricing_mode_override: input.pricing_mode_override || null,
      priority: input.priority ?? 0,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to add seasonal rate');
  }

  return data;
};

/**
 * Update a seasonal rate
 */
export const updateSeasonalRate = async (
  roomId: string,
  rateId: string,
  userId: string,
  input: UpdateSeasonalRateRequest
): Promise<SeasonalRate> => {
  const supabase = getAdminClient();

  // Verify room ownership
  await getRoomById(roomId, userId);

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.start_date !== undefined) updateData.start_date = input.start_date;
  if (input.end_date !== undefined) updateData.end_date = input.end_date;
  if (input.price_per_night !== undefined) updateData.price_per_night = input.price_per_night;
  if (input.additional_person_rate !== undefined) updateData.additional_person_rate = input.additional_person_rate;
  if (input.pricing_mode_override !== undefined) updateData.pricing_mode_override = input.pricing_mode_override;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('room_seasonal_rates')
    .update(updateData)
    .eq('id', rateId)
    .eq('room_id', roomId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Seasonal rate not found');
  }

  return data;
};

/**
 * Delete a seasonal rate
 */
export const deleteSeasonalRate = async (
  roomId: string,
  rateId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify room ownership
  await getRoomById(roomId, userId);

  const { error } = await supabase
    .from('room_seasonal_rates')
    .delete()
    .eq('id', rateId)
    .eq('room_id', roomId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete seasonal rate');
  }
};

// ============================================================================
// PROMOTIONS
// ============================================================================

/**
 * Add a promotion to a room
 */
export const addRoomPromotion = async (
  roomId: string,
  userId: string,
  input: CreatePromotionRequest
): Promise<RoomPromotion> => {
  const supabase = getAdminClient();

  // Verify room ownership
  const room = await getRoomById(roomId, userId);

  // Create property-level promotion (room_id = null, use junction table for assignment)
  const { data, error } = await supabase
    .from('room_promotions')
    .insert({
      room_id: null,  // Property-level promotion
      property_id: room.property_id,
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      valid_from: input.valid_from || new Date().toISOString(),
      valid_until: input.valid_until || null,
      max_uses: input.max_uses || null,
      max_uses_per_customer: input.max_uses_per_customer ?? 1,
      min_booking_amount: input.min_booking_amount || null,
      min_nights: input.min_nights || null,
      is_claimable: input.is_claimable ?? false,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      throw new AppError('CONFLICT', 'A promotion with this code already exists');
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to add promotion');
  }

  // Assign promotion to room via junction table
  const { error: assignError } = await supabase
    .from('room_promotion_assignments')
    .insert({
      room_id: roomId,
      promotion_id: data.id,
      assigned_by: userId,
    });

  if (assignError) {
    // If assignment fails, delete the promotion to maintain data consistency
    await supabase.from('room_promotions').delete().eq('id', data.id);
    throw new AppError('INTERNAL_ERROR', 'Failed to assign promotion to room');
  }

  return data;
};

/**
 * Update a promotion
 */
export const updateRoomPromotion = async (
  roomId: string,
  promotionId: string,
  userId: string,
  input: UpdatePromotionRequest
): Promise<RoomPromotion> => {
  const supabase = getAdminClient();

  // Verify room ownership
  await getRoomById(roomId, userId);

  // Check if promotion is assigned to this room (via junction table)
  const { data: assignment, error: assignmentError } = await supabase
    .from('room_promotion_assignments')
    .select('id')
    .eq('room_id', roomId)
    .eq('promotion_id', promotionId)
    .single();

  if (assignmentError || !assignment) {
    throw new AppError('NOT_FOUND', 'Promotion not assigned to this room');
  }

  // Get current promotion to check if code is changing
  const { data: currentPromo, error: fetchError } = await supabase
    .from('room_promotions')
    .select('code, property_id, room_id')
    .eq('id', promotionId)
    .single();

  if (fetchError || !currentPromo) {
    throw new AppError('NOT_FOUND', 'Promotion not found');
  }

  const updateData: any = { updated_at: new Date().toISOString() };

  // Only update code if it's actually changing (to avoid uniqueness errors)
  if (input.code !== undefined) {
    const newCode = input.code.toUpperCase().trim();
    if (newCode !== currentPromo.code) {
      updateData.code = newCode;
    }
  }

  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.discount_type !== undefined) updateData.discount_type = input.discount_type;
  if (input.discount_value !== undefined) updateData.discount_value = input.discount_value;
  if (input.valid_from !== undefined) updateData.valid_from = input.valid_from;
  if (input.valid_until !== undefined) updateData.valid_until = input.valid_until;
  if (input.max_uses !== undefined) updateData.max_uses = input.max_uses;
  if (input.max_uses_per_customer !== undefined) updateData.max_uses_per_customer = input.max_uses_per_customer;
  if (input.min_booking_amount !== undefined) updateData.min_booking_amount = input.min_booking_amount;
  if (input.min_nights !== undefined) updateData.min_nights = input.min_nights;
  if (input.is_claimable !== undefined) updateData.is_claimable = input.is_claimable;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  // Update the promotion itself (don't filter by room_id since it might be property-level)
  const { data, error } = await supabase
    .from('room_promotions')
    .update(updateData)
    .eq('id', promotionId)
    .select()
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      throw new AppError('CONFLICT', 'A promotion with this code already exists');
    }
    throw new AppError('NOT_FOUND', 'Promotion not found');
  }

  return data;
};

/**
 * Delete a promotion (unassign from room via junction table)
 */
export const deleteRoomPromotion = async (
  roomId: string,
  promotionId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify room ownership
  await getRoomById(roomId, userId);

  // Delete the assignment (unassign promotion from room)
  const { error } = await supabase
    .from('room_promotion_assignments')
    .delete()
    .eq('room_id', roomId)
    .eq('promotion_id', promotionId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to unassign promotion from room');
  }
};

// ============================================================================
// ADD-ONS
// ============================================================================

/**
 * List add-ons for a property
 */
export const listPropertyAddOns = async (
  propertyId: string,
  userId: string
): Promise<AddOn[]> => {
  const supabase = getAdminClient();

  // Verify property ownership
  const property = await getProperty(propertyId);
  if (property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not own this property');
  }

  const { data, error } = await supabase
    .from('add_ons')
    .select('*')
    .eq('property_id', propertyId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch add-ons');
  }

  return data || [];
};

/**
 * Create an add-on
 */
export const createAddOn = async (
  propertyId: string,
  userId: string,
  input: CreateAddOnRequest
): Promise<AddOn> => {
  const supabase = getAdminClient();

  // Verify property ownership
  const property = await getProperty(propertyId);
  if (property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not own this property');
  }

  const { data, error } = await supabase
    .from('add_ons')
    .insert({
      property_id: propertyId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      pricing_type: input.pricing_type,
      currency: input.currency || 'ZAR',
      is_active: input.is_active ?? true,
      room_ids: input.room_ids || null,
      image_url: input.image_url || null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create add-on');
  }

  return data;
};

/**
 * Update an add-on
 */
export const updateAddOn = async (
  propertyId: string,
  addOnId: string,
  userId: string,
  input: UpdateAddOnRequest
): Promise<AddOn> => {
  const supabase = getAdminClient();

  // Verify property ownership
  const property = await getProperty(propertyId);
  if (property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not own this property');
  }

  const updateData: any = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.pricing_type !== undefined) updateData.pricing_type = input.pricing_type;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.room_ids !== undefined) updateData.room_ids = input.room_ids;
  if (input.image_url !== undefined) updateData.image_url = input.image_url;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from('add_ons')
    .update(updateData)
    .eq('id', addOnId)
    .eq('property_id', propertyId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Add-on not found');
  }

  return data;
};

/**
 * Delete an add-on
 */
export const deleteAddOn = async (
  propertyId: string,
  addOnId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify property ownership
  const property = await getProperty(propertyId);
  if (property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not own this property');
  }

  const { error } = await supabase
    .from('add_ons')
    .delete()
    .eq('id', addOnId)
    .eq('property_id', propertyId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete add-on');
  }
};

// ============================================================================
// PRICING CALCULATIONS
// ============================================================================

/**
 * Get effective price for a room on a date
 */
export const getEffectivePrice = async (
  roomId: string,
  date: string
): Promise<EffectivePrice> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .rpc('get_room_effective_price', {
      p_room_id: roomId,
      p_date: date,
    })
    .single();

  if (error || !data) {
    // Fallback to room base price
    const room = await getRoomById(roomId);
    return {
      price_per_night: room.base_price_per_night,
      additional_person_rate: room.additional_person_rate,
      pricing_mode: room.pricing_mode,
      rate_name: 'Base Rate',
      is_seasonal: false,
    };
  }

  return data;
};

/**
 * Calculate price for a stay
 */
export const calculatePrice = async (
  roomId: string,
  request: PriceCalculationRequest
): Promise<PriceCalculationResponse> => {
  const room = await getRoomById(roomId);

  const checkIn = new Date(request.check_in);
  const checkOut = new Date(request.check_out);
  const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  if (totalNights < 1) {
    throw new AppError('VALIDATION_ERROR', 'Check-out must be after check-in');
  }

  // Get nightly rates
  const nightlyRates: NightlyRate[] = [];
  let baseRoomTotal = 0;

  for (let i = 0; i < totalNights; i++) {
    const date = new Date(checkIn);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const effectivePrice = await getEffectivePrice(roomId, dateStr);

    nightlyRates.push({
      date: dateStr,
      rate: effectivePrice.price_per_night,
      rate_name: effectivePrice.rate_name,
      is_seasonal: effectivePrice.is_seasonal,
    });

    baseRoomTotal += effectivePrice.price_per_night;
  }

  // Calculate based on pricing mode
  const adults = request.adults;
  const children = request.children || 0;
  const childrenAges = request.children_ages || [];

  let adultTotal = 0;
  let childTotal = 0;
  let payingChildren = 0;
  let freeChildren = 0;

  // Count paying vs free children
  childrenAges.forEach((age) => {
    if (age < room.child_free_until_age) {
      freeChildren++;
    } else if (age <= room.child_age_limit) {
      payingChildren++;
    }
  });

  // Children without ages specified are assumed to be paying children
  const unspecifiedChildren = Math.max(0, children - childrenAges.length);
  payingChildren += unspecifiedChildren;

  switch (room.pricing_mode) {
    case 'per_unit':
      // Flat rate regardless of guests
      adultTotal = baseRoomTotal;
      childTotal = 0;
      break;

    case 'per_person':
      // Price × number of guests
      adultTotal = baseRoomTotal * adults;
      if (room.child_price_per_night !== null) {
        childTotal = room.child_price_per_night * payingChildren * totalNights;
      } else {
        childTotal = baseRoomTotal * payingChildren;
      }
      break;

    case 'per_person_sharing':
      // Base rate + additional for extra guests
      adultTotal = baseRoomTotal; // First person
      if (adults > 1) {
        adultTotal += (room.additional_person_rate * (adults - 1) * totalNights);
      }
      if (room.child_price_per_night !== null) {
        childTotal = room.child_price_per_night * payingChildren * totalNights;
      } else {
        childTotal = room.additional_person_rate * payingChildren * totalNights;
      }
      break;
  }

  const roomTotal = adultTotal + childTotal;
  const perNightAverage = roomTotal / totalNights;

  return {
    room_id: roomId,
    pricing_mode: room.pricing_mode,
    currency: room.currency,
    nightly_rates: nightlyRates,
    total_nights: totalNights,
    base_room_total: baseRoomTotal,
    adult_total: adultTotal,
    child_total: childTotal,
    room_total: roomTotal,
    breakdown: {
      adults,
      children,
      paying_children: payingChildren,
      free_children: freeChildren,
      per_night_average: perNightAverage,
    },
  };
};

// ============================================================================
// AVAILABILITY
// ============================================================================

/**
 * Check room availability
 */
export const checkAvailability = async (
  roomId: string,
  request: AvailabilityCheckRequest
): Promise<AvailabilityCheckResponse> => {
  console.log('=== [ROOM_SERVICE] checkAvailability called ===');
  console.log('[ROOM_SERVICE] Room ID:', roomId);
  console.log('[ROOM_SERVICE] Check-in:', request.check_in);
  console.log('[ROOM_SERVICE] Check-out:', request.check_out);
  console.log('[ROOM_SERVICE] Exclude booking ID:', request.exclude_booking_id);

  const supabase = getAdminClient();

  const room = await getRoomById(roomId);
  console.log('[ROOM_SERVICE] Room details:', {
    id: room.id,
    name: room.name,
    inventory_mode: room.inventory_mode,
    total_units: room.total_units,
  });

  const { data, error } = await supabase
    .rpc('check_room_availability', {
      p_room_id: roomId,
      p_check_in: request.check_in,
      p_check_out: request.check_out,
      p_exclude_booking_id: request.exclude_booking_id || null,
    })
    .single();

  if (error) {
    console.error('[ROOM_SERVICE] ❌ Availability check error:', error);
    console.error('[ROOM_SERVICE] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    // CRITICAL FIX: Do NOT return available when check fails
    // This was causing double bookings!
    throw new AppError(
      'INTERNAL_ERROR',
      `Failed to check room availability: ${error.message}. Please try again or contact support.`
    );
  }

  console.log('[ROOM_SERVICE] Availability check result:', {
    is_available: data.is_available,
    available_units: data.available_units,
    total_units: room.total_units,
    conflicting_bookings_count: data.conflicting_bookings?.length || 0,
  });

  if (!data.is_available) {
    console.log('[ROOM_SERVICE] ⚠️ Room NOT available - conflicting bookings:', data.conflicting_bookings);
  } else {
    console.log('[ROOM_SERVICE] ✅ Room is available');
  }

  return {
    room_id: roomId,
    is_available: data.is_available,
    available_units: data.available_units,
    total_units: room.total_units,
    conflicting_bookings: data.conflicting_bookings || [],
  };
};

// ============================================================================
// LIMIT CHECKING
// ============================================================================

/**
 * Get room limit info for a user
 */
export const getRoomLimitInfo = async (userId: string): Promise<RoomLimitInfo> => {
  const supabase = getAdminClient();

  // Get user's subscription
  const subscription = await getUserSubscription(userId);

  // Count current rooms across all user's properties
  const { count: currentCount } = await supabase
    .from('rooms')
    .select(`
      *,
      properties!inner (owner_id)
    `, { count: 'exact', head: true })
    .eq('properties.owner_id', userId);

  const roomCount = currentCount || 0;

  // If no subscription, allow 5 rooms by default (free tier)
  if (!subscription) {
    return {
      current_count: roomCount,
      max_allowed: 5,
      is_unlimited: false,
      can_create: roomCount < 5,
      remaining: Math.max(0, 5 - roomCount),
    };
  }

  // Get max_rooms limit from subscription
  const maxRooms = subscription.limits['max_rooms'] ?? 5;

  // -1 means unlimited
  if (maxRooms === -1) {
    return {
      current_count: roomCount,
      max_allowed: -1,
      is_unlimited: true,
      can_create: true,
      remaining: -1,
    };
  }

  return {
    current_count: roomCount,
    max_allowed: maxRooms,
    is_unlimited: false,
    can_create: roomCount < maxRooms,
    remaining: Math.max(0, maxRooms - roomCount),
  };
};

/**
 * List rooms for a property (public-facing for discovery)
 */
export const listPropertyRoomsPublic = async (
  propertyId: string
): Promise<RoomWithDetails[]> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .eq('is_paused', false)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch rooms');
  }

  // Fetch beds for rooms
  const roomIds = (data || []).map((r) => r.id);

  const { data: bedsData } = await supabase
    .from('room_beds')
    .select('*')
    .in('room_id', roomIds)
    .order('sort_order', { ascending: true });

  return (data || []).map((room) => ({
    ...room,
    beds: (bedsData || []).filter((b: any) => b.room_id === room.id),
    seasonal_rates: [],
    promotions: [],
  }));
};


// ============================================================================
// PROMOTIONS - CENTRALIZED MANAGEMENT
// ============================================================================

/**
 * List all promotions across user's properties (for centralized management)
 */
export const listAllPromotions = async (
  userId: string,
  propertyId?: string
): Promise<RoomPromotion[]> => {
  const supabase = getAdminClient();

  // Get user's properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', userId);

  if (!properties || properties.length === 0) {
    return [];
  }

  const propertyIds = properties.map((p) => p.id);

  // Build query for promotions with room count
  let query = supabase
    .from('promotions_with_room_count')
    .select('*')
    .in('property_id', propertyIds);

  // Apply property filter if specified
  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new AppError('INTERNAL_ERROR', `Failed to fetch promotions: ${error.message}`);
  }

  return (data || []) as RoomPromotion[];
};

/**
 * Get room assignments for a promotion
 */
export const getPromotionAssignments = async (
  promotionId: string,
  userId: string
): Promise<{ room_id: string; room_name: string }[]> => {
  const supabase = getAdminClient();

  // Verify user owns the promotion
  const { data: promo } = await supabase
    .from('room_promotions')
    .select('property_id, properties\!inner(owner_id)')
    .eq('id', promotionId)
    .single();

  if (!promo || (promo.properties as any).owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have permission to view this promotion');
  }

  // Get room assignments
  const { data, error } = await supabase
    .from('room_promotion_assignments')
    .select(`
      room_id,
      rooms\!inner (
        id,
        name
      )
    `)
    .eq('promotion_id', promotionId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', `Failed to fetch promotion assignments: ${error.message}`);
  }

  return (data || []).map((assignment: any) => ({
    room_id: assignment.room_id,
    room_name: assignment.rooms.name,
  }));
};

/**
 * Assign promotion to multiple rooms
 */
export const assignPromotionToRooms = async (
  promotionId: string,
  roomIds: string[],
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify user owns the promotion
  const { data: promo } = await supabase
    .from('room_promotions')
    .select('property_id, properties\!inner(owner_id)')
    .eq('id', promotionId)
    .single();

  if (!promo || (promo.properties as any).owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have permission to modify this promotion');
  }

  // Verify user owns all rooms
  for (const roomId of roomIds) {
    await verifyRoomOwnership(roomId, userId);
  }

  // Insert assignments
  const assignments = roomIds.map((roomId) => ({
    room_id: roomId,
    promotion_id: promotionId,
    assigned_by: userId,
  }));

  const { error } = await supabase
    .from('room_promotion_assignments')
    .upsert(assignments, { onConflict: 'room_id,promotion_id' });

  if (error) {
    throw new AppError('INTERNAL_ERROR', `Failed to assign promotion to rooms: ${error.message}`);
  }
};

/**
 * Unassign promotion from a room
 */
export const unassignPromotionFromRoom = async (
  promotionId: string,
  roomId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify user owns the promotion
  const { data: promo } = await supabase
    .from('room_promotions')
    .select('property_id, properties\!inner(owner_id)')
    .eq('id', promotionId)
    .single();

  if (!promo || (promo.properties as any).owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have permission to modify this promotion');
  }

  // Verify room ownership
  await verifyRoomOwnership(roomId, userId);

  // Delete the assignment
  const { error } = await supabase
    .from('room_promotion_assignments')
    .delete()
    .eq('promotion_id', promotionId)
    .eq('room_id', roomId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', `Failed to unassign promotion: ${error.message}`);
  }
};

// ============================================================================
// PROMOTIONS - GLOBAL PROPERTY-LEVEL CRUD OPERATIONS
// ============================================================================

/**
 * Create a promotion at property level (without room_id)
 */
export const createPromotionGlobal = async (
  userId: string,
  propertyId: string,
  data: {
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
): Promise<RoomPromotion> => {
  const supabase = getAdminClient();

  // Verify user owns the property
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, owner_id')
    .eq('id', propertyId)
    .single();

  if (propertyError || !property) {
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  if (property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have permission to create promotions for this property');
  }

  // Create the promotion (property-level, no room_id)
  const { data: promotion, error } = await supabase
    .from('room_promotions')
    .insert({
      property_id: propertyId,
      room_id: null,  // Property-level promotion
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description || null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      valid_from: data.valid_from || null,
      valid_until: data.valid_until || null,
      max_uses: data.max_uses || null,
      max_uses_per_customer: data.max_uses_per_customer || null,
      min_booking_amount: data.min_booking_amount || null,
      min_nights: data.min_nights || null,
      is_claimable: data.is_claimable ?? true,
      is_active: data.is_active ?? true,
      uses_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', `Failed to create promotion: ${error.message}`);
  }

  return promotion as RoomPromotion;
};

/**
 * Update a promotion by ID (property-level)
 */
export const updatePromotionGlobal = async (
  userId: string,
  promotionId: string,
  data: {
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
): Promise<RoomPromotion> => {
  const supabase = getAdminClient();

  // Verify user owns the promotion
  const { data: existingPromo } = await supabase
    .from('room_promotions')
    .select('property_id, properties!inner(owner_id)')
    .eq('id', promotionId)
    .single();

  if (!existingPromo || (existingPromo.properties as any).owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have permission to update this promotion');
  }

  // Build update data
  const updateData: any = {};
  if (data.code !== undefined) updateData.code = data.code.toUpperCase();
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
  if (data.discount_value !== undefined) updateData.discount_value = data.discount_value;
  if (data.valid_from !== undefined) updateData.valid_from = data.valid_from;
  if (data.valid_until !== undefined) updateData.valid_until = data.valid_until;
  if (data.max_uses !== undefined) updateData.max_uses = data.max_uses;
  if (data.max_uses_per_customer !== undefined) updateData.max_uses_per_customer = data.max_uses_per_customer;
  if (data.min_booking_amount !== undefined) updateData.min_booking_amount = data.min_booking_amount;
  if (data.min_nights !== undefined) updateData.min_nights = data.min_nights;
  if (data.is_claimable !== undefined) updateData.is_claimable = data.is_claimable;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  updateData.updated_at = new Date().toISOString();

  // Update the promotion
  const { data: promotion, error } = await supabase
    .from('room_promotions')
    .update(updateData)
    .eq('id', promotionId)
    .select()
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', `Failed to update promotion: ${error.message}`);
  }

  return promotion as RoomPromotion;
};

/**
 * Delete a promotion by ID (property-level)
 */
export const deletePromotionGlobal = async (
  userId: string,
  promotionId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify user owns the promotion
  const { data: promo } = await supabase
    .from('room_promotions')
    .select('property_id, properties!inner(owner_id)')
    .eq('id', promotionId)
    .single();

  if (!promo || (promo.properties as any).owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have permission to delete this promotion');
  }

  // Check if promotion is assigned to any rooms
  const { data: assignments, error: assignmentError } = await supabase
    .from('room_promotion_assignments')
    .select('room_id')
    .eq('promotion_id', promotionId);

  if (assignmentError) {
    throw new AppError('INTERNAL_ERROR', `Failed to check promotion assignments: ${assignmentError.message}`);
  }

  if (assignments && assignments.length > 0) {
    throw new AppError(
      'BAD_REQUEST',
      `Cannot delete promotion: it is assigned to ${assignments.length} room(s). Please unassign it first.`
    );
  }

  // Delete the promotion
  const { error } = await supabase
    .from('room_promotions')
    .delete()
    .eq('id', promotionId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', `Failed to delete promotion: ${error.message}`);
  }
};

/**
 * Get a promotion by ID (for editing)
 */
export const getPromotionById = async (
  userId: string,
  promotionId: string
): Promise<RoomPromotion> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('room_promotions')
    .select('*')
    .eq('id', promotionId)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Promotion not found');
  }

  // Verify ownership through property
  const { data: property } = await supabase
    .from('properties')
    .select('owner_id')
    .eq('id', data.property_id)
    .single();

  if (!property || property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have permission to access this promotion');
  }

  return data as RoomPromotion;
};

// ============================================================================
// IMAGE UPLOADS
// ============================================================================

/**
 * Upload featured image for a room
 */
export const uploadFeaturedImage = async (
  roomId: string,
  userId: string,
  file: Express.Multer.File
): Promise<string> => {
  const supabase = getAdminClient();

  // Verify ownership
  const room = await getRoomById(roomId, userId);

  // Delete old image if exists
  if (room.featured_image) {
    try {
      const oldPath = room.featured_image.split('/room-images/')[1];
      if (oldPath) {
        await supabase.storage.from('room-images').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors - file may not exist
    }
  }

  // Generate unique filename
  const ext = file.originalname.split('.').pop() || 'jpg';
  const filename = `${roomId}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('room-images')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new AppError('INTERNAL_ERROR', `Failed to upload featured image: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('room-images')
    .getPublicUrl(filename);

  const imageUrl = urlData.publicUrl;

  // Update room record
  const { error: updateError } = await supabase
    .from('rooms')
    .update({ featured_image: imageUrl })
    .eq('id', roomId);

  if (updateError) {
    console.error('Failed to update room with featured image:', updateError);
    throw new AppError('INTERNAL_ERROR', `Failed to update room: ${updateError.message}`);
  }

  return imageUrl;
};

/**
 * Delete featured image for a room
 */
export const deleteFeaturedImage = async (
  roomId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  const room = await getRoomById(roomId, userId);

  if (!room.featured_image) {
    throw new AppError('NOT_FOUND', 'No featured image to delete');
  }

  // Delete from storage
  try {
    const filePath = room.featured_image.split('/room-images/')[1];
    if (filePath) {
      await supabase.storage.from('room-images').remove([filePath]);
    }
  } catch (error) {
    console.error('Failed to delete image from storage:', error);
    // Continue even if storage deletion fails
  }

  // Update room record
  const { error: updateError } = await supabase
    .from('rooms')
    .update({ featured_image: null })
    .eq('id', roomId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', `Failed to update room: ${updateError.message}`);
  }
};

/**
 * Upload gallery image for a room
 */
export const uploadGalleryImage = async (
  roomId: string,
  userId: string,
  file: Express.Multer.File
): Promise<string> => {
  const supabase = getAdminClient();

  // Verify ownership
  const room = await getRoomById(roomId, userId);

  // Generate unique filename
  const ext = file.originalname.split('.').pop() || 'jpg';
  const filename = `${roomId}/gallery/${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('room-images')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new AppError('INTERNAL_ERROR', `Failed to upload gallery image: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('room-images')
    .getPublicUrl(filename);

  const imageUrl = urlData.publicUrl;

  // Add to gallery_images array
  const currentGallery = room.gallery_images || [];
  const newImage = {
    url: imageUrl,
    caption: null,
    order: currentGallery.length,
  };
  const updatedGallery = [...currentGallery, newImage];

  // Update room record
  const { error: updateError } = await supabase
    .from('rooms')
    .update({ gallery_images: updatedGallery })
    .eq('id', roomId);

  if (updateError) {
    console.error('Failed to update room with gallery image:', updateError);
    throw new AppError('INTERNAL_ERROR', `Failed to update room: ${updateError.message}`);
  }

  return imageUrl;
};

/**
 * Delete gallery image for a room
 */
export const deleteGalleryImage = async (
  roomId: string,
  userId: string,
  imageUrl: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  const room = await getRoomById(roomId, userId);

  if (!room.gallery_images || room.gallery_images.length === 0) {
    throw new AppError('NOT_FOUND', 'No gallery images to delete');
  }

  // Remove image from array
  const updatedGallery = (room.gallery_images || [])
    .filter((img: any) => img.url !== imageUrl)
    .map((img: any, index: number) => ({ ...img, order: index }));

  // Delete from storage
  try {
    const filePath = imageUrl.split('/room-images/')[1];
    if (filePath) {
      await supabase.storage.from('room-images').remove([filePath]);
    }
  } catch (error) {
    console.error('Failed to delete image from storage:', error);
    // Continue even if storage deletion fails
  }

  // Update room record
  const { error: updateError } = await supabase
    .from('rooms')
    .update({ gallery_images: updatedGallery })
    .eq('id', roomId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', `Failed to update room: ${updateError.message}`);
  }
};
