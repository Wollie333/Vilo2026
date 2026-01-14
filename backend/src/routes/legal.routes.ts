import { Router } from 'express';
import { legalController } from '../controllers/legal.controller';
import { authenticate, requireAdmin, loadUserProfile } from '../middleware';

const router = Router();

// ============================================================================
// Legal Routes - Cancellation Policies
// ============================================================================

// Public routes (read-only for active policies)
router.get(
  '/cancellation-policies',
  authenticate,
  legalController.getCancellationPolicies
);

router.get(
  '/cancellation-policies/:id',
  authenticate,
  legalController.getCancellationPolicy
);

// Admin routes (create, update, delete)
router.post(
  '/cancellation-policies',
  authenticate,
  loadUserProfile,
  requireAdmin(),
  legalController.createCancellationPolicy
);

router.put(
  '/cancellation-policies/:id',
  authenticate,
  loadUserProfile,
  requireAdmin(),
  legalController.updateCancellationPolicy
);

router.delete(
  '/cancellation-policies/:id',
  authenticate,
  loadUserProfile,
  requireAdmin(),
  legalController.deleteCancellationPolicy
);

export default router;
