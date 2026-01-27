/**
 * WhatsApp Webhook Controller
 * Handles Meta WhatsApp Business API webhook callbacks
 */

import { Request, Response } from 'express';
import * as whatsappService from '../services/whatsapp.service';
import type { MetaWebhookMessage } from '../types/whatsapp.types';

/**
 * Verify webhook (GET request from Meta during setup)
 * GET /api/whatsapp/webhooks
 */
export const verifyWebhook = (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    console.log('Webhook verification request:', { mode, token });

    const result = whatsappService.verifyWebhookToken(mode, token, challenge);

    if (result) {
      console.log('Webhook verified successfully');
      res.status(200).send(result);
    } else {
      console.log('Webhook verification failed');
      res.status(403).send('Forbidden');
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Handle webhook (POST request from Meta)
 * POST /api/whatsapp/webhooks
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // Get signature from header
    const signature = req.headers['x-hub-signature-256'] as string;

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    if (!whatsappService.verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return res.status(403).json({
        error: 'INVALID_SIGNATURE',
        message: 'Webhook signature verification failed',
      });
    }

    const webhookData: MetaWebhookMessage = req.body;

    console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

    // Process webhook asynchronously (don't block response)
    whatsappService.processWebhook(webhookData).catch((error) => {
      console.error('Webhook processing error:', error);
    });

    // Meta requires a 200 OK response to be sent immediately
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Handle webhook error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to handle webhook',
    });
  }
};

/**
 * Test webhook (for development)
 * POST /api/whatsapp/webhooks/test
 */
export const testWebhook = async (req: Request, res: Response) => {
  try {
    console.log('Test webhook called with:', req.body);

    // Process test webhook
    await whatsappService.processWebhook(req.body);

    res.json({ success: true, message: 'Test webhook processed' });
  } catch (error: any) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to process test webhook',
    });
  }
};
