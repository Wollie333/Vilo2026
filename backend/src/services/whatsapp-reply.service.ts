/**
 * WhatsApp Reply Service
 * Handles smart replies from chat UI with 24-hour conversation window logic
 *
 * Meta's 24-Hour Rule:
 * - Within 24h of guest's last message: Can send free-form text
 * - Outside 24h window: Must use pre-approved templates
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { getDecryptedWhatsAppCredentials } from './company-whatsapp-config.service';

const WHATSAPP_API_BASE = process.env.WHATSAPP_API_BASE || 'https://graph.facebook.com';

interface ReplyOptions {
  conversationId: string;
  senderId: string; // User sending the reply
  content: string;
  recipientPhone: string;
}

interface SendMessageResult {
  messageId: string;
}

/**
 * Send a reply to a WhatsApp conversation
 * Uses free-form text within 24h window, requires templates outside window
 */
export async function sendWhatsAppReply(options: ReplyOptions): Promise<void> {
  const { conversationId, senderId, content, recipientPhone } = options;
  const supabase = getAdminClient();

  console.log('[WhatsApp Reply] Starting reply process:', {
    conversationId,
    senderId,
    recipientPhone,
  });

  // 1. Check if within 24-hour conversation window
  const { data: conversation } = await supabase
    .from('chat_conversations')
    .select('last_inbound_whatsapp_at, property_id, properties(company_id)')
    .eq('id', conversationId)
    .single();

  if (!conversation) {
    throw new AppError('NOT_FOUND', 'Conversation not found');
  }

  const companyId = (conversation.properties as any)?.company_id;
  if (!companyId) {
    throw new AppError('VALIDATION_ERROR', 'No company associated with conversation');
  }

  const lastInbound = conversation.last_inbound_whatsapp_at
    ? new Date(conversation.last_inbound_whatsapp_at)
    : null;

  const now = new Date();
  const windowExpired = !lastInbound || (now.getTime() - lastInbound.getTime()) > 24 * 60 * 60 * 1000;

  console.log('[WhatsApp Reply] Conversation window status:', {
    lastInbound,
    windowExpired,
    hoursSinceLastMessage: lastInbound
      ? ((now.getTime() - lastInbound.getTime()) / (1000 * 60 * 60)).toFixed(2)
      : 'N/A',
  });

  // 2. Check if window expired
  if (windowExpired) {
    throw new AppError(
      'TEMPLATE_REQUIRED',
      'Outside 24-hour conversation window. Please select a template.'
    );
  }

  // 3. Send free-form text message (within 24h window)
  const result = await sendFreeFormWhatsAppMessage(companyId, recipientPhone, content);

  // 4. Create chat message record
  const { data: chatMessage, error: messageError } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: 'text',
      message_channel: 'whatsapp',
    })
    .select()
    .single();

  if (messageError || !chatMessage) {
    console.error('[WhatsApp Reply] Failed to create chat message:', messageError);
    throw new AppError('INTERNAL_ERROR', 'Failed to save message to database');
  }

  // 5. Create WhatsApp metadata record
  const { error: metadataError } = await supabase
    .from('whatsapp_message_metadata')
    .insert({
      chat_message_id: chatMessage.id,
      whatsapp_message_id: result.messageId,
      direction: 'outbound',
      message_type: 'text',
      recipient_phone: recipientPhone,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

  if (metadataError) {
    console.error('[WhatsApp Reply] Failed to create metadata:', metadataError);
  }

  // 6. Update conversation last_message_at
  await supabase
    .from('chat_conversations')
    .update({
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  console.log('[WhatsApp Reply] ✅ Successfully sent free-form reply:', {
    chatMessageId: chatMessage.id,
    whatsappMessageId: result.messageId,
  });
}

/**
 * Send free-form text message (within 24h window)
 */
async function sendFreeFormWhatsAppMessage(
  companyId: string,
  recipientPhone: string,
  text: string
): Promise<SendMessageResult> {
  // Get company credentials
  const credentials = await getDecryptedWhatsAppCredentials(companyId);

  if (!credentials) {
    throw new AppError('CONFIGURATION_REQUIRED', 'WhatsApp not configured for this company');
  }

  // Validate message length (WhatsApp limit: 4096 characters)
  if (text.length > 4096) {
    throw new AppError('VALIDATION_ERROR', 'Message exceeds 4096 character limit');
  }

  try {
    // Call Meta API: POST /v18.0/{phone_number_id}/messages
    const url = `${WHATSAPP_API_BASE}/${credentials.apiVersion}/${credentials.phoneNumberId}/messages`;

    console.log('[WhatsApp Reply] Sending to Meta API:', {
      url,
      to: recipientPhone,
      textLength: text.length,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.error?.message || `Meta API error: ${response.status}`;
      console.error('[WhatsApp Reply] Meta API error:', error);
      throw new AppError('EXTERNAL_API_ERROR', `WhatsApp API error: ${errorMessage}`);
    }

    const data = await response.json();
    return { messageId: data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp Reply] Failed to send message:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('EXTERNAL_API_ERROR', 'Failed to send WhatsApp message');
  }
}

/**
 * Check if conversation window is active (within 24 hours of last inbound message)
 */
export async function isConversationWindowActive(conversationId: string): Promise<boolean> {
  const supabase = getAdminClient();

  try {
    const { data } = await supabase
      .from('chat_conversations')
      .select('last_inbound_whatsapp_at')
      .eq('id', conversationId)
      .single();

    if (!data?.last_inbound_whatsapp_at) {
      return false; // No inbound WhatsApp messages yet
    }

    const lastInbound = new Date(data.last_inbound_whatsapp_at);
    const now = new Date();
    const hoursSince = (now.getTime() - lastInbound.getTime()) / (1000 * 60 * 60);

    return hoursSince < 24;
  } catch (error) {
    console.error('[WhatsApp Reply] Error checking window status:', error);
    return false;
  }
}

/**
 * Get conversation window status details
 */
export async function getConversationWindowStatus(conversationId: string): Promise<{
  windowActive: boolean;
  lastInboundAt: string | null;
  hoursRemaining: number | null;
  expiresAt: string | null;
}> {
  const supabase = getAdminClient();

  try {
    const { data } = await supabase
      .from('chat_conversations')
      .select('last_inbound_whatsapp_at')
      .eq('id', conversationId)
      .single();

    if (!data?.last_inbound_whatsapp_at) {
      return {
        windowActive: false,
        lastInboundAt: null,
        hoursRemaining: null,
        expiresAt: null,
      };
    }

    const lastInbound = new Date(data.last_inbound_whatsapp_at);
    const now = new Date();
    const hoursSince = (now.getTime() - lastInbound.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursSince);
    const expiresAt = new Date(lastInbound.getTime() + 24 * 60 * 60 * 1000);

    return {
      windowActive: hoursSince < 24,
      lastInboundAt: lastInbound.toISOString(),
      hoursRemaining: parseFloat(hoursRemaining.toFixed(2)),
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('[WhatsApp Reply] Error getting window status:', error);
    return {
      windowActive: false,
      lastInboundAt: null,
      hoursRemaining: null,
      expiresAt: null,
    };
  }
}
