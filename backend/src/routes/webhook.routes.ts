import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

// ============================================================================
// PAYMENT WEBHOOKS
// These endpoints receive webhook calls from payment providers
// They should NOT require authentication - payment providers can't authenticate
// ============================================================================

/**
 * POST /api/webhooks/paystack
 * Paystack payment webhook endpoint
 */
router.post('/paystack', webhookController.handlePaystackWebhook);

/**
 * POST /api/webhooks/paypal
 * PayPal payment webhook endpoint
 */
router.post('/paypal', webhookController.handlePayPalWebhook);

// ============================================================================
// REFUND WEBHOOKS
// These endpoints receive refund status updates from payment providers
// ============================================================================

/**
 * POST /api/webhooks/paystack/refund
 * Paystack refund webhook endpoint
 */
router.post('/paystack/refund', webhookController.handlePaystackRefundWebhook);

/**
 * POST /api/webhooks/paypal/refund
 * PayPal refund webhook endpoint
 */
router.post('/paypal/refund', webhookController.handlePayPalRefundWebhook);

export default router;
