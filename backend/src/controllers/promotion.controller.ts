import { Response, NextFunction } from 'express';
import { getAdminClient } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types/api.types';

// ============================================================================
// Promotion Controller
// ============================================================================

// Valid discount types
const VALID_DISCOUNT_TYPES = ['percentage', 'fixed_amount', 'free_nights'];

export const promotionController = {
  // --------------------------------------------------------------------------
  // GET /api/promotions
  // List all promotions with optional filters
  // --------------------------------------------------------------------------
  async getPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supabase = getAdminClient();
      const {
        property_id,
        is_active,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = '1',
        limit = '50',
      } = req.query;

      let query = supabase
        .from('promotions_with_room_count')
        .select('*, properties(name)', { count: 'exact' });

      // Filters
      if (property_id) {
        query = query.eq('property_id', property_id);
      }

      if (is_active === 'true') {
        query = query.eq('is_active', true);
      } else if (is_active === 'false') {
        query = query.eq('is_active', false);
      }

      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
      }

      // Sorting
      const validSortFields = ['created_at', 'name', 'code', 'discount_value'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
      query = query.order(sortField as string, { ascending: sortOrder === 'asc' });

      // Pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;
      query = query.range(offset, offset + limitNum - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch promotions: ${error.message}`);
      }

      sendSuccess(res, {
        data: data || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // GET /api/promotions/:id
  // Get a single promotion
  // --------------------------------------------------------------------------
  async getPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const supabase = getAdminClient();

      const { data, error } = await supabase
        .from('promotions_with_room_count')
        .select('*, properties(name)')
        .eq('id', id)
        .single();

      if (error || !data) {
        sendError(res, 'NOT_FOUND', 'Promotion not found', 404);
        return;
      }

      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // GET /api/properties/:propertyId/promotions
  // Get all promotions for a property
  // --------------------------------------------------------------------------
  async getPropertyPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';
      const supabase = getAdminClient();

      let query = supabase
        .from('promotions_with_room_count')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch promotions: ${error.message}`);
      }

      sendSuccess(res, data || []);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // POST /api/promotions
  // Create a new promotion
  // --------------------------------------------------------------------------
  async createPromotion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;
      const supabase = getAdminClient();

      console.log('[PromotionController] createPromotion called');
      console.log('[PromotionController] Request body:', JSON.stringify(data, null, 2));
      console.log('[PromotionController] User ID:', req.user?.id);

      // Validation
      if (!data.property_id) {
        sendError(res, 'VALIDATION_ERROR', 'Property ID is required', 400);
        return;
      }

      if (!data.code || !data.code.trim()) {
        sendError(res, 'VALIDATION_ERROR', 'Promotion code is required', 400);
        return;
      }

      if (!data.name || !data.name.trim()) {
        sendError(res, 'VALIDATION_ERROR', 'Promotion name is required', 400);
        return;
      }

      if (data.discount_value === undefined || data.discount_value < 0) {
        sendError(res, 'VALIDATION_ERROR', 'Discount value must be a non-negative number', 400);
        return;
      }

      if (!data.discount_type || !VALID_DISCOUNT_TYPES.includes(data.discount_type)) {
        sendError(
          res,
          'VALIDATION_ERROR',
          `Invalid discount type. Must be one of: ${VALID_DISCOUNT_TYPES.join(', ')}`,
          400
        );
        return;
      }

      // Validate percentage is between 0-100
      if (data.discount_type === 'percentage' && (data.discount_value < 0 || data.discount_value > 100)) {
        sendError(res, 'VALIDATION_ERROR', 'Percentage discount must be between 0 and 100', 400);
        return;
      }

      // Check for duplicate code within property
      const { data: existing } = await supabase
        .from('room_promotions')
        .select('id')
        .eq('property_id', data.property_id)
        .eq('code', data.code.toUpperCase().trim())
        .maybeSingle();

      if (existing) {
        sendError(res, 'VALIDATION_ERROR', 'A promotion with this code already exists for this property', 409);
        return;
      }

      // Create promotion
      const insertData: any = {
        property_id: data.property_id,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        valid_from: data.valid_from || new Date().toISOString(),
        valid_until: data.valid_until || null,
        max_uses: data.max_uses || null,
        max_uses_per_customer: data.max_uses_per_customer || 1,
        min_booking_amount: data.min_booking_amount || null,
        min_nights: data.min_nights || null,
        is_claimable: data.is_claimable || false,
        is_active: data.is_active !== undefined ? data.is_active : true,
      };

      const { data: promotion, error } = await supabase
        .from('room_promotions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create promotion: ${error.message}`);
      }

      // If room_ids are provided, assign promotion to those rooms
      if (data.room_ids && Array.isArray(data.room_ids) && data.room_ids.length > 0) {
        console.log('[PromotionController] room_ids provided:', data.room_ids);
        console.log('[PromotionController] Promotion ID:', promotion.id);
        console.log('[PromotionController] Assigning promotion to', data.room_ids.length, 'rooms');

        const assignments = data.room_ids.map((roomId: string) => ({
          room_id: roomId,
          promotion_id: promotion.id,
          assigned_by: req.user!.id,
        }));

        console.log('[PromotionController] Assignment data:', JSON.stringify(assignments, null, 2));

        const { error: assignError, data: assignData } = await supabase
          .from('room_promotion_assignments')
          .insert(assignments)
          .select();

        if (assignError) {
          console.error('[PromotionController] ❌ FAILED to assign promotion to rooms');
          console.error('[PromotionController] Error code:', assignError.code);
          console.error('[PromotionController] Error message:', assignError.message);
          console.error('[PromotionController] Error details:', assignError.details);
          console.error('[PromotionController] Full error:', JSON.stringify(assignError, null, 2));
          // Don't throw error - promotion is created, just not assigned
          // The user can manually assign it later
        } else {
          console.log('[PromotionController] ✅ Successfully assigned promotion to', data.room_ids.length, 'rooms');
          console.log('[PromotionController] Assignment result:', JSON.stringify(assignData, null, 2));
        }
      } else {
        console.log('[PromotionController] No room_ids provided or empty array');
        console.log('[PromotionController] data.room_ids:', data.room_ids);
      }

      sendSuccess(res, promotion, 201);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // PUT /api/promotions/:id
  // Update a promotion
  // --------------------------------------------------------------------------
  async updatePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;
      const supabase = getAdminClient();

      // Check if promotion exists
      const { data: existing, error: fetchError } = await supabase
        .from('room_promotions')
        .select('code, property_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        sendError(res, 'NOT_FOUND', 'Promotion not found', 404);
        return;
      }

      // Validation for optional fields
      if (data.discount_value !== undefined && data.discount_value < 0) {
        sendError(res, 'VALIDATION_ERROR', 'Discount value must be a non-negative number', 400);
        return;
      }

      if (data.discount_type && !VALID_DISCOUNT_TYPES.includes(data.discount_type)) {
        sendError(
          res,
          'VALIDATION_ERROR',
          `Invalid discount type. Must be one of: ${VALID_DISCOUNT_TYPES.join(', ')}`,
          400
        );
        return;
      }

      // Validate percentage
      if (data.discount_type === 'percentage' && data.discount_value !== undefined &&
          (data.discount_value < 0 || data.discount_value > 100)) {
        sendError(res, 'VALIDATION_ERROR', 'Percentage discount must be between 0 and 100', 400);
        return;
      }

      const updateData: any = { updated_at: new Date().toISOString() };

      // Only update code if it's actually changing
      if (data.code !== undefined) {
        const newCode = data.code.toUpperCase().trim();
        if (newCode !== existing.code) {
          // Check for duplicates
          const { data: duplicate } = await supabase
            .from('room_promotions')
            .select('id')
            .eq('property_id', existing.property_id)
            .eq('code', newCode)
            .neq('id', id)
            .maybeSingle();

          if (duplicate) {
            sendError(res, 'VALIDATION_ERROR', 'A promotion with this code already exists for this property', 409);
            return;
          }

          updateData.code = newCode;
        }
      }

      // Update other fields
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
      if (data.discount_value !== undefined) updateData.discount_value = data.discount_value;
      if (data.valid_from !== undefined) updateData.valid_from = data.valid_from;
      if (data.valid_until !== undefined) updateData.valid_until = data.valid_until || null;
      if (data.max_uses !== undefined) updateData.max_uses = data.max_uses || null;
      if (data.max_uses_per_customer !== undefined) updateData.max_uses_per_customer = data.max_uses_per_customer;
      if (data.min_booking_amount !== undefined) updateData.min_booking_amount = data.min_booking_amount || null;
      if (data.min_nights !== undefined) updateData.min_nights = data.min_nights || null;
      if (data.is_claimable !== undefined) updateData.is_claimable = data.is_claimable;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { data: promotion, error } = await supabase
        .from('room_promotions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update promotion: ${error.message}`);
      }

      sendSuccess(res, promotion);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // DELETE /api/promotions/:id
  // Delete a promotion
  // --------------------------------------------------------------------------
  async deletePromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const supabase = getAdminClient();

      // Check if promotion exists
      const { data: existing } = await supabase
        .from('room_promotions')
        .select('id')
        .eq('id', id)
        .single();

      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Promotion not found', 404);
        return;
      }

      const { error } = await supabase
        .from('room_promotions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete promotion: ${error.message}`);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // POST /api/promotions/validate
  // Validate promo code for booking (public endpoint)
  // --------------------------------------------------------------------------
  async validatePromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, property_id, room_ids = [], booking_amount = 0, nights = 1 } = req.body;

      console.log('[PromotionController] validatePromoCode called');
      console.log('[PromotionController] Code:', code);
      console.log('[PromotionController] Property ID:', property_id);
      console.log('[PromotionController] Room IDs:', room_ids);

      if (!code || !property_id) {
        return sendError(res, 'VALIDATION_ERROR', 'Promo code and property ID are required', 400);
      }

      const supabase = getAdminClient();

      // Find promo code
      const { data: promo, error } = await supabase
        .from('room_promotions')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('property_id', property_id)
        .eq('is_active', true)
        .maybeSingle();

      console.log('[PromotionController] Promo found:', promo);
      console.log('[PromotionController] Promo error:', error);

      if (error || !promo) {
        console.log('[PromotionController] Promo not found or error');
        res.json({
          valid: false,
          message: 'Invalid or expired promo code',
        });
        return;
      }

      // Check if promo is assigned to the selected rooms via junction table
      // A promotion is valid if:
      // 1. It's assigned to at least one of the selected rooms, OR
      // 2. It has no room assignments (property-level promo)

      if (room_ids && room_ids.length > 0) {
        console.log('[PromotionController] Checking room assignments for rooms:', room_ids);

        // Check if promotion is assigned to any of the selected rooms
        const { data: assignments, error: assignError } = await supabase
          .from('room_promotion_assignments')
          .select('room_id')
          .eq('promotion_id', promo.id)
          .in('room_id', room_ids);

        console.log('[PromotionController] Room assignments found:', assignments);
        console.log('[PromotionController] Assignment error:', assignError);

        // If there are no assignments at all, this is a property-level promo (valid for all rooms)
        const { count: totalAssignments } = await supabase
          .from('room_promotion_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('promotion_id', promo.id);

        console.log('[PromotionController] Total assignments for promo:', totalAssignments);

        // Promo is valid if:
        // - It has assignments to the selected rooms, OR
        // - It has no assignments at all (property-level)
        const isValidForRooms = (assignments && assignments.length > 0) || totalAssignments === 0;

        if (!isValidForRooms) {
          console.log('[PromotionController] Promo not valid for selected rooms');
          res.json({
            valid: false,
            message: 'This promo code is not valid for your selected rooms',
          });
          return;
        }
      }

      // Check validity period
      const now = new Date();
      if (promo.valid_from && new Date(promo.valid_from) > now) {
        res.json({
          valid: false,
          message: 'This promo code is not yet valid',
        });
        return;
      }

      if (promo.valid_until && new Date(promo.valid_until) < now) {
        res.json({
          valid: false,
          message: 'This promo code has expired',
        });
        return;
      }

      // Check usage limits
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        res.json({
          valid: false,
          message: 'This promo code has reached its usage limit',
        });
        return;
      }

      // Check minimum requirements
      if (promo.min_booking_amount && booking_amount < promo.min_booking_amount) {
        res.json({
          valid: false,
          message: `Minimum booking amount of ${promo.min_booking_amount} required`,
        });
        return;
      }

      if (promo.min_nights && nights < promo.min_nights) {
        res.json({
          valid: false,
          message: `Minimum ${promo.min_nights} nights required`,
        });
        return;
      }

      // Valid promo code!
      console.log('[PromotionController] ✅ Promo code is VALID!');
      console.log('[PromotionController] Discount:', promo.discount_type, promo.discount_value);
      res.json({
        valid: true,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        code: promo.code,
        name: promo.name,
      });
    } catch (error) {
      next(error);
    }
  },
};
