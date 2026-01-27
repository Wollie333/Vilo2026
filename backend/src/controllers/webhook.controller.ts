import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import * as checkoutService from '../services/checkout.service';
import * as paymentService from '../services/payment.service';
import * as companyPaymentService from '../services/company-payment-integration.service';
import * as refundService from '../services/refund.service';
import { logger } from '../utils/logger';
import type { PaystackConfig, PayPalConfig } from '../types/payment.types';

// ============================================================================
// PAYSTACK WEBHOOK
// ============================================================================

/**
 * POST /api/webhooks/paystack
 * Handle Paystack webhook events
 */
export const handlePaystackWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the webhook secret from payment integration config
    const integration = await paymentService.getIntegration('paystack');
    const config = integration.config as PaystackConfig;

    // Verify signature if webhook secret is configured
    if (integration.webhook_secret) {
      const hash = crypto
        .createHmac('sha512', integration.webhook_secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== req.headers['x-paystack-signature']) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const { event, data } = req.body;

    console.log(`Paystack webhook received: ${event}`);

    // Handle the event
    await checkoutService.handlePaystackWebhook(event, data);

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    // Still return 200 to prevent Paystack from retrying
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
};

// ============================================================================
// PAYPAL WEBHOOK
// ============================================================================

/**
 * POST /api/webhooks/paypal
 * Handle PayPal webhook events
 */
export const handlePayPalWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = req.body;
    const headers = req.headers as Record<string, string>;

    // Get PayPal integration to retrieve webhook ID
    const integration = await paymentService.getIntegration('paypal');
    if (!integration?.webhook_secret) {
      console.error('PayPal webhook ID not configured');
      res.status(500).json({ error: 'Webhook ID not configured' });
      return;
    }

    // Verify webhook signature
    const isValid = await paymentService.verifyPayPalWebhookSignature(
      integration.webhook_secret, // This stores the webhook_id
      headers,
      event
    );

    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Handle the webhook event
    const eventType = event.event_type;

    console.log(`PayPal webhook received (verified): ${eventType}`);

    if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = event.resource?.id;
      if (!orderId) {
        console.error('No order ID in PayPal webhook');
        res.status(400).json({ error: 'Missing order ID' });
        return;
      }

      // Handle the event
      await checkoutService.handlePayPalWebhook(eventType, event.resource);
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    // Still return 200 to prevent PayPal from retrying
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
};

// ============================================================================
// REFUND WEBHOOKS
// ============================================================================

/**
 * POST /api/webhooks/paystack/refund
 * Handle Paystack refund webhook events
 */
export const handlePaystackRefundWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the webhook secret from payment integration config
    const integration = await paymentService.getIntegration('paystack');

    // Verify signature if webhook secret is configured
    if (integration.webhook_secret) {
      const hash = crypto
        .createHmac('sha512', integration.webhook_secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== req.headers['x-paystack-signature']) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const { event, data } = req.body;

    logger.info(`Paystack refund webhook received: ${event}`);

    // Handle refund.processed event
    if (event === 'refund.processed' || event === 'refund.completed') {
      const { reference, amount, status, id } = data;

      // Find refund request by gateway_refund_id
      const refundRequest = await refundService.findRefundByGatewayId(reference || id);

      if (!refundRequest) {
        logger.warn(`Refund request not found for Paystack reference: ${reference || id}`);
        res.status(404).json({ error: 'Refund not found' });
        return;
      }

      // Update refund status based on gateway status
      if (status === 'processed' || status === 'success' || status === 'completed') {
        await refundService.markRefundAsCompleted(refundRequest.id);
        logger.info(`Paystack refund completed: ${reference || id}`);
      } else if (status === 'failed' || status === 'rejected') {
        const errorMessage = data.message || data.gateway_response || 'Refund processing failed';
        await refundService.markRefundAsFailed(refundRequest.id, errorMessage);
        logger.error(`Paystack refund failed: ${reference || id} - ${errorMessage}`);
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('Paystack refund webhook error:', error);
    // Still return 200 to prevent Paystack from retrying
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
};

/**
 * POST /api/webhooks/paypal/refund
 * Handle PayPal refund webhook events
 */
export const handlePayPalRefundWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = req.body;
    const headers = req.headers as Record<string, string>;

    // Get PayPal integration to retrieve webhook ID
    const integration = await paymentService.getIntegration('paypal');
    if (!integration?.webhook_secret) {
      logger.error('PayPal webhook ID not configured');
      res.status(500).json({ error: 'Webhook ID not configured' });
      return;
    }

    // Verify webhook signature
    const isValid = await paymentService.verifyPayPalWebhookSignature(
      integration.webhook_secret, // This stores the webhook_id
      headers,
      event
    );

    if (!isValid) {
      logger.error('Invalid PayPal webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const eventType = event.event_type;

    logger.info(`PayPal refund webhook received (verified): ${eventType}`);

    // Handle PAYMENT.CAPTURE.REFUNDED event
    if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      const refundId = event.resource?.id;
      const refundStatus = event.resource?.status;

      if (!refundId) {
        logger.error('No refund ID in PayPal webhook');
        res.status(400).json({ error: 'Missing refund ID' });
        return;
      }

      // Find refund request by gateway_refund_id
      const refundRequest = await refundService.findRefundByGatewayId(refundId);

      if (!refundRequest) {
        logger.warn(`Refund request not found for PayPal ID: ${refundId}`);
        res.status(404).json({ error: 'Refund not found' });
        return;
      }

      // PayPal refunds are immediately completed when webhook is received
      if (refundStatus === 'COMPLETED') {
        await refundService.markRefundAsCompleted(refundRequest.id);
        logger.info(`PayPal refund completed: ${refundId}`);
      } else if (refundStatus === 'FAILED' || refundStatus === 'CANCELLED') {
        const errorMessage = event.resource?.status_details?.reason || 'Refund processing failed';
        await refundService.markRefundAsFailed(refundRequest.id, errorMessage);
        logger.error(`PayPal refund failed: ${refundId} - ${errorMessage}`);
      }
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('PayPal refund webhook error:', error);
    // Still return 200 to prevent PayPal from retrying
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
};

// ============================================================================
// COMPANY-SPECIFIC PAYMENT WEBHOOKS
// These endpoints receive webhooks for specific company payment integrations
// ============================================================================

/**
 * POST /api/webhooks/company/:companyId/paystack
 * Handle Paystack webhook events for a specific company
 */
export const handleCompanyPaystackWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      res.status(400).json({ error: 'Company ID required' });
      return;
    }

    // Get the company's Paystack integration
    const integration = await companyPaymentService.getCompanyIntegration(
      companyId,
      'paystack'
    );

    if (!integration) {
      logger.error(`Paystack integration not found for company: ${companyId}`);
      res.status(404).json({ error: 'Integration not found' });
      return;
    }

    // Verify signature if webhook secret is configured
    if (integration.webhook_secret) {
      const hash = crypto
        .createHmac('sha512', integration.webhook_secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== req.headers['x-paystack-signature']) {
        logger.error(`Invalid Paystack signature for company: ${companyId}`);
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const { event, data } = req.body;

    logger.info(`Paystack webhook received for company ${companyId}: ${event}`);

    // Handle the event
    await checkoutService.handlePaystackWebhook(event, data);

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Company Paystack webhook error:', error instanceof Error ? { message: error.message, stack: error.stack } : { error });
    // Still return 200 to prevent Paystack from retrying
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
};

/**
 * POST /api/webhooks/company/:companyId/paypal
 * Handle PayPal webhook events for a specific company
 */
export const handleCompanyPayPalWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;
    const event = req.body;
    const headers = req.headers as Record<string, string>;

    if (!companyId) {
      res.status(400).json({ error: 'Company ID required' });
      return;
    }

    // Get the company's PayPal integration
    const integration = await companyPaymentService.getCompanyIntegration(
      companyId,
      'paypal'
    );

    if (!integration?.webhook_secret) {
      logger.error(`PayPal webhook ID not configured for company: ${companyId}`);
      res.status(500).json({ error: 'Webhook ID not configured' });
      return;
    }

    // Verify webhook signature
    const isValid = await paymentService.verifyPayPalWebhookSignature(
      integration.webhook_secret, // This stores the webhook_id
      headers,
      event
    );

    if (!isValid) {
      logger.error(`Invalid PayPal signature for company: ${companyId}`);
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Handle the webhook event
    const eventType = event.event_type;

    logger.info(`PayPal webhook received (verified) for company ${companyId}: ${eventType}`);

    if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = event.resource?.id;
      if (!orderId) {
        logger.error('No order ID in PayPal webhook');
        res.status(400).json({ error: 'Missing order ID' });
        return;
      }

      // Handle the event
      await checkoutService.handlePayPalWebhook(eventType, event.resource);
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Company PayPal webhook error:', error instanceof Error ? { message: error.message, stack: error.stack } : { error });
    // Still return 200 to prevent PayPal from retrying
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
};
