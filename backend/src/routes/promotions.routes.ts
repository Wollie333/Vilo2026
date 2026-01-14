/**
 * Promotions Routes
 *
 * API routes for centralized promotions management.
 */

import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller';
import * as roomController from '../controllers/room.controller';
import { authenticate } from '../middleware';

const router = Router();

// Public route for promo code validation (no auth required for guest booking)
router.post('/promotions/validate', promotionController.validatePromoCode);

// All routes below require authentication
router.use(authenticate);

/**
 * Centralized Management - Global Promotions
 */

// List all promotions across properties
router.get('/promotions', promotionController.getPromotions);

// Create promotion (property-level)
router.post('/promotions', promotionController.createPromotion);

// Get a specific promotion by ID
router.get('/promotions/:id', promotionController.getPromotion);

// Update promotion by ID
router.put('/promotions/:id', promotionController.updatePromotion);

// Delete promotion by ID
router.delete('/promotions/:id', promotionController.deletePromotion);

// Get room assignments for a promotion
router.get('/promotions/:id/assignments', roomController.getPromotionAssignments);

// Assign promotion to multiple rooms
router.post('/promotions/:id/assign-rooms', roomController.assignPromotionToRooms);

// Unassign promotion from a specific room
router.delete('/promotions/:id/unassign-room/:roomId', roomController.unassignPromotionFromRoom);

export default router;
