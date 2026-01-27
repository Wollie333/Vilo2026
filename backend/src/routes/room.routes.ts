/**
 * Room Routes
 * Route definitions for room management endpoints.
 */

import { Router, RequestHandler } from 'express';
import multer from 'multer';
import * as roomController from '../controllers/room.controller';
import { addonController } from '../controllers/addon.controller';
import {
  authenticate,
  loadUserProfile,
  validateBody,
  validateParams,
} from '../middleware';
import {
  roomIdParamSchema,
  propertyIdParamSchema,
  bedIdParamSchema,
  rateIdParamSchema,
  promotionIdParamSchema,
  addonIdParamSchema,
  createRoomSchema,
  updateRoomSchema,
  pauseRoomSchema,
  createRoomBedSchema,
  updateRoomBedSchema,
  createSeasonalRateSchema,
  updateSeasonalRateSchema,
  createPromotionSchema,
  updatePromotionSchema,
  createAddOnSchema,
  updateAddOnSchema,
  priceCalculationSchema,
  availabilityCheckSchema,
} from '../validators/room.validators';

// Configure multer for room image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

const router = Router();

// ============================================================================
// PUBLIC ROUTES (no authentication required)
// ============================================================================

/**
 * POST /api/rooms/:id/availability/public
 * Check room availability (PUBLIC - for guest bookings)
 */
export const publicRoomRoutes = Router();

// Debug logging middleware for public routes
publicRoomRoutes.use((req, _res, next) => {
  console.log('🔓 [PUBLIC_ROOM_ROUTES] Request received:', req.method, req.path);
  console.log('🔓 [PUBLIC_ROOM_ROUTES] Full URL:', req.originalUrl);
  console.log('🔓 [PUBLIC_ROOM_ROUTES] Params:', req.params);
  next();
});

publicRoomRoutes.post(
  '/:id/availability/public',
  (req, _res, next) => {
    console.log('✅ [PUBLIC_ROOM_ROUTES] MATCHED availability/public route!');
    console.log('  Room ID:', req.params.id);
    console.log('  Body:', req.body);
    next();
  },
  validateParams(roomIdParamSchema),
  validateBody(availabilityCheckSchema),
  roomController.checkAvailability
);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// Room Limits (must be before :id routes)
// ============================================================================

/**
 * GET /api/rooms/limits
 * Get room limit info for current user
 */
router.get('/limits', roomController.getRoomLimits);

// ============================================================================
// Room CRUD Routes
// ============================================================================

/**
 * GET /api/rooms
 * List all rooms for current user
 */
router.get('/', roomController.listRooms);

/**
 * GET /api/rooms/:id
 * Get a single room by ID
 */
router.get(
  '/:id',
  validateParams(roomIdParamSchema),
  roomController.getRoom
);

/**
 * POST /api/rooms
 * Create a new room
 */
router.post(
  '/',
  validateBody(createRoomSchema),
  roomController.createRoom
);

/**
 * PUT /api/rooms/:id
 * Update a room
 */
router.put(
  '/:id',
  validateParams(roomIdParamSchema),
  validateBody(updateRoomSchema),
  roomController.updateRoom
);

/**
 * DELETE /api/rooms/:id
 * Delete a room
 */
router.delete(
  '/:id',
  validateParams(roomIdParamSchema),
  roomController.deleteRoom
);

// ============================================================================
// Room Status Routes
// ============================================================================

/**
 * POST /api/rooms/:id/pause
 * Pause a room
 */
router.post(
  '/:id/pause',
  validateParams(roomIdParamSchema),
  validateBody(pauseRoomSchema),
  roomController.pauseRoom
);

/**
 * POST /api/rooms/:id/unpause
 * Unpause a room
 */
router.post(
  '/:id/unpause',
  validateParams(roomIdParamSchema),
  roomController.unpauseRoom
);

// ============================================================================
// Image Upload Routes
// ============================================================================

/**
 * POST /api/rooms/:id/featured-image
 * Upload a featured image for a room
 */
router.post(
  '/:id/featured-image',
  validateParams(roomIdParamSchema),
  imageUpload.single('image') as unknown as RequestHandler,
  roomController.uploadFeaturedImage
);

/**
 * DELETE /api/rooms/:id/featured-image
 * Delete the featured image for a room
 */
router.delete(
  '/:id/featured-image',
  validateParams(roomIdParamSchema),
  roomController.deleteFeaturedImage
);

/**
 * POST /api/rooms/:id/gallery-image
 * Upload a gallery image for a room
 */
router.post(
  '/:id/gallery-image',
  validateParams(roomIdParamSchema),
  imageUpload.single('image') as unknown as RequestHandler,
  roomController.uploadGalleryImage
);

/**
 * DELETE /api/rooms/:id/gallery-image
 * Delete a gallery image for a room
 */
router.delete(
  '/:id/gallery-image',
  validateParams(roomIdParamSchema),
  roomController.deleteGalleryImage
);

// ============================================================================
// Pricing & Availability Routes
// ============================================================================

/**
 * POST /api/rooms/:id/price
 * Calculate price for a room
 */
router.post(
  '/:id/price',
  validateParams(roomIdParamSchema),
  validateBody(priceCalculationSchema),
  roomController.calculatePrice
);

/**
 * POST /api/rooms/:id/availability
 * Check room availability
 */
router.post(
  '/:id/availability',
  validateParams(roomIdParamSchema),
  validateBody(availabilityCheckSchema),
  roomController.checkAvailability
);

/**
 * GET /api/rooms/:id/addons
 * Get add-ons assigned to a specific room
 */
router.get(
  '/:id/addons',
  validateParams(roomIdParamSchema),
  addonController.getRoomAddOns
);

// ============================================================================
// Room Beds Routes
// ============================================================================

/**
 * POST /api/rooms/:id/beds
 * Add a bed to a room
 */
router.post(
  '/:id/beds',
  validateParams(roomIdParamSchema),
  validateBody(createRoomBedSchema),
  roomController.addBed
);

/**
 * PUT /api/rooms/:id/beds/:bedId
 * Update a room bed
 */
router.put(
  '/:id/beds/:bedId',
  validateParams(bedIdParamSchema),
  validateBody(updateRoomBedSchema),
  roomController.updateBed
);

/**
 * DELETE /api/rooms/:id/beds/:bedId
 * Delete a room bed
 */
router.delete(
  '/:id/beds/:bedId',
  validateParams(bedIdParamSchema),
  roomController.deleteBed
);

// ============================================================================
// Seasonal Rates Routes
// ============================================================================

/**
 * POST /api/rooms/:id/rates
 * Add a seasonal rate
 */
router.post(
  '/:id/rates',
  validateParams(roomIdParamSchema),
  validateBody(createSeasonalRateSchema),
  roomController.addSeasonalRate
);

/**
 * PUT /api/rooms/:id/rates/:rateId
 * Update a seasonal rate
 */
router.put(
  '/:id/rates/:rateId',
  validateParams(rateIdParamSchema),
  validateBody(updateSeasonalRateSchema),
  roomController.updateSeasonalRate
);

/**
 * DELETE /api/rooms/:id/rates/:rateId
 * Delete a seasonal rate
 */
router.delete(
  '/:id/rates/:rateId',
  validateParams(rateIdParamSchema),
  roomController.deleteSeasonalRate
);

// ============================================================================
// Promotions Routes
// ============================================================================

/**
 * POST /api/rooms/:id/promotions
 * Add a promotion
 */
router.post(
  '/:id/promotions',
  validateParams(roomIdParamSchema),
  validateBody(createPromotionSchema),
  roomController.addPromotion
);

/**
 * PUT /api/rooms/:id/promotions/:promotionId
 * Update a promotion
 */
router.put(
  '/:id/promotions/:promotionId',
  validateParams(promotionIdParamSchema),
  validateBody(updatePromotionSchema),
  roomController.updatePromotion
);

/**
 * DELETE /api/rooms/:id/promotions/:promotionId
 * Delete a promotion
 */
router.delete(
  '/:id/promotions/:promotionId',
  validateParams(promotionIdParamSchema),
  roomController.deletePromotion
);

export default router;

// ============================================================================
// Property-scoped Routes (to be added to property routes)
// ============================================================================

/**
 * These routes are property-scoped and should be mounted under /api/properties/:propertyId
 *
 * GET  /api/properties/:propertyId/rooms       - List rooms for property
 * GET  /api/properties/:propertyId/addons      - List add-ons for property
 * POST /api/properties/:propertyId/addons      - Create add-on
 * PUT  /api/properties/:propertyId/addons/:id  - Update add-on
 * DELETE /api/properties/:propertyId/addons/:id - Delete add-on
 */

export const propertyRoomRoutes = Router({ mergeParams: true });

propertyRoomRoutes.use(authenticate);
propertyRoomRoutes.use(loadUserProfile);

propertyRoomRoutes.get('/rooms', roomController.listPropertyRooms);
propertyRoomRoutes.get('/addons', roomController.listAddOns);
propertyRoomRoutes.post(
  '/addons',
  validateBody(createAddOnSchema),
  roomController.createAddOn
);
propertyRoomRoutes.put(
  '/addons/:addonId',
  validateParams(addonIdParamSchema),
  validateBody(updateAddOnSchema),
  roomController.updateAddOn
);
propertyRoomRoutes.delete(
  '/addons/:addonId',
  validateParams(addonIdParamSchema),
  roomController.deleteAddOn
);
