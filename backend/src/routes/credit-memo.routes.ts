import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as creditMemoController from '../controllers/credit-memo.controller';

const router = express.Router();

// ============================================================================
// USER ENDPOINTS
// ============================================================================

// Get credit memo details
router.get(
  '/credit-memos/:id',
  authenticate,
  creditMemoController.getCreditMemo
);

// Get credit memo download URL
router.get(
  '/credit-memos/:id/download',
  authenticate,
  creditMemoController.downloadCreditMemo
);

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// List all credit memos (admin)
router.get(
  '/admin/credit-memos',
  authenticate,
  // TODO: Add admin authorization middleware
  creditMemoController.listCreditMemos
);

// Void a credit memo
router.post(
  '/admin/credit-memos/:id/void',
  authenticate,
  // TODO: Add super_admin authorization middleware
  creditMemoController.voidCreditMemo
);

// Regenerate PDF for credit memo
router.post(
  '/admin/credit-memos/:id/regenerate-pdf',
  authenticate,
  // TODO: Add admin authorization middleware
  creditMemoController.regeneratePDF
);

// Generate credit memo for refund request (manual trigger)
router.post(
  '/admin/refunds/:refundId/generate-credit-memo',
  authenticate,
  // TODO: Add admin authorization middleware
  creditMemoController.generateCreditMemo
);

export default router;
