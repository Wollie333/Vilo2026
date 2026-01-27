/**
 * WhatsApp Service - Meta WhatsApp Business API Client
 * Handles sending messages, webhooks, and delivery status tracking
 *
 * Multi-Tenant Support:
 * - Each company can configure their own WhatsApp Business API credentials
 * - Credentials are stored encrypted in company_whatsapp_config table
 * - Falls back to env vars if no company config found (for development)
 */

import crypto from 'crypto';
import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import * as companyWhatsAppConfigService from './company-whatsapp-config.service';
import type {
  MetaSendTemplateRequest,
  MetaSendTextRequest,
  MetaSendResponse,
  MetaWebhookMessage,
  MessageStatus,
  WhatsAppSendResult,
} from '../types/whatsapp.types';

// Environment configuration (fallback for development)
const WHATSAPP_API_BASE = process.env.WHATSAPP_API_BASE || 'https://graph.facebook.com';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || '';
const WHATSAPP_WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
const WHATSAPP_MOCK_MODE = process.env.WHATSAPP_MOCK_MODE === 'true';

/**
 * Mock WhatsApp API for development/testing
 */
class MockWhatsAppAPI {
  async sendMessage(payload: any): Promise<MetaSendResponse> {
    console.log('[MOCK WhatsApp] Sending message:', JSON.stringify(payload, null, 2));

    return {
      messaging_product: 'whatsapp',
      contacts: [{ input: payload.to, wa_id: payload.to }],
      messages: [{ id: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}` }],
    };
  }

  async getMediaUrl(mediaId: string): Promise<{ url: string }> {
    console.log('[MOCK WhatsApp] Getting media URL for:', mediaId);
    return { url: `https://mock-media-url.com/${mediaId}` };
  }
}

/**
 * Real Meta WhatsApp API client
 */
class MetaWhatsAppAPI {
  private baseUrl: string;
  private phoneNumberId: string;
  private accessToken: string;

  constructor(phoneNumberId: string, accessToken: string, apiVersion: string = 'v18.0') {
    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp credentials (phone_number_id and access_token) are required');
    }

    this.baseUrl = `${WHATSAPP_API_BASE}/${apiVersion}`;
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;
  }

  /**
   * Send a message via Meta WhatsApp API
   */
  async sendMessage(payload: MetaSendTemplateRequest | MetaSendTextRequest): Promise<MetaSendResponse> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Meta API error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data: MetaSendResponse = await response.json();
      return data;
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw error;
    }
  }

  /**
   * Get media URL from Meta
   */
  async getMediaUrl(mediaId: string): Promise<{ url: string }> {
    const url = `${this.baseUrl}/${mediaId}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get media URL: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get media URL error:', error);
      throw error;
    }
  }
}

/**
 * Get WhatsApp API client for a company
 * Uses company-specific credentials if configured, falls back to env vars
 */
async function getWhatsAppApiForCompany(companyId: string | null): Promise<MetaWhatsAppAPI | MockWhatsAppAPI> {
  // Mock mode always returns mock API
  if (WHATSAPP_MOCK_MODE) {
    return new MockWhatsAppAPI();
  }

  // If no companyId provided, try env vars (fallback for development)
  if (!companyId) {
    if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) {
      return new MetaWhatsAppAPI(WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, 'v18.0');
    }
    throw new AppError('CONFIGURATION_REQUIRED', 'WhatsApp not configured. Please configure WhatsApp Business API credentials.');
  }

  // Get company-specific credentials
  const credentials = await companyWhatsAppConfigService.getDecryptedWhatsAppCredentials(companyId);

  if (!credentials) {
    // Fallback to env vars if company config not found
    if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) {
      console.warn(`Company ${companyId} has no WhatsApp config. Using env var credentials as fallback.`);
      return new MetaWhatsAppAPI(WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, 'v18.0');
    }
    throw new AppError('CONFIGURATION_REQUIRED', 'WhatsApp not configured for this company. Please configure WhatsApp Business API credentials in Settings.');
  }

  return new MetaWhatsAppAPI(credentials.phoneNumberId, credentials.accessToken, credentials.apiVersion);
}

/**
 * Verify webhook signature from Meta
 */
export const verifyWebhookSignature = (payload: string, signature: string): boolean => {
  if (!signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', WHATSAPP_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

/**
 * Verify webhook during Meta setup
 */
export const verifyWebhookToken = (mode: string, token: string, challenge: string): string | null => {
  if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
};

/**
 * Send a template message (automated notification)
 */
export const sendTemplateMessage = async (params: {
  companyId: string;
  to: string;
  template_name: string;
  language_code: string;
  variables?: Record<string, any>;
}): Promise<WhatsAppSendResult> => {
  const { companyId, to, template_name, language_code, variables = {} } = params;

  try {
    // Get WhatsApp API client for this company
    const whatsappApi = await getWhatsAppApiForCompany(companyId);

    // Build template parameters
    const parameters = Object.values(variables).map((value) => ({
      type: 'text',
      text: String(value),
    }));

    const payload: MetaSendTemplateRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template_name,
        language: { code: language_code },
        components: parameters.length > 0
          ? [
              {
                type: 'body',
                parameters,
              },
            ]
          : undefined,
      },
    };

    const response = await whatsappApi.sendMessage(payload);

    return {
      success: true,
      whatsapp_message_id: response.messages[0]?.id,
    };
  } catch (error: any) {
    console.error('Send template message error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp template message',
    };
  }
};

/**
 * Send a text message (conversation reply)
 */
export const sendTextMessage = async (params: {
  companyId: string;
  to: string;
  text: string;
}): Promise<WhatsAppSendResult> => {
  const { companyId, to, text } = params;

  try {
    // Get WhatsApp API client for this company
    const whatsappApi = await getWhatsAppApiForCompany(companyId);

    // WhatsApp text message limit is 4096 characters
    if (text.length > 4096) {
      throw new Error('Message text exceeds 4096 character limit');
    }

    const payload: MetaSendTextRequest = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };

    const response = await whatsappApi.sendMessage(payload);

    return {
      success: true,
      whatsapp_message_id: response.messages[0]?.id,
    };
  } catch (error: any) {
    console.error('Send text message error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp text message',
    };
  }
};

/**
 * Find company by Meta phone_number_id
 */
async function findCompanyByPhoneNumberId(phoneNumberId: string): Promise<{ id: string; name: string } | null> {
  const supabase = getAdminClient();

  try {
    // Check the mapping table first
    const { data: mapping } = await supabase
      .from('whatsapp_phone_company_mapping')
      .select('company_id, companies(id, name)')
      .eq('phone_number_id', phoneNumberId)
      .single();

    if (mapping?.companies) {
      return mapping.companies as { id: string; name: string };
    }

    console.warn('[WhatsApp] No company found for phone_number_id:', phoneNumberId);
    return null;
  } catch (error) {
    console.error('[WhatsApp] Error finding company by phone_number_id:', error);
    return null;
  }
}

/**
 * Format phone number for display (mask middle digits)
 */
function formatPhoneNumber(phone: string): string {
  // E.164 format: +27123456789
  // Display as: +27...6789
  if (phone.length > 8) {
    return `${phone.substring(0, 3)}...${phone.substring(phone.length - 4)}`;
  }
  return phone;
}

/**
 * Find or create guest conversation for WhatsApp messages
 */
async function findOrCreateGuestConversation(
  guestPhone: string,
  companyId: string
): Promise<{ id: string; title: string }> {
  const supabase = getAdminClient();

  try {
    // 1. Try to find existing conversation by guest phone
    const { data: existingConv } = await supabase
      .from('chat_conversations')
      .select('id, title')
      .eq('guest_phone_number', guestPhone)
      .eq('type', 'guest_inquiry')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConv) {
      console.log('[WhatsApp] Found existing conversation:', existingConv.id);
      return existingConv;
    }

    // 2. Check if guest phone matches a booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, guest_name, property_id, properties!inner(company_id, user_id)')
      .eq('guest_phone', guestPhone)
      .eq('properties.company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const propertyId = booking?.property_id || null;
    const propertyOwnerId = (booking?.properties as any)?.user_id || null;
    const guestName = booking?.guest_name || formatPhoneNumber(guestPhone);

    // 3. Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        type: 'guest_inquiry',
        title: `WhatsApp: ${guestName}`,
        property_id: propertyId,
        guest_phone_number: guestPhone,
        language_code: 'en', // Could use auto-detection later
        auto_detected_language: false,
      })
      .select('id, title')
      .single();

    if (convError || !newConv) {
      console.error('[WhatsApp] Failed to create conversation:', convError);
      throw new Error('Failed to create conversation');
    }

    // 4. Add property owner as participant (so they see the conversation)
    if (propertyOwnerId) {
      await supabase.from('chat_participants').insert({
        conversation_id: newConv.id,
        user_id: propertyOwnerId,
        role: 'owner',
      });
    }

    console.log('[WhatsApp] ✅ Created new conversation:', newConv.id);
    return newConv;
  } catch (error) {
    console.error('[WhatsApp] Error finding/creating conversation:', error);
    throw error;
  }
}

/**
 * Handle incoming message webhook
 */
export const handleIncomingMessage = async (message: any): Promise<void> => {
  const supabase = getAdminClient();

  try {
    const { from, id: whatsappMessageId, text, timestamp } = message;
    const messageBody = text?.body || '';

    console.log('[WhatsApp Webhook] Processing incoming message:', {
      from,
      whatsappMessageId,
      messageBody: messageBody.substring(0, 50),
    });

    // 1. Check for idempotency - prevent duplicate processing
    const { data: existing } = await supabase
      .from('whatsapp_message_metadata')
      .select('id')
      .eq('whatsapp_message_id', whatsappMessageId)
      .single();

    if (existing) {
      console.log('[WhatsApp Webhook] Message already processed, skipping');
      return;
    }

    // 2. Find company by phone_number_id (from metadata in webhook)
    const phoneNumberId = (message as any).metadata?.phone_number_id;
    if (!phoneNumberId) {
      console.error('[WhatsApp Webhook] No phone_number_id in message metadata');
      return;
    }

    const company = await findCompanyByPhoneNumberId(phoneNumberId);
    if (!company) {
      console.error('[WhatsApp Webhook] No company found for phone_number_id:', phoneNumberId);
      return;
    }

    // 3. Find or create conversation for this guest
    const conversation = await findOrCreateGuestConversation(from, company.id);

    // 4. Create chat message
    const { data: chatMessage, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: null, // No user ID for guest messages
        content: messageBody,
        message_type: 'text',
        message_channel: 'whatsapp',
      })
      .select()
      .single();

    if (messageError || !chatMessage) {
      console.error('[WhatsApp Webhook] Failed to create chat message:', messageError);
      return;
    }

    // 5. Create WhatsApp metadata record
    const conversationWindowExpiresAt = new Date(parseInt(timestamp) * 1000);
    conversationWindowExpiresAt.setHours(conversationWindowExpiresAt.getHours() + 24);

    const { error: metadataError } = await supabase
      .from('whatsapp_message_metadata')
      .insert({
        chat_message_id: chatMessage.id,
        whatsapp_message_id: whatsappMessageId,
        direction: 'inbound',
        message_type: 'text',
        sender_phone: from,
        status: 'delivered', // Inbound messages are already delivered
        conversation_window_expires_at: conversationWindowExpiresAt,
      });

    if (metadataError) {
      console.error('[WhatsApp Webhook] Failed to create metadata:', metadataError);
    }

    // 6. Update conversation's last inbound timestamp
    await supabase
      .from('chat_conversations')
      .update({
        last_message_at: new Date(parseInt(timestamp) * 1000).toISOString(),
        last_inbound_whatsapp_at: new Date(parseInt(timestamp) * 1000).toISOString(),
      })
      .eq('id', conversation.id);

    console.log('[WhatsApp Webhook] ✅ Successfully processed incoming message:', {
      conversationId: conversation.id,
      chatMessageId: chatMessage.id,
      conversationWindowExpiresAt,
    });
  } catch (error) {
    console.error('[WhatsApp Webhook] Handle incoming message error:', error);
    throw error;
  }
};

/**
 * Handle message status update webhook
 */
export const handleMessageStatusUpdate = async (status: any): Promise<void> => {
  const supabase = getAdminClient();

  try {
    const { id: whatsappMessageId, status: messageStatus, timestamp } = status;

    // Map Meta status to our status
    const mappedStatus: MessageStatus = messageStatus as MessageStatus;

    // Update metadata
    const updateData: any = {
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    };

    // Set timestamp fields based on status
    switch (mappedStatus) {
      case 'sent':
        updateData.sent_at = new Date(parseInt(timestamp) * 1000).toISOString();
        break;
      case 'delivered':
        updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString();
        break;
      case 'read':
        updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString();
        break;
      case 'failed':
        updateData.failed_at = new Date(parseInt(timestamp) * 1000).toISOString();
        updateData.failure_reason = status.errors?.[0]?.message || 'Unknown error';
        break;
    }

    const { error } = await supabase
      .from('whatsapp_message_metadata')
      .update(updateData)
      .eq('whatsapp_message_id', whatsappMessageId);

    if (error) {
      console.error('Failed to update message status:', error);
    } else {
      console.log(`Message ${whatsappMessageId} status updated to ${mappedStatus}`);
    }
  } catch (error) {
    console.error('Handle message status update error:', error);
    throw error;
  }
};

/**
 * Process webhook payload
 */
export const processWebhook = async (webhookData: MetaWebhookMessage): Promise<void> => {
  try {
    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        const { messages, statuses } = change.value;

        // Handle incoming messages
        if (messages && messages.length > 0) {
          for (const message of messages) {
            await handleIncomingMessage(message);
          }
        }

        // Handle status updates
        if (statuses && statuses.length > 0) {
          for (const status of statuses) {
            await handleMessageStatusUpdate(status);
          }
        }
      }
    }
  } catch (error) {
    console.error('Process webhook error:', error);
    throw error;
  }
};

/**
 * Get message delivery status
 */
export const getMessageStatus = async (chatMessageId: string): Promise<{
  status: MessageStatus;
  sent_at: Date | null;
  delivered_at: Date | null;
  read_at: Date | null;
  failed_at: Date | null;
  failure_reason: string | null;
} | null> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('whatsapp_message_metadata')
      .select('status, sent_at, delivered_at, read_at, failed_at, failure_reason')
      .eq('chat_message_id', chatMessageId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as any;
  } catch (error) {
    console.error('Get message status error:', error);
    return null;
  }
};

/**
 * Format phone number to E.164 format
 */
export const formatPhoneToE164 = (phone: string, defaultCountryCode: string = '27'): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.substring(1);
  }

  // If doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
};

/**
 * Validate E.164 phone number format
 */
export const isValidE164Phone = (phone: string): boolean => {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

/**
 * Check if phone number is opted out
 */
export const isPhoneOptedOut = async (phone: string): Promise<boolean> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('whatsapp_opt_outs')
      .select('id, opted_in_at, opted_out_at')
      .eq('phone_number', phone)
      .single();

    if (error || !data) {
      return false; // Not opted out if no record found
    }

    // Opted out if: opted_in_at is null OR opted_out_at is more recent than opted_in_at
    if (!data.opted_in_at) {
      return true;
    }

    if (data.opted_out_at && new Date(data.opted_out_at) > new Date(data.opted_in_at)) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Check opt-out status error:', error);
    return true; // Fail safe - assume opted out on error
  }
};

/**
 * Add phone number to opt-out list
 */
export const addOptOut = async (params: {
  phone_number: string;
  guest_id?: string;
  opt_out_reason?: string;
  opt_out_source?: 'user_request' | 'whatsapp_stop' | 'admin' | 'bounce';
}): Promise<void> => {
  const supabase = getAdminClient();

  try {
    const { phone_number, guest_id, opt_out_reason, opt_out_source = 'user_request' } = params;

    // Upsert opt-out record
    const { error } = await supabase.from('whatsapp_opt_outs').upsert(
      {
        phone_number,
        guest_id: guest_id || null,
        opted_out_at: new Date().toISOString(),
        opt_out_reason: opt_out_reason || null,
        opt_out_source,
        opted_in_at: null, // Clear opt-in when opting out
      },
      { onConflict: 'phone_number' }
    );

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to add opt-out');
    }

    console.log(`Phone ${phone_number} opted out (source: ${opt_out_source})`);
  } catch (error) {
    console.error('Add opt-out error:', error);
    throw error;
  }
};

/**
 * Remove phone number from opt-out list (re-opt-in)
 */
export const removeOptOut = async (phone_number: string): Promise<void> => {
  const supabase = getAdminClient();

  try {
    const { error } = await supabase
      .from('whatsapp_opt_outs')
      .update({
        opted_in_at: new Date().toISOString(),
      })
      .eq('phone_number', phone_number);

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to remove opt-out');
    }

    console.log(`Phone ${phone_number} re-opted in`);
  } catch (error) {
    console.error('Remove opt-out error:', error);
    throw error;
  }
};

/**
 * Get WhatsApp API configuration status
 */
export const getConfigStatus = (): {
  configured: boolean;
  mock_mode: boolean;
  phone_number_id: string;
} => {
  return {
    configured: !!(WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN),
    mock_mode: WHATSAPP_MOCK_MODE,
    phone_number_id: WHATSAPP_PHONE_NUMBER_ID ? '***' + WHATSAPP_PHONE_NUMBER_ID.slice(-4) : '',
  };
};
