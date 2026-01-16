import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { getUserSubscription } from './billing.service';
import { getCompanyById } from './company.service';
import {
  Property,
  PropertyWithCompany,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertyListParams,
  PropertyListResponse,
  PropertyLimitInfo,
} from '../types/property.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a URL-friendly slug from a name
 */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
};

/**
 * Generate a unique slug by appending a number if needed
 */
const generateUniqueSlug = async (name: string, excludeId?: string): Promise<string> => {
  const supabase = getAdminClient();
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabase
      .from('properties')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.single();

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    if (counter > 100) {
      // Fallback: append timestamp
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
};

// ============================================================================
// PROPERTY CRUD OPERATIONS
// ============================================================================

/**
 * List all properties for a user
 */
export const listUserProperties = async (
  userId: string,
  params?: PropertyListParams
): Promise<PropertyListResponse> => {
  const supabase = getAdminClient();

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  // Build query - get properties where owner_id matches or company belongs to user
  let query = supabase
    .from('properties')
    .select(`
      *,
      companies (
        name,
        logo_url
      )
    `, { count: 'exact' })
    .eq('owner_id', userId);

  // Filters
  if (params?.company_id) {
    query = query.eq('company_id', params.company_id);
  }

  if (params?.is_active !== undefined) {
    query = query.eq('is_active', params.is_active);
  }

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%,address_city.ilike.%${params.search}%`);
  }

  // Sorting
  const sortBy = params?.sortBy || 'created_at';
  const sortOrder = params?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Supabase error fetching properties:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to fetch properties: ${error.message}`);
  }

  const total = count || 0;

  // Map to PropertyWithCompany format
  const properties: PropertyWithCompany[] = (data || []).map((property: any) => ({
    ...property,
    company_name: property.companies?.name || null,
    company_logo_url: property.companies?.logo_url || null,
    owner_full_name: null, // Owner info not joined due to FK constraints
    companies: undefined, // Remove the raw join data
  }));

  return {
    properties,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a single property by ID
 */
export const getPropertyById = async (
  id: string,
  userId: string
): Promise<PropertyWithCompany> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      companies (
        name,
        logo_url
      )
    `)
    .eq('id', id)
    .eq('owner_id', userId)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  return {
    ...data,
    company_name: data.companies?.name || null,
    company_logo_url: data.companies?.logo_url || null,
    owner_full_name: null,
    companies: undefined,
  };
};

/**
 * Get a property by ID (admin - no user check)
 */
export const getProperty = async (id: string): Promise<PropertyWithCompany> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      companies (
        name,
        logo_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  return {
    ...data,
    company_name: data.companies?.name || null,
    company_logo_url: data.companies?.logo_url || null,
    owner_full_name: null,
    companies: undefined,
  };
};

/**
 * Create a new property
 */
export const createProperty = async (
  userId: string,
  input: CreatePropertyRequest
): Promise<PropertyWithCompany> => {
  const supabase = getAdminClient();

  // Check property limit
  const limitInfo = await getPropertyLimitInfo(userId);
  if (!limitInfo.can_create) {
    throw new AppError(
      'FORBIDDEN',
      `You have reached your property limit (${limitInfo.max_allowed}). Please upgrade your subscription to create more properties.`
    );
  }

  // Verify company ownership
  await getCompanyById(input.company_id, userId);

  // Validate required fields
  if (!input.name || !input.name.trim()) {
    throw new AppError('VALIDATION_ERROR', 'Property name is required');
  }

  // Generate slug if not provided
  const slug = input.slug?.trim() || await generateUniqueSlug(input.name);

  const { data, error } = await supabase
    .from('properties')
    .insert({
      owner_id: userId,
      company_id: input.company_id,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      video_url: input.video_url?.trim() || null,
      show_video: input.show_video !== undefined ? input.show_video : true,
      terms_and_conditions: input.terms_and_conditions?.trim() || null,
      address_street: input.address_street?.trim() || null,
      address_city: input.address_city?.trim() || null,
      address_state: input.address_state?.trim() || null,
      address_postal_code: input.address_postal_code?.trim() || null,
      address_country: input.address_country?.trim() || 'United States',
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      website: input.website?.trim() || null,
      settings: input.settings || {},
      currency: input.currency?.trim() || null,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      // Unique constraint violation - likely slug
      throw new AppError('CONFLICT', 'A property with this slug already exists');
    }
    throw new AppError('INTERNAL_ERROR', 'Failed to create property');
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.created' as any,
    entity_type: 'property' as any,
    entity_id: data.id,
    new_data: input as unknown as Record<string, unknown>,
  });

  return getPropertyById(data.id, userId);
};

/**
 * Update a property
 */
export const updateProperty = async (
  id: string,
  userId: string,
  input: UpdatePropertyRequest
): Promise<PropertyWithCompany> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getPropertyById(id, userId);

  // If changing company, verify new company ownership
  if (input.company_id && input.company_id !== current.company_id) {
    await getCompanyById(input.company_id, userId);
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Only update fields that are provided
  if (input.company_id !== undefined) updateData.company_id = input.company_id;
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.slug !== undefined) {
    // Verify slug is unique
    const newSlug = input.slug.trim();
    const { data: existingSlug } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', newSlug)
      .neq('id', id)
      .single();

    if (existingSlug) {
      throw new AppError('CONFLICT', 'A property with this slug already exists');
    }
    updateData.slug = newSlug;
  }
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.address_street !== undefined) updateData.address_street = input.address_street?.trim() || null;
  if (input.address_city !== undefined) updateData.address_city = input.address_city?.trim() || null;
  if (input.address_state !== undefined) updateData.address_state = input.address_state?.trim() || null;
  if (input.address_postal_code !== undefined) updateData.address_postal_code = input.address_postal_code?.trim() || null;
  if (input.address_country !== undefined) updateData.address_country = input.address_country?.trim() || null;
  if (input.phone !== undefined) updateData.phone = input.phone?.trim() || null;
  if (input.email !== undefined) updateData.email = input.email?.trim() || null;
  if (input.website !== undefined) updateData.website = input.website?.trim() || null;
  if (input.settings !== undefined) updateData.settings = input.settings;
  if (input.currency !== undefined) updateData.currency = input.currency?.trim() || null;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  // Listing Details Fields
  if (input.property_type !== undefined) updateData.property_type = input.property_type?.trim() || null;
  if (input.categories !== undefined) updateData.categories = input.categories;
  // Hierarchical location
  if (input.country_id !== undefined) updateData.country_id = input.country_id || null;
  if (input.province_id !== undefined) updateData.province_id = input.province_id || null;
  if (input.city_id !== undefined) updateData.city_id = input.city_id || null;
  if (input.location_lat !== undefined) updateData.location_lat = input.location_lat;
  if (input.location_lng !== undefined) updateData.location_lng = input.location_lng;
  if (input.listing_title !== undefined) updateData.listing_title = input.listing_title?.trim() || null;
  if (input.listing_description !== undefined) updateData.listing_description = input.listing_description?.trim() || null;
  if (input.highlights !== undefined) updateData.highlights = input.highlights;
  if (input.gallery_images !== undefined) updateData.gallery_images = input.gallery_images;
  if (input.video_url !== undefined) updateData.video_url = input.video_url?.trim() || null;
  if (input.show_video !== undefined) updateData.show_video = input.show_video;
  if (input.featured_image_url !== undefined) updateData.featured_image_url = input.featured_image_url;
  if (input.check_in_time !== undefined) updateData.check_in_time = input.check_in_time;
  if (input.check_out_time !== undefined) updateData.check_out_time = input.check_out_time;
  if (input.cancellation_policy !== undefined) updateData.cancellation_policy = input.cancellation_policy?.trim() || null;

  // DEBUG: Terms and conditions
  if (input.terms_and_conditions !== undefined) {
    console.log('\n🔍 Updating terms_and_conditions:');
    console.log('  - Property ID:', id);
    console.log('  - Input value type:', typeof input.terms_and_conditions);
    console.log('  - Input value length:', input.terms_and_conditions?.length || 0);
    console.log('  - Input value preview:', input.terms_and_conditions ? input.terms_and_conditions.substring(0, 100) + '...' : 'null/empty');
    console.log('  - After trim:', input.terms_and_conditions?.trim().substring(0, 100) + '...');
    updateData.terms_and_conditions = input.terms_and_conditions?.trim() || null;
    console.log('  - Final value to save:', updateData.terms_and_conditions ? `${updateData.terms_and_conditions.length} chars` : 'null');
  }

  if (input.amenities !== undefined) updateData.amenities = input.amenities;
  if (input.house_rules !== undefined) updateData.house_rules = input.house_rules;
  if (input.whats_included !== undefined) updateData.whats_included = input.whats_included;
  if (input.promotions !== undefined) updateData.promotions = input.promotions;

  console.log('\n📤 Updating property in database...');
  const { data, error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', id)
    .eq('owner_id', userId)
    .select()
    .single();

  console.log('  - Update result:', error ? 'ERROR' : 'SUCCESS');
  if (data) {
    console.log('  - Returned terms_and_conditions:', data.terms_and_conditions ? `${data.terms_and_conditions.length} chars` : 'null');
  }

  if (error || !data) {
    console.error('Supabase update error:', error);
    throw new AppError('INTERNAL_ERROR', `Failed to update property: ${error?.message || 'Unknown error'}`);
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.updated' as any,
    entity_type: 'property' as any,
    entity_id: id,
    old_data: current as unknown as Record<string, unknown>,
    new_data: input as unknown as Record<string, unknown>,
  });

  return getPropertyById(id, userId);
};

/**
 * Delete a property
 */
export const deleteProperty = async (
  id: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getPropertyById(id, userId);

  // TODO: Check if property has rooms/bookings before deleting

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete property');
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.deleted' as any,
    entity_type: 'property' as any,
    entity_id: id,
    old_data: current as unknown as Record<string, unknown>,
  });
};

// ============================================================================
// PUBLIC LISTING MANAGEMENT
// ============================================================================

/**
 * Check if property meets requirements for public listing
 */
export const checkListingReadiness = async (propertyId: string): Promise<{
  ready: boolean;
  missing: string[];
}> => {
  const supabase = getAdminClient();

  // Get property details
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('*, rooms(count)')
    .eq('id', propertyId)
    .single();

  if (propertyError || !property) {
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  const missing: string[] = [];

  // 1. Check for active rooms
  const { count: roomCount } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', propertyId)
    .eq('is_active', true);

  if (!roomCount || roomCount === 0) {
    missing.push('At least 1 active room');
  }

  // 2. Check for featured image
  if (!property.featured_image_url) {
    missing.push('Featured image');
  }

  // 3. Check for gallery images (at least 3)
  const galleryCount = property.gallery_images?.length || 0;
  if (galleryCount < 3) {
    missing.push(`Gallery images (${galleryCount}/3 minimum)`);
  }

  // 4. Check for description (at least 100 characters)
  const descriptionLength = property.listing_description?.length || 0;
  if (descriptionLength < 100) {
    missing.push(`Detailed description (${descriptionLength}/100 characters minimum)`);
  }

  // 5. Check for amenities (at least 3)
  const amenitiesCount = property.amenities?.length || 0;
  if (amenitiesCount < 3) {
    missing.push(`Amenities (${amenitiesCount}/3 minimum)`);
  }

  // 6. Check for location (coordinates or city_id)
  const hasLocation =
    (property.location_lat && property.location_lng) ||
    property.city_id;

  if (!hasLocation) {
    missing.push('Location (coordinates or city)');
  }

  // 7. Check for listing title
  if (!property.listing_title) {
    missing.push('Listing title');
  }

  // 8. Check for at least one category
  const categoriesCount = property.categories?.length || 0;
  if (categoriesCount === 0) {
    missing.push('At least 1 category');
  }

  return {
    ready: missing.length === 0,
    missing,
  };
};

/**
 * Toggle public listing visibility
 */
export const togglePublicListing = async (
  propertyId: string,
  userId: string,
  isListed: boolean
): Promise<void> => {
  const supabase = getAdminClient();

  // 1. Verify ownership
  const { data: property, error: fetchError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .eq('owner_id', userId)
    .single();

  if (fetchError || !property) {
    throw new AppError('FORBIDDEN', 'Property not found or access denied');
  }

  // 2. Update is_listed_publicly (no requirements check - user can enable anytime)
  const updateData: any = {
    is_listed_publicly: isListed,
    updated_at: new Date().toISOString(),
  };

  // Set listed_at on first enable
  if (isListed && !property.listed_at) {
    updateData.listed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', propertyId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update listing status');
  }

  // 4. Create audit log
  await createAuditLog({
    actor_id: userId,
    action: isListed ? ('property.listed' as any) : ('property.unlisted' as any),
    entity_type: 'property' as any,
    entity_id: propertyId,
    new_data: { is_listed_publicly: isListed } as unknown as Record<string, unknown>,
  });
};

// ============================================================================
// LIMIT CHECKING
// ============================================================================

/**
 * Get property limit info for a user
 */
export const getPropertyLimitInfo = async (userId: string): Promise<PropertyLimitInfo> => {
  const supabase = getAdminClient();

  // Get user's subscription
  const subscription = await getUserSubscription(userId);

  // Count current properties
  const { count: currentCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId);

  const propertyCount = currentCount || 0;

  // If no subscription, allow 1 property by default
  if (!subscription) {
    return {
      current_count: propertyCount,
      max_allowed: 1,
      is_unlimited: false,
      can_create: propertyCount < 1,
      remaining: Math.max(0, 1 - propertyCount),
    };
  }

  // Get max_properties limit from subscription
  const maxProperties = subscription.limits['max_properties'] ?? 1;

  // -1 means unlimited
  if (maxProperties === -1) {
    return {
      current_count: propertyCount,
      max_allowed: -1,
      is_unlimited: true,
      can_create: true,
      remaining: -1,
    };
  }

  return {
    current_count: propertyCount,
    max_allowed: maxProperties,
    is_unlimited: false,
    can_create: propertyCount < maxProperties,
    remaining: Math.max(0, maxProperties - propertyCount),
  };
};

/**
 * Check if user can create a property
 */
export const canCreateProperty = async (userId: string): Promise<boolean> => {
  const limitInfo = await getPropertyLimitInfo(userId);
  return limitInfo.can_create;
};

// ============================================================================
// IMAGE UPLOAD OPERATIONS
// ============================================================================

/**
 * Upload property featured image
 */
export const uploadFeaturedImage = async (
  propertyId: string,
  userId: string,
  file: Express.Multer.File
): Promise<string> => {
  const supabase = getAdminClient();

  // Verify ownership
  const property = await getPropertyById(propertyId, userId);

  // Delete old image if exists
  if (property.featured_image_url) {
    try {
      const oldPath = property.featured_image_url.split('/property-images/')[1];
      if (oldPath) {
        await supabase.storage.from('property-images').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors - file may not exist
    }
  }

  // Generate unique filename
  const ext = file.originalname.split('.').pop() || 'jpg';
  const filename = `${propertyId}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('property-images')
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
    .from('property-images')
    .getPublicUrl(filename);

  const imageUrl = urlData.publicUrl;

  // Update property with new image URL
  const { error: updateError } = await supabase
    .from('properties')
    .update({
      featured_image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .eq('owner_id', userId);

  if (updateError) {
    console.error('Database update error for featured image:', updateError);
    throw new AppError('INTERNAL_ERROR', `Failed to update property image: ${updateError.message}`);
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.image_uploaded' as any,
    entity_type: 'property' as any,
    entity_id: propertyId,
    new_data: { featured_image_url: imageUrl },
  });

  return imageUrl;
};

/**
 * Upload property logo
 */
export const uploadLogo = async (
  propertyId: string,
  userId: string,
  file: Express.Multer.File
): Promise<string> => {
  const supabase = getAdminClient();

  // Verify ownership
  const property = await getPropertyById(propertyId, userId);

  // Delete old logo if exists
  if (property.logo_url) {
    try {
      const oldPath = property.logo_url.split('/property-logos/')[1];
      if (oldPath) {
        await supabase.storage.from('property-logos').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors - file may not exist
    }
  }

  // Generate unique filename
  const ext = file.originalname.split('.').pop() || 'png';
  const filename = `${propertyId}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('property-logos')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to upload property logo');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('property-logos')
    .getPublicUrl(filename);

  const logoUrl = urlData.publicUrl;

  // Update property with new logo URL
  const { error: updateError } = await supabase
    .from('properties')
    .update({
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .eq('owner_id', userId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update property logo');
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.logo_uploaded' as any,
    entity_type: 'property' as any,
    entity_id: propertyId,
    new_data: { logo_url: logoUrl },
  });

  return logoUrl;
};

/**
 * Delete property featured image
 */
export const deleteFeaturedImage = async (
  propertyId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  const property = await getPropertyById(propertyId, userId);

  // Delete image if exists
  if (property.featured_image_url) {
    try {
      const oldPath = property.featured_image_url.split('/property-images/')[1];
      if (oldPath) {
        await supabase.storage.from('property-images').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors
    }
  }

  // Update property to remove image URL
  await supabase
    .from('properties')
    .update({
      featured_image_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .eq('owner_id', userId);

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.image_deleted' as any,
    entity_type: 'property' as any,
    entity_id: propertyId,
  });
};

/**
 * Delete property logo
 */
export const deleteLogo = async (
  propertyId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  const property = await getPropertyById(propertyId, userId);

  // Delete logo if exists
  if (property.logo_url) {
    try {
      const oldPath = property.logo_url.split('/property-logos/')[1];
      if (oldPath) {
        await supabase.storage.from('property-logos').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors
    }
  }

  // Update property to remove logo URL
  await supabase
    .from('properties')
    .update({
      logo_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .eq('owner_id', userId);

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.logo_deleted' as any,
    entity_type: 'property' as any,
    entity_id: propertyId,
  });
};

/**
 * Upload a gallery image for a property
 * Returns the image URL - frontend handles adding to gallery_images array
 */
export const uploadGalleryImage = async (
  propertyId: string,
  userId: string,
  file: Express.Multer.File
): Promise<string> => {
  const supabase = getAdminClient();

  // Verify ownership
  await getPropertyById(propertyId, userId);

  // Generate unique filename in gallery subfolder
  const ext = file.originalname.split('.').pop() || 'jpg';
  const filename = `${propertyId}/gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to upload gallery image');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('property-images')
    .getPublicUrl(filename);

  const imageUrl = urlData.publicUrl;

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.gallery_image_uploaded' as any,
    entity_type: 'property' as any,
    entity_id: propertyId,
    new_data: { gallery_image_url: imageUrl },
  });

  return imageUrl;
};

/**
 * Delete a gallery image from storage
 */
export const deleteGalleryImage = async (
  propertyId: string,
  userId: string,
  imageUrl: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  await getPropertyById(propertyId, userId);

  // Extract path from URL and delete from storage
  try {
    const path = imageUrl.split('/property-images/')[1];
    if (path) {
      await supabase.storage.from('property-images').remove([path]);
    }
  } catch {
    // Ignore deletion errors - file may not exist
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.gallery_image_deleted' as any,
    entity_type: 'property' as any,
    entity_id: propertyId,
    old_data: { gallery_image_url: imageUrl },
  });
};
