/**
 * WhatsApp Automation Service
 * Handles automated message triggers based on booking events
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import * as whatsappService from './whatsapp.service';
import * as whatsappTemplateService from './whatsapp-template.service';
import * as whatsappQueueService from './whatsapp-queue.service';
import type { TemplateType, TemplateData, TriggerType } from '../types/whatsapp.types';

// Environment configuration
const WHATSAPP_AUTOMATION_ENABLED = process.env.WHATSAPP_AUTOMATION_ENABLED !== 'false';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://vilo.com';

/**
 * Format currency amount
 */
const formatCurrency = (amount: number, currency: string = 'ZAR'): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Build template data from booking
 */
const buildTemplateData = async (bookingId: string): Promise<TemplateData> => {
  const supabase = getAdminClient();

  try {
    // Get booking with related data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(
          id,
          name,
          address,
          phone,
          email,
          check_in_time,
          check_out_time
        ),
        rooms:booking_rooms(
          room:rooms(name)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new AppError('NOT_FOUND', 'Booking not found');
    }

    // Calculate total nights
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Get room names
    const roomNames = booking.rooms?.map((br: any) => br.room?.name).filter(Boolean).join(', ') || 'N/A';

    // Calculate payment amounts
    const totalAmount = booking.total_amount || 0;
    const amountPaid = booking.amount_paid || 0;
    const balanceDue = totalAmount - amountPaid;

    // Build template data
    const templateData: TemplateData = {
      // Booking placeholders
      booking_reference: booking.booking_reference,
      check_in_date: formatDate(booking.check_in_date),
      check_out_date: formatDate(booking.check_out_date),
      guest_name: booking.guest_name || 'Guest',
      num_guests: booking.num_guests,
      room_names: roomNames,
      total_nights: totalNights,

      // Property placeholders
      property_name: booking.property?.name || 'Property',
      property_address: booking.property?.address || '',
      property_phone: booking.property?.phone || '',
      property_email: booking.property?.email || '',
      check_in_time: booking.property?.check_in_time || '14:00',
      check_out_time: booking.property?.check_out_time || '10:00',

      // Payment placeholders
      total_amount: formatCurrency(totalAmount, booking.currency),
      amount_paid: formatCurrency(amountPaid, booking.currency),
      balance_due: formatCurrency(balanceDue, booking.currency),
      currency: booking.currency || 'ZAR',
      payment_method: booking.payment_method || 'N/A',
      payment_link: `${FRONTEND_URL}/pay/${booking.id}`,

      // Link placeholders
      booking_url: `${FRONTEND_URL}/bookings/${booking.id}`,
      payment_url: `${FRONTEND_URL}/pay/${booking.id}`,
      invoice_url: `${FRONTEND_URL}/invoices/${booking.id}`,
      review_url: `${FRONTEND_URL}/review/${booking.id}`,
      cancellation_url: `${FRONTEND_URL}/cancel/${booking.id}`,
    };

    return templateData;
  } catch (error) {
    console.error('Build template data error:', error);
    throw error;
  }
};

/**
 * Send automated WhatsApp message
 */
const sendAutomatedMessage = async (params: {
  booking_id: string;
  template_type: TemplateType;
  trigger_type: TriggerType;
  priority?: number;
}): Promise<{ success: boolean; error?: string }> => {
  if (!WHATSAPP_AUTOMATION_ENABLED) {
    console.log('WhatsApp automation is disabled');
    return { success: false, error: 'Automation disabled' };
  }

  const supabase = getAdminClient();

  try {
    const { booking_id, template_type, trigger_type, priority = 5 } = params;

    // Get booking with property info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, property:properties(id, company_id)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new AppError('NOT_FOUND', 'Booking not found');
    }

    // Check if WhatsApp notifications are enabled for this booking
    if (booking.whatsapp_notifications_enabled === false) {
      console.log(`WhatsApp notifications disabled for booking ${booking_id}`);
      return { success: false, error: 'Notifications disabled for booking' };
    }

    // Validate and format phone number
    const phone = booking.guest_phone;
    if (!phone) {
      console.log(`No phone number for booking ${booking_id}`);
      return { success: false, error: 'No phone number' };
    }

    const formattedPhone = whatsappService.formatPhoneToE164(phone);
    if (!whatsappService.isValidE164Phone(formattedPhone)) {
      console.log(`Invalid phone number for booking ${booking_id}: ${phone}`);
      return { success: false, error: 'Invalid phone number' };
    }

    // Check opt-out status
    const isOptedOut = await whatsappService.isPhoneOptedOut(formattedPhone);
    if (isOptedOut) {
      console.log(`Phone ${formattedPhone} is opted out`);
      return { success: false, error: 'Phone opted out' };
    }

    // Detect guest language
    const languageCode = whatsappTemplateService.detectLanguageFromPhone(formattedPhone);

    // Get template with fallback
    const template = await whatsappTemplateService.getTemplate({
      property_id: booking.property?.id,
      template_type,
      language_code,
    });

    if (!template) {
      console.log(
        `No approved template found for ${template_type} (property: ${booking.property?.id}, language: ${languageCode})`
      );
      return { success: false, error: 'No approved template' };
    }

    // Build template data
    const templateData = await buildTemplateData(booking_id);

    // Render template
    const renderedTemplate = whatsappTemplateService.renderTemplate(template, templateData);

    // Create chat message for tracking
    // First, find or create conversation for this booking
    let conversationId: string | null = null;

    // Try to find existing guest inquiry conversation for this property
    const { data: existingConversation } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('conversation_type', 'guest_inquiry')
      .eq('metadata->booking_id', booking_id)
      .single();

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const { data: newConversation } = await supabase
        .from('chat_conversations')
        .insert({
          conversation_type: 'guest_inquiry',
          language_code: languageCode,
          auto_detected_language: true,
          metadata: {
            booking_id: booking_id,
            property_id: booking.property?.id,
          },
        })
        .select()
        .single();

      conversationId = newConversation?.id || null;
    }

    if (!conversationId) {
      throw new Error('Failed to create/find conversation');
    }

    // Create chat message
    const { data: chatMessage, error: chatError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: null, // System message
        content: renderedTemplate.body,
        message_type: 'text',
        message_channel: 'whatsapp',
      })
      .select()
      .single();

    if (chatError || !chatMessage) {
      throw new Error('Failed to create chat message');
    }

    // Create WhatsApp metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('whatsapp_message_metadata')
      .insert({
        chat_message_id: chatMessage.id,
        template_id: template.id,
        template_variables: templateData,
        recipient_phone: formattedPhone,
        direction: 'outbound',
        message_type: 'template',
        status: 'queued',
      })
      .select()
      .single();

    if (metadataError || !metadata) {
      throw new Error('Failed to create WhatsApp metadata');
    }

    // Enqueue message for sending
    await whatsappQueueService.enqueueMessage({
      chat_message_id: chatMessage.id,
      whatsapp_metadata_id: metadata.id,
      booking_id: booking_id,
      trigger_type,
      priority,
      should_fallback_to_email: true,
    });

    console.log(
      `WhatsApp message queued for booking ${booking_id} (template: ${template_type}, phone: ${formattedPhone})`
    );

    return { success: true };
  } catch (error: any) {
    console.error('Send automated message error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send automated message',
    };
  }
};

/**
 * Send booking confirmation message
 */
export const sendBookingConfirmation = async (bookingId: string): Promise<void> => {
  try {
    console.log(`Triggering booking confirmation for ${bookingId}`);

    await sendAutomatedMessage({
      booking_id: bookingId,
      template_type: 'booking_confirmation',
      trigger_type: 'booking_created',
      priority: 3, // High priority
    });
  } catch (error) {
    console.error('Send booking confirmation error:', error);
    // Don't throw - this is a background task
  }
};

/**
 * Send payment received notification
 */
export const sendPaymentReceivedNotification = async (bookingId: string): Promise<void> => {
  try {
    console.log(`Triggering payment received notification for ${bookingId}`);

    await sendAutomatedMessage({
      booking_id: bookingId,
      template_type: 'payment_received',
      trigger_type: 'payment_received',
      priority: 4, // Normal-high priority
    });
  } catch (error) {
    console.error('Send payment received notification error:', error);
    // Don't throw - this is a background task
  }
};

/**
 * Send payment reminder (for scheduled execution)
 */
export const sendPaymentReminder = async (bookingId: string): Promise<void> => {
  try {
    console.log(`Triggering payment reminder for ${bookingId}`);

    await sendAutomatedMessage({
      booking_id: bookingId,
      template_type: 'payment_reminder',
      trigger_type: 'payment_reminder',
      priority: 5, // Normal priority
    });
  } catch (error) {
    console.error('Send payment reminder error:', error);
    // Don't throw - this is a background task
  }
};

/**
 * Send pre-arrival message (for scheduled execution)
 */
export const sendPreArrivalMessage = async (bookingId: string): Promise<void> => {
  try {
    console.log(`Triggering pre-arrival message for ${bookingId}`);

    await sendAutomatedMessage({
      booking_id: bookingId,
      template_type: 'pre_arrival',
      trigger_type: 'pre_arrival',
      priority: 3, // High priority
    });
  } catch (error) {
    console.error('Send pre-arrival message error:', error);
    // Don't throw - this is a background task
  }
};

/**
 * Send booking modification notification
 */
export const sendBookingModifiedNotification = async (bookingId: string): Promise<void> => {
  try {
    console.log(`Triggering booking modified notification for ${bookingId}`);

    await sendAutomatedMessage({
      booking_id: bookingId,
      template_type: 'booking_modified',
      trigger_type: 'booking_modified',
      priority: 3, // High priority
    });
  } catch (error) {
    console.error('Send booking modified notification error:', error);
    // Don't throw - this is a background task
  }
};

/**
 * Send booking cancellation notification
 */
export const sendBookingCancelledNotification = async (bookingId: string): Promise<void> => {
  try {
    console.log(`Triggering booking cancelled notification for ${bookingId}`);

    await sendAutomatedMessage({
      booking_id: bookingId,
      template_type: 'booking_cancelled',
      trigger_type: 'booking_cancelled',
      priority: 2, // Urgent priority
    });
  } catch (error) {
    console.error('Send booking cancelled notification error:', error);
    // Don't throw - this is a background task
  }
};

/**
 * Process scheduled messages (called by cron job)
 * Finds bookings that need payment reminders or pre-arrival messages
 */
export const processScheduledMessages = async (): Promise<{
  payment_reminders_sent: number;
  pre_arrival_sent: number;
}> => {
  if (!WHATSAPP_AUTOMATION_ENABLED) {
    console.log('WhatsApp automation is disabled');
    return { payment_reminders_sent: 0, pre_arrival_sent: 0 };
  }

  const supabase = getAdminClient();
  const result = {
    payment_reminders_sent: 0,
    pre_arrival_sent: 0,
  };

  try {
    const now = new Date();

    // Find bookings needing payment reminders
    // (Check-in is within template timing window AND has outstanding balance)
    const { data: paymentReminderBookings } = await supabase
      .from('bookings')
      .select('id, check_in_date, total_amount, amount_paid')
      .eq('booking_status', 'confirmed')
      .eq('whatsapp_notifications_enabled', true)
      .gte('check_in_date', now.toISOString())
      .gt('total_amount', supabase.rpc('coalesce', ['amount_paid', 0]))
      .limit(50);

    if (paymentReminderBookings) {
      for (const booking of paymentReminderBookings) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from('whatsapp_message_queue')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('trigger_type', 'payment_reminder')
          .in('status', ['pending', 'processing', 'completed'])
          .single();

        if (!existingReminder) {
          await sendPaymentReminder(booking.id);
          result.payment_reminders_sent++;
        }
      }
    }

    // Find bookings needing pre-arrival messages
    // (Check-in is 1-3 days away)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const { data: preArrivalBookings } = await supabase
      .from('bookings')
      .select('id, check_in_date')
      .eq('booking_status', 'confirmed')
      .eq('whatsapp_notifications_enabled', true)
      .gte('check_in_date', oneDayFromNow.toISOString())
      .lte('check_in_date', threeDaysFromNow.toISOString())
      .limit(50);

    if (preArrivalBookings) {
      for (const booking of preArrivalBookings) {
        // Check if pre-arrival already sent
        const { data: existingPreArrival } = await supabase
          .from('whatsapp_message_queue')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('trigger_type', 'pre_arrival')
          .in('status', ['pending', 'processing', 'completed'])
          .single();

        if (!existingPreArrival) {
          await sendPreArrivalMessage(booking.id);
          result.pre_arrival_sent++;
        }
      }
    }

    console.log(
      `Scheduled messages processed: ${result.payment_reminders_sent} payment reminders, ${result.pre_arrival_sent} pre-arrival messages`
    );

    return result;
  } catch (error) {
    console.error('Process scheduled messages error:', error);
    return result;
  }
};

/**
 * Check if automation is enabled
 */
export const isAutomationEnabled = (): boolean => {
  return WHATSAPP_AUTOMATION_ENABLED;
};
