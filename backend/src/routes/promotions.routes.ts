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

console.log('🔧 [PROMOTIONS ROUTES] Router initialized');

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Test route to verify routing is working
router.post('/promotions/test', (req, res) => {
  console.log('✅ [TEST ROUTE] Test endpoint hit!');
  res.json({ success: true, message: 'Test route works - routing is OK!' });
});

// Public route for promo code validation (no auth required for guest booking)
// Path is /api/promotions/validate (this router is mounted at /api/ in index.ts)
router.post('/promotions/validate', (req, res, next) => {
  console.log('🎯 [PROMOTIONS ROUTES] /promotions/validate route HIT');
  console.log('🎯 [PROMOTIONS ROUTES] Headers:', req.headers);
  console.log('🎯 [PROMOTIONS ROUTES] Body:', req.body);
  next();
}, promotionController.validatePromoCode);

// NOTE: Claim promotion route is now in discovery.routes.ts
// to ensure it's truly public and works regardless of authentication status

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

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
