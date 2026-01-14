import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate, loadUserProfile } from '../middleware';

const router = Router();

// ============================================================================
// AUTHENTICATED ROUTES
// All dashboard routes require authentication
// ============================================================================

// Property Owner Dashboard
router.get(
  '/property-owner',
  authenticate,
  loadUserProfile,
  dashboardController.getPropertyOwnerDashboard
);

// Guest Dashboard
router.get(
  '/guest',
  authenticate,
  loadUserProfile,
  dashboardController.getGuestDashboard
);

// Admin Dashboard
router.get(
  '/admin',
  authenticate,
  loadUserProfile,
  dashboardController.getAdminDashboard
);

// Super Admin Dashboard
router.get(
  '/super-admin',
  authenticate,
  loadUserProfile,
  dashboardController.getSuperAdminDashboard
);

// Clear dashboard cache (admin only)
router.post(
  '/clear-cache',
  authenticate,
  loadUserProfile,
  dashboardController.clearDashboardCache
);

export default router;
