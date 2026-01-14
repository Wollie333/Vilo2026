import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// Promotion Routes
// ============================================================================

// GET /api/promotions - List all promotions
router.get('/', promotionController.getPromotions);

// GET /api/promotions/:id - Get single promotion
router.get('/:id', promotionController.getPromotion);

// POST /api/promotions - Create promotion
router.post('/', promotionController.createPromotion);

// PUT /api/promotions/:id - Update promotion
router.put('/:id', promotionController.updatePromotion);

// DELETE /api/promotions/:id - Delete promotion
router.delete('/:id', promotionController.deletePromotion);

export default router;
