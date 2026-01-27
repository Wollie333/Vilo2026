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

// PDF download route (public - no auth required for guests to download)
router.get(
  '/cancellation-policies/:id/pdf',
  legalController.downloadCancellationPolicyPDF
);

// Authenticated routes (create, update, delete)
// RLS policies handle permission checks (users can manage their own custom policies)
router.post(
  '/cancellation-policies',
  authenticate,
  loadUserProfile,
  legalController.createCancellationPolicy
);

router.put(
  '/cancellation-policies/:id',
  authenticate,
  loadUserProfile,
  legalController.updateCancellationPolicy
);

router.delete(
  '/cancellation-policies/:id',
  authenticate,
  loadUserProfile,
  legalController.deleteCancellationPolicy
);

export default router;
