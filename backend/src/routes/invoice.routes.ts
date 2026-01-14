import { Router, RequestHandler } from 'express';
import multer from 'multer';
import * as invoiceController from '../controllers/invoice.controller';
import {
  authenticate,
  loadUserProfile,
  requireAdmin,
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware';
import {
  updateInvoiceSettingsSchema,
  invoiceListQuerySchema,
  invoiceIdParamSchema,
} from '../validators/invoice.validators';

const router = Router();

// Configure multer for logo uploads
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

// ============================================================================
// AUTHENTICATED ENDPOINTS - All routes require authentication
// ============================================================================

router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * GET /api/invoices/my-invoices
 * Get current user's invoices
 */
router.get(
  '/my-invoices',
  validateQuery(invoiceListQuerySchema),
  invoiceController.getMyInvoices
);

/**
 * GET /api/invoices/:id
 * Get single invoice (user can access their own, admin can access all)
 */
router.get(
  '/:id',
  validateParams(invoiceIdParamSchema),
  invoiceController.getInvoice
);

/**
 * GET /api/invoices/:id/download
 * Get signed download URL for invoice PDF
 */
router.get(
  '/:id/download',
  validateParams(invoiceIdParamSchema),
  invoiceController.downloadInvoice
);

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /api/invoices/admin/settings
 * Get invoice settings
 */
router.get(
  '/admin/settings',
  requireAdmin(),
  invoiceController.getSettings
);

/**
 * PATCH /api/invoices/admin/settings
 * Update invoice settings
 */
router.patch(
  '/admin/settings',
  requireAdmin(),
  validateBody(updateInvoiceSettingsSchema),
  invoiceController.updateSettings
);

/**
 * POST /api/invoices/admin/logo
 * Upload invoice logo
 */
router.post(
  '/admin/logo',
  requireAdmin(),
  logoUpload.single('logo') as unknown as RequestHandler,
  invoiceController.uploadLogo
);

/**
 * DELETE /api/invoices/admin/logo
 * Delete invoice logo
 */
router.delete(
  '/admin/logo',
  requireAdmin(),
  invoiceController.deleteLogo
);

/**
 * GET /api/invoices/admin/list
 * List all invoices
 */
router.get(
  '/admin/list',
  requireAdmin(),
  validateQuery(invoiceListQuerySchema),
  invoiceController.listAllInvoices
);

/**
 * POST /api/invoices/admin/:id/void
 * Void an invoice
 */
router.post(
  '/admin/:id/void',
  requireAdmin(),
  validateParams(invoiceIdParamSchema),
  invoiceController.voidInvoice
);

/**
 * POST /api/invoices/admin/:id/regenerate-pdf
 * Regenerate PDF for an invoice
 */
router.post(
  '/admin/:id/regenerate-pdf',
  requireAdmin(),
  validateParams(invoiceIdParamSchema),
  invoiceController.regeneratePDF
);

/**
 * POST /api/invoices/admin/bookings/:bookingId/generate
 * Manually generate invoice for a paid booking
 */
router.post(
  '/admin/bookings/:bookingId/generate',
  requireAdmin(),
  invoiceController.generateBookingInvoice
);

export default router;
