/**
 * Admin Email Controller
 *
 * Handles all HTTP endpoints for email template management.
 * All routes require super admin authentication.
 */

import { Request, Response, NextFunction } from 'express';
import * as emailTemplateService from '../services/email-template.service';
import { sendSuccess } from '../utils/response';

// ============================================================================
// Categories
// ============================================================================

export const listCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] listCategories ===');

    const categories = await emailTemplateService.getCategories();

    sendSuccess(res, { categories });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] listCategories error:', error);
    next(error);
  }
};

// ============================================================================
// Templates - CRUD
// ============================================================================

export const listTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] listTemplates ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Query:', req.query);

    const params = {
      category_id: req.query.category_id as string,
      template_type: req.query.template_type as any,
      feature_tag: req.query.feature_tag as string,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: req.query.search as string,
    };

    const result = await emailTemplateService.getTemplates(params);

    sendSuccess(res, result);
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] listTemplates error:', error);
    next(error);
  }
};

export const getTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] getTemplate ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Template ID:', req.params.id);

    const template = await emailTemplateService.getTemplateById(req.params.id);

    sendSuccess(res, { template });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] getTemplate error:', error);
    next(error);
  }
};

export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] createTemplate ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] User:', req.user!.id);
    console.log('[ADMIN_EMAIL_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

    const template = await emailTemplateService.createTemplate(
      req.user!.id,
      req.body
    );

    sendSuccess(res, { template }, 201);
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] createTemplate error:', error);
    next(error);
  }
};

export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] updateTemplate ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Template ID:', req.params.id);
    console.log('[ADMIN_EMAIL_CONTROLLER] User:', req.user!.id);
    console.log('[ADMIN_EMAIL_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

    const template = await emailTemplateService.updateTemplate(
      req.params.id,
      req.user!.id,
      req.body
    );

    sendSuccess(res, { template });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] updateTemplate error:', error);
    next(error);
  }
};

export const toggleTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] toggleTemplate ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Template ID:', req.params.id);
    console.log('[ADMIN_EMAIL_CONTROLLER] Is active:', req.body.is_active);

    const template = await emailTemplateService.toggleTemplate(
      req.params.id,
      req.user!.id,
      req.body.is_active
    );

    sendSuccess(res, { template });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] toggleTemplate error:', error);
    next(error);
  }
};

export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] deleteTemplate ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Template ID:', req.params.id);

    await emailTemplateService.deleteTemplate(req.params.id);

    sendSuccess(res, { message: 'Template deleted successfully' });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] deleteTemplate error:', error);
    next(error);
  }
};

// ============================================================================
// Preview & Testing
// ============================================================================

export const previewTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] previewTemplate ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

    const preview = await emailTemplateService.previewTemplate(req.body);

    sendSuccess(res, { preview });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] previewTemplate error:', error);
    next(error);
  }
};

export const sendTestEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] sendTestEmail ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Template ID:', req.params.id);
    console.log('[ADMIN_EMAIL_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

    const emailSend = await emailTemplateService.sendTestEmail(
      {
        template_id: req.params.id,
        recipient_email: req.body.recipient_email,
        test_variables: req.body.test_variables,
      },
      req.user!.id
    );

    sendSuccess(res, { emailSend, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] sendTestEmail error:', error);
    next(error);
  }
};

// ============================================================================
// Supabase Sync
// ============================================================================

export const syncToSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] syncToSupabase ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Template ID:', req.params.id);

    const result = await emailTemplateService.syncTemplateToSupabase(
      { template_id: req.params.id },
      req.user!.id
    );

    if (result.success) {
      sendSuccess(res, result);
    } else {
      // Return error but with 200 status (sync attempt was made)
      res.status(200).json({
        success: false,
        data: result,
        message: `Sync failed: ${result.error}`,
      });
    }
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] syncToSupabase error:', error);
    next(error);
  }
};

// ============================================================================
// Analytics
// ============================================================================

export const getTemplateAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] getTemplateAnalytics ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Template ID:', req.params.id);

    const analytics = await emailTemplateService.getTemplateAnalytics(req.params.id);

    sendSuccess(res, { analytics });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] getTemplateAnalytics error:', error);
    next(error);
  }
};

export const getTemplateChangelog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [ADMIN_EMAIL_CONTROLLER] getTemplateChangelog ===');
    console.log('[ADMIN_EMAIL_CONTROLLER] Template ID:', req.params.id);

    const changelog = await emailTemplateService.getTemplateChangelog(req.params.id);

    sendSuccess(res, { changelog });
  } catch (error) {
    console.error('[ADMIN_EMAIL_CONTROLLER] getTemplateChangelog error:', error);
    next(error);
  }
};
