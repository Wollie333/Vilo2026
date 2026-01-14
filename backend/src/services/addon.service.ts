import { getAdminClient } from '../config/supabase';
import type {
  AddOn,
  AddonType,
  AddonPricingType,
  CreateAddOnRequest,
  UpdateAddOnRequest,
} from '../types/room.types';
import type {
  AddonListParams,
  AddonListResponse,
  AddonPriceCalculation,
  AddonPriceCalculationRequest,
} from '../types/addon.types';
import type { Express } from 'express';

type MulterFile = Express.Multer.File;

// ============================================================================
// Add-on Service
// ============================================================================

export const addonService = {
  // --------------------------------------------------------------------------
  // Get all add-ons with filters and pagination
  // --------------------------------------------------------------------------
  async getAddOns(params: AddonListParams = {}): Promise<AddonListResponse> {
    const supabase = getAdminClient();
    const {
      property_id,
      type,
      is_active,
      room_id,
      search,
      sortBy = 'sort_order',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = params;

    let query = supabase.from('add_ons').select('*', { count: 'exact' });

    // Apply filters
    if (property_id) {
      query = query.eq('property_id', property_id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // For room_id filtering, we need to check if room_ids is null (available for all)
    // or contains the specific room_id
    if (room_id) {
      query = query.or(`room_ids.is.null,room_ids.cs.["${room_id}"]`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch add-ons: ${error.message}`);
    }

    return {
      addons: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  // --------------------------------------------------------------------------
  // Get a single add-on by ID
  // --------------------------------------------------------------------------
  async getAddOnById(id: string): Promise<AddOn | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('add_ons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch add-on: ${error.message}`);
    }

    return data;
  },

  // --------------------------------------------------------------------------
  // Get all add-ons for a property
  // --------------------------------------------------------------------------
  async getPropertyAddOns(
    propertyId: string,
    includeInactive: boolean = false
  ): Promise<AddOn[]> {
    const supabase = getAdminClient();
    let query = supabase
      .from('add_ons')
      .select('*')
      .eq('property_id', propertyId)
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch property add-ons: ${error.message}`);
    }

    return data || [];
  },

  // --------------------------------------------------------------------------
  // Get add-ons assigned to a specific room
  // --------------------------------------------------------------------------
  async getAddOnsForRoom(roomId: string, propertyId: string): Promise<AddOn[]> {
    const supabase = getAdminClient();

    console.log(`[AddonService] Fetching addons for room ${roomId}, property ${propertyId}`);

    // Step 1: Get addon IDs from junction table
    const { data: assignments, error: assignmentsError } = await supabase
      .from('room_addon_assignments')
      .select('addon_id')
      .eq('room_id', roomId);

    if (assignmentsError) {
      console.error(`[AddonService] Error fetching assignments:`, assignmentsError);
      throw new Error(`Failed to fetch room add-ons: ${assignmentsError.message}`);
    }

    console.log(`[AddonService] Found ${assignments?.length || 0} assignments`);

    if (!assignments || assignments.length === 0) {
      console.log(`[AddonService] No addons assigned to room`);
      return [];
    }

    // Step 2: Get the actual addon details
    const addonIds = assignments.map(a => a.addon_id);
    console.log(`[AddonService] Fetching details for addon IDs:`, addonIds);

    const { data: addons, error: addonsError } = await supabase
      .from('add_ons')
      .select('*')
      .in('id', addonIds)
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (addonsError) {
      console.error(`[AddonService] Error fetching addons:`, addonsError);
      throw new Error(`Failed to fetch room add-ons: ${addonsError.message}`);
    }

    console.log(`[AddonService] Returning ${addons?.length || 0} addons:`, addons?.map(a => a.name));

    return addons || [];
  },

  // --------------------------------------------------------------------------
  // Create a new add-on
  // --------------------------------------------------------------------------
  async createAddOn(data: CreateAddOnRequest): Promise<AddOn> {
    const supabase = getAdminClient();
    const { data: addon, error } = await supabase
      .from('add_ons')
      .insert({
        property_id: data.property_id,
        name: data.name,
        description: data.description || null,
        price: data.price,
        pricing_type: data.pricing_type,
        currency: data.currency || 'ZAR',
        type: data.type,
        max_quantity: data.max_quantity ?? 1,
        is_active: data.is_active ?? true,
        room_ids: data.room_ids || null,
        image_url: data.image_url || null,
        sort_order: data.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create add-on: ${error.message}`);
    }

    return addon;
  },

  // --------------------------------------------------------------------------
  // Update an add-on
  // --------------------------------------------------------------------------
  async updateAddOn(id: string, data: UpdateAddOnRequest): Promise<AddOn> {
    const supabase = getAdminClient();
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.pricing_type !== undefined) updateData.pricing_type = data.pricing_type;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.max_quantity !== undefined) updateData.max_quantity = data.max_quantity;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.room_ids !== undefined) updateData.room_ids = data.room_ids;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    const { data: addon, error } = await supabase
      .from('add_ons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update add-on: ${error.message}`);
    }

    return addon;
  },

  // --------------------------------------------------------------------------
  // Delete (soft delete) an add-on
  // --------------------------------------------------------------------------
  async deleteAddOn(id: string): Promise<void> {
    const supabase = getAdminClient();
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('add_ons')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete add-on: ${error.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // Hard delete an add-on (admin only)
  // --------------------------------------------------------------------------
  async hardDeleteAddOn(id: string): Promise<void> {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from('add_ons')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete add-on: ${error.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // Calculate add-on price based on pricing type
  // --------------------------------------------------------------------------
  calculateAddonPrice(
    addon: AddOn,
    request: AddonPriceCalculationRequest
  ): AddonPriceCalculation {
    const { nights, guests, quantity } = request;
    const basePrice = addon.price * quantity;
    let multiplier = 1;
    let multiplierLabel = 'flat';
    let calculatedPrice = basePrice;

    switch (addon.pricing_type) {
      case 'per_booking':
        // Flat fee once per booking
        calculatedPrice = basePrice;
        multiplierLabel = 'per booking';
        break;

      case 'per_night':
        // Price multiplied by number of nights
        multiplier = nights;
        calculatedPrice = basePrice * nights;
        multiplierLabel = `× ${nights} night${nights !== 1 ? 's' : ''}`;
        break;

      case 'per_guest':
        // Price multiplied by number of guests
        multiplier = guests;
        calculatedPrice = basePrice * guests;
        multiplierLabel = `× ${guests} guest${guests !== 1 ? 's' : ''}`;
        break;

      case 'per_guest_per_night':
        // Price multiplied by both guests AND nights
        multiplier = guests * nights;
        calculatedPrice = basePrice * guests * nights;
        multiplierLabel = `× ${guests} guest${guests !== 1 ? 's' : ''} × ${nights} night${nights !== 1 ? 's' : ''}`;
        break;
    }

    return {
      addon_id: addon.id,
      addon_name: addon.name,
      quantity,
      unit_price: addon.price,
      calculated_price: calculatedPrice,
      pricing_type: addon.pricing_type,
      breakdown: {
        base_price: basePrice,
        multiplier,
        multiplier_label: multiplierLabel,
      },
    };
  },

  // --------------------------------------------------------------------------
  // Upload add-on image
  // --------------------------------------------------------------------------
  async uploadImage(addonId: string, file: MulterFile): Promise<string> {
    const supabase = getAdminClient();

    // Get addon to check if it exists
    const addon = await this.getAddOnById(addonId);
    if (!addon) {
      throw new Error('Add-on not found');
    }

    // Delete old image if exists
    if (addon.image_url) {
      try {
        const oldPath = addon.image_url.split('/addon-images/')[1];
        if (oldPath) {
          await supabase.storage.from('addon-images').remove([oldPath]);
        }
      } catch {
        // Ignore deletion errors - file may not exist
      }
    }

    // Generate unique filename
    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `${addon.property_id}/${addonId}/${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('addon-images')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      throw new Error(`Failed to upload add-on image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('addon-images')
      .getPublicUrl(filename);

    const imageUrl = urlData.publicUrl;

    // Update add-on with new image URL
    const { error: updateError } = await supabase
      .from('add_ons')
      .update({ image_url: imageUrl })
      .eq('id', addonId);

    if (updateError) {
      console.error('Database update error for add-on image:', updateError);
      throw new Error(`Failed to update add-on image: ${updateError.message}`);
    }

    return imageUrl;
  },

  // --------------------------------------------------------------------------
  // Delete add-on image
  // --------------------------------------------------------------------------
  async deleteImage(addonId: string): Promise<void> {
    const supabase = getAdminClient();

    // Get addon to check if it exists and has an image
    const addon = await this.getAddOnById(addonId);
    if (!addon) {
      throw new Error('Add-on not found');
    }

    if (!addon.image_url) {
      return; // No image to delete
    }

    // Delete from storage
    try {
      const path = addon.image_url.split('/addon-images/')[1];
      if (path) {
        await supabase.storage.from('addon-images').remove([path]);
      }
    } catch {
      // Ignore deletion errors - file may not exist
    }

    // Clear image URL in database
    const { error } = await supabase
      .from('add_ons')
      .update({ image_url: null })
      .eq('id', addonId);

    if (error) {
      throw new Error(`Failed to delete add-on image: ${error.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // Get add-ons assigned to a specific room (via junction table)
  // --------------------------------------------------------------------------
  async getRoomAddonAssignments(roomId: string): Promise<AddOn[]> {
    const supabase = getAdminClient();

    // Query room_addon_assignments and join with add_ons table
    const { data, error } = await supabase
      .from('room_addon_assignments')
      .select(`
        addon_id,
        add_ons (*)
      `)
      .eq('room_id', roomId);

    if (error) {
      throw new Error(`Failed to fetch room addon assignments: ${error.message}`);
    }

    // Extract add-ons from joined data
    return (data || [])
      .map((assignment: any) => assignment.add_ons)
      .filter((addon: any) => addon !== null);
  },

  // --------------------------------------------------------------------------
  // Assign a single add-on to a room
  // --------------------------------------------------------------------------
  async assignAddonToRoom(
    roomId: string,
    addonId: string,
    assignedBy?: string
  ): Promise<void> {
    const supabase = getAdminClient();

    const insertData: Record<string, unknown> = {
      room_id: roomId,
      addon_id: addonId,
    };

    if (assignedBy) {
      insertData.assigned_by = assignedBy;
    }

    // Insert with ON CONFLICT DO NOTHING (handled by unique constraint)
    const { error } = await supabase
      .from('room_addon_assignments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate key error (unique constraint violation)
      if (error.code === '23505') {
        // Assignment already exists, treat as success
        return;
      }
      throw new Error(`Failed to assign add-on to room: ${error.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // Unassign a single add-on from a room
  // --------------------------------------------------------------------------
  async unassignAddonFromRoom(roomId: string, addonId: string): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
      .from('room_addon_assignments')
      .delete()
      .eq('room_id', roomId)
      .eq('addon_id', addonId);

    if (error) {
      throw new Error(`Failed to unassign add-on from room: ${error.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // Sync room add-ons (bulk replace all assignments)
  // --------------------------------------------------------------------------
  async syncRoomAddons(
    roomId: string,
    addonIds: string[],
    assignedBy?: string
  ): Promise<void> {
    const supabase = getAdminClient();

    console.log(`[AddonService] Syncing addons for room ${roomId}`);
    console.log(`[AddonService] New addon IDs:`, addonIds);

    try {
      // Step 1: Delete all existing assignments for this room
      const { error: deleteError } = await supabase
        .from('room_addon_assignments')
        .delete()
        .eq('room_id', roomId);

      if (deleteError) {
        console.error(`[AddonService] Error deleting existing assignments:`, deleteError);
        throw new Error(`Failed to clear existing assignments: ${deleteError.message}`);
      }

      console.log(`[AddonService] Deleted all existing assignments for room ${roomId}`);

      // Step 2: If there are new assignments, insert them
      if (addonIds.length > 0) {
        const insertData = addonIds.map((addonId) => ({
          room_id: roomId,
          addon_id: addonId,
          assigned_by: assignedBy || null,
        }));

        console.log(`[AddonService] Inserting ${insertData.length} new assignments`);

        const { error: insertError } = await supabase
          .from('room_addon_assignments')
          .insert(insertData);

        if (insertError) {
          console.error(`[AddonService] Error inserting assignments:`, insertError);
          throw new Error(`Failed to insert new assignments: ${insertError.message}`);
        }

        console.log(`[AddonService] Successfully inserted ${addonIds.length} addon assignments`);
      } else {
        console.log(`[AddonService] No addons to assign (empty list)`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to sync room add-ons');
    }
  },
};
