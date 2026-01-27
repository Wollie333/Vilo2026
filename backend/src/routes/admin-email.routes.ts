/**
 * Admin Email Routes
 *
 * All routes for email template management.
 * Protected by super admin authentication.
 */

import { Router } from 'express';
import * as adminEmailController from '../controllers/admin-email.controller';
import { requireSuperAdmin } from '../middleware/rbac.middleware';
import { authenticate, loadUserProfile } from '../middleware/auth.middleware';

const router = Router();

// Log all incoming requests to admin email routes
router.use((req, _res, next) => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔵 [ADMIN-EMAIL-ROUTES] Incoming request');
  console.log('   Method:', req.method);
  console.log('   Path:', req.path);
  console.log('   Full URL:', req.originalUrl);
  console.log('   Has Auth Header:', !!req.headers.authorization);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  next();
});

// All routes require super admin authentication
// Chain: authenticate (verifies JWT) → loadUserProfile (loads roles) → requireSuperAdmin (checks role)
router.use(authenticate, loadUserProfile, requireSuperAdmin());

// ============================================================================
// Categories
// ============================================================================

/**
 * GET /api/admin/email/categories
 * Get all email template categories
 */
router.get('/categories', adminEmailController.listCategories);

// ============================================================================
// Templates - CRUD
// ============================================================================

/**
 * GET /api/admin/email/templates
 * Get all email templates with optional filters
 * Query params: category_id, template_type, feature_tag, is_active, search
 */
router.get('/templates', adminEmailController.listTemplates);

/**
 * GET /api/admin/email/templates/:id
 * Get single template by ID
 */
router.get('/templates/:id', adminEmailController.getTemplate);

/**
 * POST /api/admin/email/templates
 * Create new email template
 */
router.post('/templates', adminEmailController.createTemplate);

/**
 * PUT /api/admin/email/templates/:id
 * Update existing email template
 */
router.put('/templates/:id', adminEmailController.updateTemplate);

/**
 * PATCH /api/admin/email/templates/:id/toggle
 * Toggle template active status
 * Body: { is_active: boolean }
 */
router.patch('/templates/:id/toggle', adminEmailController.toggleTemplate);

/**
 * DELETE /api/admin/email/templates/:id
 * Delete email template (if not system template)
 */
router.delete('/templates/:id', adminEmailController.deleteTemplate);

// ============================================================================
// Preview & Testing
// ============================================================================

/**
 * POST /api/admin/email/templates/preview
 * Preview rendered email template
 * Body: { subject_template, html_template, variables }
 */
router.post('/templates/preview', adminEmailController.previewTemplate);

/**
 * POST /api/admin/email/templates/:id/test
 * Send test email with template
 * Body: { recipient_email, test_variables }
 */
router.post('/templates/:id/test', adminEmailController.sendTestEmail);

// ============================================================================
// Supabase Integration
// ============================================================================

/**
 * POST /api/admin/email/templates/:id/sync-supabase
 * Sync template to Supabase Auth
 * Only works for supabase_auth type templates
 */
router.post('/templates/:id/sync-supabase', adminEmailController.syncToSupabase);

// ============================================================================
// Analytics
// ============================================================================

/**
 * GET /api/admin/email/templates/:id/analytics
 * Get analytics for template (send counts by status, recent sends)
 */
router.get('/templates/:id/analytics', adminEmailController.getTemplateAnalytics);

/**
 * GET /api/admin/email/templates/:id/changelog
 * Get change history for template
 */
router.get('/templates/:id/changelog', adminEmailController.getTemplateChangelog);

export default router;
