/**
 * WhatsApp Controller
 * Handles API endpoints for templates, messages, and opt-outs
 */

import { Request, Response } from 'express';
import * as whatsappTemplateService from '../services/whatsapp-template.service';
import * as whatsappService from '../services/whatsapp.service';
import * as whatsappQueueService from '../services/whatsapp-queue.service';
import { AppError } from '../utils/errors';

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

/**
 * List templates
 * GET /api/whatsapp/templates
 */
export const listTemplates = async (req: Request, res: Response) => {
  try {
    const params = {
      property_id: req.query.property_id as string | undefined,
      template_type: req.query.template_type as any,
      language_code: req.query.language_code as string | undefined,
      meta_status: req.query.meta_status as any,
      is_enabled: req.query.is_enabled === 'true' ? true : req.query.is_enabled === 'false' ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await whatsappTemplateService.listTemplates(params);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('List templates error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to list templates',
      },
    });
  }
};

/**
 * Get single template
 * GET /api/whatsapp/templates/:id
 */
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await whatsappTemplateService.getTemplateById(id);
    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Get template error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to get template',
      },
    });
  }
};

/**
 * Create template
 * POST /api/whatsapp/templates
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError('UNAUTHORIZED', 'User not authenticated');
    }

    const template = await whatsappTemplateService.createTemplate(req.body, userId);
    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Create template error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to create template',
      },
    });
  }
};

/**
 * Update template
 * PATCH /api/whatsapp/templates/:id
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await whatsappTemplateService.updateTemplate(id, req.body);
    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Update template error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update template',
      },
    });
  }
};

/**
 * Delete template
 * DELETE /api/whatsapp/templates/:id
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await whatsappTemplateService.deleteTemplate(id);
    res.json({
      success: true,
      data: null,
    });
  } catch (error: any) {
    console.error('Delete template error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete template',
      },
    });
  }
};

/**
 * Submit template to Meta
 * POST /api/whatsapp/templates/:id/submit-to-meta
 */
export const submitTemplateToMeta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await whatsappTemplateService.submitTemplateToMeta(id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Submit template to Meta error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to submit template',
      },
    });
  }
};

/**
 * Get template Meta approval status
 * GET /api/whatsapp/templates/:id/status
 */
export const getTemplateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = await whatsappTemplateService.getTemplateStatus(id);
    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Get template status error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to get template status',
      },
    });
  }
};

/**
 * Get available placeholders
 * GET /api/whatsapp/templates/placeholders/:type
 */
export const getPlaceholders = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const placeholderCategories = whatsappTemplateService.getAvailablePlaceholders(type as any);

    // Flatten categories into single array
    const allPlaceholders = Object.values(placeholderCategories).flat();

    res.json({
      success: true,
      data: allPlaceholders,
    });
  } catch (error: any) {
    console.error('Get placeholders error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to get placeholders',
      },
    });
  }
};

// ============================================================================
// MESSAGE STATUS
// ============================================================================

/**
 * Get message delivery status
 * GET /api/whatsapp/messages/:chatMessageId/status
 */
export const getMessageStatus = async (req: Request, res: Response) => {
  try {
    const { chatMessageId } = req.params;
    const status = await whatsappService.getMessageStatus(chatMessageId);

    if (!status) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Message status not found',
      });
    }

    res.json(status);
  } catch (error: any) {
    console.error('Get message status error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to get message status',
    });
  }
};

/**
 * Get WhatsApp metadata for message
 * GET /api/whatsapp/messages/:chatMessageId/metadata
 */
export const getMessageMetadata = async (req: Request, res: Response) => {
  try {
    const { chatMessageId } = req.params;
    // Implementation would query whatsapp_message_metadata table
    res.json({ message: 'Not implemented yet' });
  } catch (error: any) {
    console.error('Get message metadata error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to get message metadata',
    });
  }
};

/**
 * Manually send WhatsApp message
 * POST /api/whatsapp/messages/send
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { recipient_phone, message_type, template_id, template_variables, text_content, company_id } = req.body;

    if (!recipient_phone) {
      throw new AppError('VALIDATION_ERROR', 'recipient_phone is required');
    }

    if (!company_id) {
      throw new AppError('VALIDATION_ERROR', 'company_id is required');
    }

    // Validate phone number
    const formattedPhone = whatsappService.formatPhoneToE164(recipient_phone);
    if (!whatsappService.isValidE164Phone(formattedPhone)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid phone number format');
    }

    // Check opt-out status
    const isOptedOut = await whatsappService.isPhoneOptedOut(formattedPhone);
    if (isOptedOut) {
      throw new AppError('VALIDATION_ERROR', 'Recipient has opted out of WhatsApp messages');
    }

    let result;
    if (message_type === 'template' && template_id) {
      // Send template message
      const template = await whatsappTemplateService.getTemplateById(template_id);

      result = await whatsappService.sendTemplateMessage({
        companyId: company_id,
        to: formattedPhone,
        template_name: template.template_name,
        language_code: template.language_code,
        variables: template_variables || {},
      });
    } else if (message_type === 'text' && text_content) {
      // Send text message
      result = await whatsappService.sendTextMessage({
        companyId: company_id,
        to: formattedPhone,
        text: text_content,
      });
    } else {
      throw new AppError('VALIDATION_ERROR', 'Invalid message type or missing required fields');
    }

    res.json(result);
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to send message',
    });
  }
};

// ============================================================================
// OPT-OUT MANAGEMENT
// ============================================================================

/**
 * List opt-outs
 * GET /api/whatsapp/opt-outs
 */
export const listOptOuts = async (req: Request, res: Response) => {
  try {
    // Implementation would query whatsapp_opt_outs table
    res.json({ message: 'Not implemented yet' });
  } catch (error: any) {
    console.error('List opt-outs error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to list opt-outs',
    });
  }
};

/**
 * Add opt-out
 * POST /api/whatsapp/opt-outs
 */
export const addOptOut = async (req: Request, res: Response) => {
  try {
    const { phone_number, guest_id, opt_out_reason, opt_out_source } = req.body;

    if (!phone_number) {
      throw new AppError('VALIDATION_ERROR', 'phone_number is required');
    }

    await whatsappService.addOptOut({
      phone_number,
      guest_id,
      opt_out_reason,
      opt_out_source: opt_out_source || 'admin',
    });

    res.status(201).json({ message: 'Opt-out added successfully' });
  } catch (error: any) {
    console.error('Add opt-out error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to add opt-out',
    });
  }
};

/**
 * Remove opt-out (re-opt-in)
 * DELETE /api/whatsapp/opt-outs/:phone
 */
export const removeOptOut = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    await whatsappService.removeOptOut(phone);
    res.json({ message: 'Opt-out removed successfully' });
  } catch (error: any) {
    console.error('Remove opt-out error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to remove opt-out',
    });
  }
};

/**
 * Check opt-out status
 * GET /api/whatsapp/opt-outs/:phone/status
 */
export const checkOptOutStatus = async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const isOptedOut = await whatsappService.isPhoneOptedOut(phone);
    res.json({ phone, is_opted_out: isOptedOut });
  } catch (error: any) {
    console.error('Check opt-out status error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to check opt-out status',
    });
  }
};

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

/**
 * Get queue statistics
 * GET /api/whatsapp/queue
 */
export const getQueueStats = async (req: Request, res: Response) => {
  try {
    const stats = await whatsappQueueService.getQueueStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Get queue stats error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to get queue stats',
    });
  }
};

/**
 * List pending queue items
 * GET /api/whatsapp/queue/pending
 */
export const listPendingItems = async (req: Request, res: Response) => {
  try {
    const params = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await whatsappQueueService.listPendingItems(params);
    res.json(result);
  } catch (error: any) {
    console.error('List pending items error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to list pending items',
    });
  }
};

/**
 * Manually retry queue item
 * POST /api/whatsapp/queue/:id/retry
 */
export const retryQueueItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await whatsappQueueService.manualRetry(id);
    res.json({ message: 'Queue item scheduled for retry' });
  } catch (error: any) {
    console.error('Retry queue item error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to retry queue item',
    });
  }
};

/**
 * Cancel queue item
 * DELETE /api/whatsapp/queue/:id
 */
export const cancelQueueItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await whatsappQueueService.cancelQueueItem(id);
    res.json({ message: 'Queue item cancelled' });
  } catch (error: any) {
    console.error('Cancel queue item error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to cancel queue item',
    });
  }
};

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get WhatsApp configuration status
 * GET /api/whatsapp/config
 */
export const getConfigStatus = async (req: Request, res: Response) => {
  try {
    const status = whatsappService.getConfigStatus();
    res.json(status);
  } catch (error: any) {
    console.error('Get config status error:', error);
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Failed to get config status',
    });
  }
};
