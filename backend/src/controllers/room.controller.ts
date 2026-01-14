/**
 * Room Controller
 * HTTP request handlers for room management endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as roomService from '../services/room.service';
import {
  CreateRoomRequest,
  UpdateRoomRequest,
  PauseRoomRequest,
  RoomListParams,
  CreateRoomBedRequest,
  UpdateRoomBedRequest,
  CreateSeasonalRateRequest,
  UpdateSeasonalRateRequest,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  CreateAddOnRequest,
  UpdateAddOnRequest,
  CreateAvailabilityBlockRequest,
  UpdateAvailabilityBlockRequest,
  PriceCalculationRequest,
  AvailabilityCheckRequest,
  PricingMode,
} from '../types/room.types';

// ============================================================================
// ROOMS CRUD
// ============================================================================

/**
 * GET /api/rooms
 * List all rooms for the current user
 */
export const listRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: RoomListParams = {
      property_id: req.query.property_id as string | undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      is_paused: req.query.is_paused === 'true' ? true : req.query.is_paused === 'false' ? false : undefined,
      pricing_mode: req.query.pricing_mode as PricingMode | undefined,
      min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
      min_guests: req.query.min_guests ? parseInt(req.query.min_guests as string) : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as RoomListParams['sortBy'],
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await roomService.listRooms(req.user!.id, params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rooms/:id
 * Get a single room by ID
 */
export const getRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const room = await roomService.getRoomById(id, req.user!.id);
    sendSuccess(res, room);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rooms
 * Create a new room
 */
export const createRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: CreateRoomRequest = req.body;
    const room = await roomService.createRoom(req.user!.id, input);
    sendSuccess(res, room, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/rooms/:id
 * Update a room
 */
export const updateRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: UpdateRoomRequest = req.body;
    const room = await roomService.updateRoom(id, req.user!.id, input);
    sendSuccess(res, room);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rooms/:id
 * Delete a room
 */
export const deleteRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await roomService.deleteRoom(id, req.user!.id);
    sendSuccess(res, { message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rooms/:id/pause
 * Pause a room
 */
export const pauseRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: PauseRoomRequest = req.body;
    const room = await roomService.pauseRoom(id, req.user!.id, input);
    sendSuccess(res, room);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rooms/:id/unpause
 * Unpause a room
 */
export const unpauseRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const room = await roomService.unpauseRoom(id, req.user!.id);
    sendSuccess(res, room);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PRICING & AVAILABILITY
// ============================================================================

/**
 * POST /api/rooms/:id/price
 * Calculate price for a room
 */
export const calculatePrice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: PriceCalculationRequest = req.body;
    const pricing = await roomService.calculatePrice(id, input);
    sendSuccess(res, pricing);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rooms/:id/availability
 * Check room availability
 */
export const checkAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: AvailabilityCheckRequest = req.body;
    const availability = await roomService.checkAvailability(id, input);
    sendSuccess(res, availability);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rooms/limits
 * Get room limits for current user
 */
export const getRoomLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limits = await roomService.getRoomLimitInfo(req.user!.id);
    sendSuccess(res, limits);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ROOM BEDS
// ============================================================================

/**
 * POST /api/rooms/:id/beds
 * Add a bed to a room
 */
export const addBed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: CreateRoomBedRequest = req.body;
    const bed = await roomService.addRoomBed(id, req.user!.id, input);
    sendSuccess(res, bed, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/rooms/:id/beds/:bedId
 * Update a room bed
 */
export const updateBed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, bedId } = req.params;
    const input: UpdateRoomBedRequest = req.body;
    const bed = await roomService.updateRoomBed(id, bedId, req.user!.id, input);
    sendSuccess(res, bed);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rooms/:id/beds/:bedId
 * Delete a room bed
 */
export const deleteBed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, bedId } = req.params;
    await roomService.deleteRoomBed(id, bedId, req.user!.id);
    sendSuccess(res, { message: 'Bed deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// SEASONAL RATES
// ============================================================================

/**
 * POST /api/rooms/:id/rates
 * Add a seasonal rate
 */
export const addSeasonalRate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: CreateSeasonalRateRequest = req.body;
    const rate = await roomService.addSeasonalRate(id, req.user!.id, input);
    sendSuccess(res, rate, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/rooms/:id/rates/:rateId
 * Update a seasonal rate
 */
export const updateSeasonalRate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, rateId } = req.params;
    const input: UpdateSeasonalRateRequest = req.body;
    const rate = await roomService.updateSeasonalRate(id, rateId, req.user!.id, input);
    sendSuccess(res, rate);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rooms/:id/rates/:rateId
 * Delete a seasonal rate
 */
export const deleteSeasonalRate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, rateId } = req.params;
    await roomService.deleteSeasonalRate(id, rateId, req.user!.id);
    sendSuccess(res, { message: 'Seasonal rate deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PROMOTIONS
// ============================================================================

/**
 * POST /api/rooms/:id/promotions
 * Add a promotion to a room
 */
export const addPromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const input: CreatePromotionRequest = req.body;
    const promotion = await roomService.addRoomPromotion(id, req.user!.id, input);
    sendSuccess(res, promotion, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/rooms/:id/promotions/:promotionId
 * Update a promotion
 */
export const updatePromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, promotionId } = req.params;
    const input: UpdatePromotionRequest = req.body;
    const promotion = await roomService.updateRoomPromotion(id, promotionId, req.user!.id, input);
    sendSuccess(res, promotion);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rooms/:id/promotions/:promotionId
 * Delete a promotion
 */
export const deletePromotion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, promotionId } = req.params;
    await roomService.deleteRoomPromotion(id, promotionId, req.user!.id);
    sendSuccess(res, { message: 'Promotion deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ADD-ONS (Property level)
// ============================================================================

/**
 * GET /api/properties/:propertyId/addons
 * List add-ons for a property
 */
export const listAddOns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const addons = await roomService.listPropertyAddOns(propertyId, req.user!.id);
    sendSuccess(res, addons);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/properties/:propertyId/addons
 * Create an add-on
 */
export const createAddOn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const input: CreateAddOnRequest = req.body;
    const addon = await roomService.createAddOn(propertyId, req.user!.id, input);
    sendSuccess(res, addon, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/properties/:propertyId/addons/:addonId
 * Update an add-on
 */
export const updateAddOn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, addonId } = req.params;
    const input: UpdateAddOnRequest = req.body;
    const addon = await roomService.updateAddOn(propertyId, addonId, req.user!.id, input);
    sendSuccess(res, addon);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/properties/:propertyId/addons/:addonId
 * Delete an add-on
 */
export const deleteAddOn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, addonId } = req.params;
    await roomService.deleteAddOn(propertyId, addonId, req.user!.id);
    sendSuccess(res, { message: 'Add-on deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PROPERTY ROOMS (Convenience endpoints)
// ============================================================================

/**
 * GET /api/properties/:propertyId/rooms
 * List rooms for a specific property
 */
export const listPropertyRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const params: RoomListParams = {
      property_id: propertyId,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as RoomListParams['sortBy'],
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await roomService.listRooms(req.user!.id, params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PUBLIC ENDPOINTS (for discovery/guest checkout)
// ============================================================================

/**
 * GET /api/discovery/:slug/rooms
 * List public rooms for a property (guest-facing)
 */
export const listPublicRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    // Note: This would need to resolve slug to property_id
    // For now, we'll use property_id directly if provided
    const propertyId = req.query.property_id as string;

    if (!propertyId) {
      throw new Error('Property ID required');
    }

    const rooms = await roomService.listPropertyRoomsPublic(propertyId);
    sendSuccess(res, rooms);
  } catch (error) {
    next(error);
  }
};


// ============================================================================
// PROMOTIONS - CENTRALIZED MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * List all promotions across user's properties
 * GET /api/promotions
 */
export const listAllPromotions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { propertyId } = req.query;

    const promotions = await roomService.listAllPromotions(
      userId,
      propertyId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: promotions,
      total: promotions.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get room assignments for a promotion
 * GET /api/promotions/:id/assignments
 */
export const getPromotionAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const assignments = await roomService.getPromotionAssignments(id, userId);

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign promotion to multiple rooms
 * POST /api/promotions/:id/assign-rooms
 */
export const assignPromotionToRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { roomIds } = req.body;

    if (!Array.isArray(roomIds) || roomIds.length === 0) {
      res.status(400).json({ error: 'roomIds must be a non-empty array' });
      return;
    }

    await roomService.assignPromotionToRooms(id, roomIds, userId);

    res.status(200).json({
      success: true,
      message: 'Promotion assigned to rooms successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unassign promotion from a room
 * DELETE /api/promotions/:id/unassign-room/:roomId
 */
export const unassignPromotionFromRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id, roomId } = req.params;

    await roomService.unassignPromotionFromRoom(id, roomId, userId);

    res.status(200).json({
      success: true,
      message: 'Promotion unassigned from room successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// PROMOTIONS - GLOBAL PROPERTY-LEVEL CRUD CONTROLLERS
// ============================================================================

/**
 * Create a promotion at property level
 * POST /api/promotions
 */
export const createPromotionGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { property_id, room_ids, ...promotionData } = req.body;

    if (!property_id) {
      res.status(400).json({ error: 'property_id is required' });
      return;
    }

    // Create the promotion
    const promotion = await roomService.createPromotionGlobal(
      userId,
      property_id,
      promotionData
    );

    // Optionally assign to rooms
    if (room_ids && Array.isArray(room_ids) && room_ids.length > 0) {
      await roomService.assignPromotionToRooms(promotion.id, room_ids, userId);
    }

    res.status(201).json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a promotion by ID
 * PUT /api/promotions/:id
 */
export const updatePromotionGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const promotion = await roomService.updatePromotionGlobal(userId, id, req.body);

    res.status(200).json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a promotion by ID
 * DELETE /api/promotions/:id
 */
export const deletePromotionGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    await roomService.deletePromotionGlobal(userId, id);

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a promotion by ID (for editing)
 * GET /api/promotions/:id
 */
export const getPromotionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const promotion = await roomService.getPromotionById(userId, id);

    res.status(200).json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// IMAGE UPLOADS
// ============================================================================

/**
 * POST /api/rooms/:id/featured-image
 * Upload a featured image for a room
 */
export const uploadFeaturedImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
      });
      return;
    }

    const imageUrl = await roomService.uploadFeaturedImage(
      req.params.id,
      req.user!.id,
      req.file
    );
    sendSuccess(res, { imageUrl, message: 'Featured image uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rooms/:id/featured-image
 * Delete the featured image for a room
 */
export const deleteFeaturedImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await roomService.deleteFeaturedImage(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Featured image deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rooms/:id/gallery-image
 * Upload a gallery image for a room
 */
export const uploadGalleryImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
      });
      return;
    }

    const imageUrl = await roomService.uploadGalleryImage(
      req.params.id,
      req.user!.id,
      req.file
    );
    sendSuccess(res, { imageUrl, message: 'Gallery image uploaded successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rooms/:id/gallery-image
 * Delete a gallery image for a room
 */
export const deleteGalleryImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Image URL is required' },
      });
      return;
    }

    await roomService.deleteGalleryImage(req.params.id, req.user!.id, imageUrl);
    sendSuccess(res, { message: 'Gallery image deleted successfully' });
  } catch (error) {
    next(error);
  }
};
