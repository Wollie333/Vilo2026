/**
 * WhatsApp Routes
 * Routes for WhatsApp templates, messages, opt-outs, and webhooks
 */

import { Router } from 'express';
import * as whatsappController from '../controllers/whatsapp.controller';
import * as webhookController from '../controllers/whatsapp-webhook.controller';
import { authenticate, loadUserProfile } from '../middleware/auth.middleware';
import { requireManager } from '../middleware/rbac.middleware';

const router = Router();

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

// List templates
router.get('/templates', authenticate, loadUserProfile, whatsappController.listTemplates);

// Get single template
router.get('/templates/:id', authenticate, loadUserProfile, whatsappController.getTemplate);

// Create template
router.post('/templates', authenticate, loadUserProfile, requireManager(), whatsappController.createTemplate);

// Update template
router.patch('/templates/:id', authenticate, loadUserProfile, requireManager(), whatsappController.updateTemplate);

// Delete template
router.delete('/templates/:id', authenticate, loadUserProfile, requireManager(), whatsappController.deleteTemplate);

// Submit template to Meta
router.post(
  '/templates/:id/submit-to-meta',
  authenticate,
  loadUserProfile,
  requireManager(),
  whatsappController.submitTemplateToMeta
);

// Get template Meta approval status
router.get('/templates/:id/status', authenticate, loadUserProfile, whatsappController.getTemplateStatus);

// Get available placeholders
router.get('/templates/placeholders/:type', authenticate, loadUserProfile, whatsappController.getPlaceholders);

// ============================================================================
// MESSAGE MANAGEMENT
// ============================================================================

// Get message delivery status
router.get('/messages/:chatMessageId/status', authenticate, loadUserProfile, whatsappController.getMessageStatus);

// Get message metadata
router.get('/messages/:chatMessageId/metadata', authenticate, loadUserProfile, whatsappController.getMessageMetadata);

// Manually send WhatsApp message
router.post('/messages/send', authenticate, loadUserProfile, requireManager(), whatsappController.sendMessage);

// ============================================================================
// OPT-OUT MANAGEMENT
// ============================================================================

// List opt-outs
router.get('/opt-outs', authenticate, loadUserProfile, requireManager(), whatsappController.listOptOuts);

// Add opt-out
router.post('/opt-outs', authenticate, loadUserProfile, requireManager(), whatsappController.addOptOut);

// Remove opt-out (re-opt-in)
router.delete('/opt-outs/:phone', authenticate, loadUserProfile, requireManager(), whatsappController.removeOptOut);

// Check opt-out status
router.get('/opt-outs/:phone/status', authenticate, loadUserProfile, whatsappController.checkOptOutStatus);

// ============================================================================
// QUEUE MANAGEMENT (Admin only)
// ============================================================================

// Get queue statistics
router.get('/queue', authenticate, loadUserProfile, requireManager(), whatsappController.getQueueStats);

// List pending queue items
router.get('/queue/pending', authenticate, loadUserProfile, requireManager(), whatsappController.listPendingItems);

// Manually retry queue item
router.post('/queue/:id/retry', authenticate, loadUserProfile, requireManager(), whatsappController.retryQueueItem);

// Cancel queue item
router.delete('/queue/:id', authenticate, loadUserProfile, requireManager(), whatsappController.cancelQueueItem);

// ============================================================================
// WEBHOOKS (No authentication - verified by signature)
// ============================================================================

// Webhook verification (GET) and handling (POST)
router.get('/webhooks', webhookController.verifyWebhook);
router.post('/webhooks', webhookController.handleWebhook);

// Test webhook (for development)
router.post('/webhooks/test', authenticate, loadUserProfile, requireManager(), webhookController.testWebhook);

// ============================================================================
// CONFIGURATION
// ============================================================================

// Get WhatsApp configuration status
router.get('/config', authenticate, loadUserProfile, requireManager(), whatsappController.getConfigStatus);

export default router;
