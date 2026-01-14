import { Router } from 'express';
import { getFailedCheckoutAnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/failed-checkouts
 * Get failed checkout analytics with optional filters
 * Query params: startDate, endDate, propertyId, paymentMethod
 */
router.get('/failed-checkouts', getFailedCheckoutAnalyticsController);

export default router;
