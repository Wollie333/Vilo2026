import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/rbac.middleware';
import * as adminSubscriptionController from '../controllers/admin-subscription.controller';

const router = Router();

// All routes require authentication and super admin role
router.use(authenticate);
router.use(requireSuperAdmin);

// ============================================================================
// ADMIN SUBSCRIPTION MANAGEMENT ROUTES
// ============================================================================

/**
 * POST /api/admin/users/:userId/subscription/upgrade
 * Create upgrade request for a user
 */
router.post(
  '/users/:userId/subscription/upgrade',
  adminSubscriptionController.requestUpgrade
);

/**
 * POST /api/admin/users/:userId/subscription/pause
 * Pause a user's subscription
 */
router.post(
  '/users/:userId/subscription/pause',
  adminSubscriptionController.pauseSubscription
);

/**
 * POST /api/admin/users/:userId/subscription/cancel
 * Cancel a user's subscription
 */
router.post(
  '/users/:userId/subscription/cancel',
  adminSubscriptionController.cancelSubscription
);

/**
 * POST /api/admin/users/:userId/subscription/reactivate
 * Reactivate a paused subscription
 */
router.post(
  '/users/:userId/subscription/reactivate',
  adminSubscriptionController.reactivateSubscription
);

/**
 * GET /api/admin/users/:userId/subscription/display
 * Get formatted subscription display information
 */
router.get(
  '/users/:userId/subscription/display',
  adminSubscriptionController.getSubscriptionDisplay
);

/**
 * GET /api/admin/users/:userId/available-upgrades
 * Get available upgrade plans for a user (higher-tier only)
 */
router.get(
  '/users/:userId/available-upgrades',
  adminSubscriptionController.getAvailableUpgrades
);

/**
 * GET /api/admin/upgrade-requests
 * List all upgrade requests (with filters)
 */
router.get(
  '/upgrade-requests',
  adminSubscriptionController.listUpgradeRequests
);

export default router;
