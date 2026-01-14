import { Request, Response, NextFunction } from 'express';
import { addonService } from '../services/addon.service';
import { sendSuccess, sendError } from '../utils/response';
import type { CreateAddOnRequest, UpdateAddOnRequest } from '../types/room.types';
import type { AddonListParams, AddonPriceCalculationRequest } from '../types/addon.types';

// ============================================================================
// Add-on Controller
// ============================================================================

// Valid pricing types for validation
const VALID_PRICING_TYPES = ['per_booking', 'per_night', 'per_guest', 'per_guest_per_night'];
const VALID_ADDON_TYPES = ['service', 'product', 'experience'];

export const addonController = {
  // --------------------------------------------------------------------------
  // GET /api/addons
  // List all add-ons with optional filters
  // --------------------------------------------------------------------------
  async getAddOns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: AddonListParams = {
        property_id: req.query.property_id as string | undefined,
        type: req.query.type as AddonListParams['type'],
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        room_id: req.query.room_id as string | undefined,
        search: req.query.search as string | undefined,
        sortBy: req.query.sortBy as AddonListParams['sortBy'],
        sortOrder: req.query.sortOrder as AddonListParams['sortOrder'],
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await addonService.getAddOns(params);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // GET /api/addons/:id
  // Get a single add-on
  // --------------------------------------------------------------------------
  async getAddOn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const addon = await addonService.getAddOnById(id);

      if (!addon) {
        sendError(res, 'NOT_FOUND', 'Add-on not found', 404);
        return;
      }

      sendSuccess(res, addon);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // GET /api/properties/:propertyId/addons
  // Get all add-ons for a property
  // --------------------------------------------------------------------------
  async getPropertyAddOns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const addons = await addonService.getPropertyAddOns(propertyId, includeInactive);
      sendSuccess(res, addons);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // GET /api/rooms/:id/addons
  // Get add-ons available for a specific room
  // --------------------------------------------------------------------------
  async getRoomAddOns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: roomId } = req.params; // Route uses :id, not :roomId
      const propertyId = req.query.property_id as string;

      if (!propertyId) {
        sendError(res, 'VALIDATION_ERROR', 'property_id query parameter is required', 400);
        return;
      }

      const addons = await addonService.getAddOnsForRoom(roomId, propertyId);
      sendSuccess(res, addons);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // POST /api/addons
  // Create a new add-on
  // --------------------------------------------------------------------------
  async createAddOn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateAddOnRequest = req.body;

      // Validation
      if (!data.property_id) {
        sendError(res, 'VALIDATION_ERROR', 'Property ID is required', 400);
        return;
      }

      if (!data.name || !data.name.trim()) {
        sendError(res, 'VALIDATION_ERROR', 'Add-on name is required', 400);
        return;
      }

      if (data.price === undefined || data.price === null || data.price < 0) {
        sendError(res, 'VALIDATION_ERROR', 'Price must be a non-negative number', 400);
        return;
      }

      if (!data.pricing_type || !VALID_PRICING_TYPES.includes(data.pricing_type)) {
        sendError(
          res,
          'VALIDATION_ERROR',
          `Invalid pricing type. Must be one of: ${VALID_PRICING_TYPES.join(', ')}`,
          400
        );
        return;
      }

      if (!data.type || !VALID_ADDON_TYPES.includes(data.type)) {
        sendError(
          res,
          'VALIDATION_ERROR',
          `Invalid add-on type. Must be one of: ${VALID_ADDON_TYPES.join(', ')}`,
          400
        );
        return;
      }

      if (data.max_quantity !== undefined) {
        if (data.max_quantity < 1 || data.max_quantity > 100) {
          sendError(res, 'VALIDATION_ERROR', 'Max quantity must be between 1 and 100', 400);
          return;
        }
      }

      const addon = await addonService.createAddOn(data);
      sendSuccess(res, addon, 201);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // PUT /api/addons/:id
  // Update an add-on
  // --------------------------------------------------------------------------
  async updateAddOn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateAddOnRequest = req.body;

      // Check if add-on exists
      const existing = await addonService.getAddOnById(id);
      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Add-on not found', 404);
        return;
      }

      // Validation for optional fields
      if (data.price !== undefined && data.price < 0) {
        sendError(res, 'VALIDATION_ERROR', 'Price must be a non-negative number', 400);
        return;
      }

      if (data.pricing_type && !VALID_PRICING_TYPES.includes(data.pricing_type)) {
        sendError(
          res,
          'VALIDATION_ERROR',
          `Invalid pricing type. Must be one of: ${VALID_PRICING_TYPES.join(', ')}`,
          400
        );
        return;
      }

      if (data.type && !VALID_ADDON_TYPES.includes(data.type)) {
        sendError(
          res,
          'VALIDATION_ERROR',
          `Invalid add-on type. Must be one of: ${VALID_ADDON_TYPES.join(', ')}`,
          400
        );
        return;
      }

      if (data.max_quantity !== undefined) {
        if (data.max_quantity < 1 || data.max_quantity > 100) {
          sendError(res, 'VALIDATION_ERROR', 'Max quantity must be between 1 and 100', 400);
          return;
        }
      }

      const addon = await addonService.updateAddOn(id, data);
      sendSuccess(res, addon);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // DELETE /api/addons/:id
  // Delete (soft delete) an add-on
  // --------------------------------------------------------------------------
  async deleteAddOn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const hardDelete = req.query.hard === 'true';

      // Check if add-on exists
      const existing = await addonService.getAddOnById(id);
      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Add-on not found', 404);
        return;
      }

      if (hardDelete) {
        await addonService.hardDeleteAddOn(id);
      } else {
        await addonService.deleteAddOn(id);
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // POST /api/addons/:id/calculate-price
  // Calculate add-on price based on booking parameters
  // --------------------------------------------------------------------------
  async calculatePrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: AddonPriceCalculationRequest = req.body;

      // Validation
      if (typeof data.nights !== 'number' || data.nights < 1) {
        sendError(res, 'VALIDATION_ERROR', 'Nights must be a positive number', 400);
        return;
      }

      if (typeof data.guests !== 'number' || data.guests < 1) {
        sendError(res, 'VALIDATION_ERROR', 'Guests must be a positive number', 400);
        return;
      }

      if (typeof data.quantity !== 'number' || data.quantity < 1) {
        sendError(res, 'VALIDATION_ERROR', 'Quantity must be a positive number', 400);
        return;
      }

      // Get the add-on
      const addon = await addonService.getAddOnById(id);
      if (!addon) {
        sendError(res, 'NOT_FOUND', 'Add-on not found', 404);
        return;
      }

      // Validate quantity against max_quantity
      if (data.quantity > addon.max_quantity) {
        sendError(
          res,
          'VALIDATION_ERROR',
          `Quantity exceeds maximum allowed (${addon.max_quantity})`,
          400
        );
        return;
      }

      const calculation = addonService.calculateAddonPrice(addon, data);
      sendSuccess(res, calculation);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // POST /api/addons/:id/image
  // Upload an image for an add-on
  // --------------------------------------------------------------------------
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.file) {
        sendError(res, 'VALIDATION_ERROR', 'No image file provided', 400);
        return;
      }

      // Check if add-on exists
      const existing = await addonService.getAddOnById(id);
      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Add-on not found', 404);
        return;
      }

      const imageUrl = await addonService.uploadImage(id, req.file);
      sendSuccess(res, { imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // DELETE /api/addons/:id/image
  // Delete the image for an add-on
  // --------------------------------------------------------------------------
  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check if add-on exists
      const existing = await addonService.getAddOnById(id);
      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Add-on not found', 404);
        return;
      }

      await addonService.deleteImage(id);
      sendSuccess(res, { message: 'Image deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // POST /api/addons/rooms/:roomId/assign
  // Assign an add-on to a room
  // --------------------------------------------------------------------------
  async assignToRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const { addon_id } = req.body;

      // Validation
      if (!addon_id || typeof addon_id !== 'string') {
        sendError(res, 'VALIDATION_ERROR', 'addon_id is required', 400);
        return;
      }

      // Verify add-on exists
      const addon = await addonService.getAddOnById(addon_id);
      if (!addon) {
        sendError(res, 'NOT_FOUND', 'Add-on not found', 404);
        return;
      }

      // Extract user ID from request if available (for assigned_by field)
      const userId = (req as any).user?.id;

      await addonService.assignAddonToRoom(roomId, addon_id, userId);
      sendSuccess(res, { message: 'Add-on assigned to room successfully' });
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // DELETE /api/addons/rooms/:roomId/unassign/:addonId
  // Unassign an add-on from a room
  // --------------------------------------------------------------------------
  async unassignFromRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomId, addonId } = req.params;

      await addonService.unassignAddonFromRoom(roomId, addonId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // POST /api/addons/rooms/:roomId/sync
  // Sync room add-ons (bulk replace all assignments)
  // --------------------------------------------------------------------------
  async syncRoomAddons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomId } = req.params;
      const { addon_ids } = req.body;

      // Validation
      if (!Array.isArray(addon_ids)) {
        sendError(res, 'VALIDATION_ERROR', 'addon_ids must be an array', 400);
        return;
      }

      // Validate all addon IDs are strings
      if (addon_ids.some((id) => typeof id !== 'string')) {
        sendError(res, 'VALIDATION_ERROR', 'All addon_ids must be strings', 400);
        return;
      }

      // Extract user ID from request if available (for assigned_by field)
      const userId = (req as any).user?.id;

      await addonService.syncRoomAddons(roomId, addon_ids, userId);
      sendSuccess(res, { message: 'Room add-ons synced successfully', count: addon_ids.length });
    } catch (error) {
      next(error);
    }
  },
};
