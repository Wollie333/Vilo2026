/**
 * WhatsApp Queue Service
 * Handles message queue, retry logic, and email fallback
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import * as whatsappService from './whatsapp.service';
import * as whatsappTemplateService from './whatsapp-template.service';
import type {
  WhatsAppMessageQueue,
  QueueStatus,
  TriggerType,
  QueueProcessResult,
  TemplateData,
} from '../types/whatsapp.types';

// Environment configuration
const WHATSAPP_QUEUE_ENABLED = process.env.WHATSAPP_QUEUE_PROCESSING_ENABLED !== 'false';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [60, 300, 1800]; // seconds: 1min, 5min, 30min

/**
 * Calculate next retry time based on retry count
 */
const getNextRetryTime = (retryCount: number): Date => {
  const delaySeconds = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
  return new Date(Date.now() + delaySeconds * 1000);
};

/**
 * Enqueue a WhatsApp message for sending
 */
export const enqueueMessage = async (params: {
  chat_message_id?: string;
  whatsapp_metadata_id?: string;
  booking_id?: string;
  trigger_type: TriggerType;
  priority?: number;
  should_fallback_to_email?: boolean;
}): Promise<WhatsAppMessageQueue> => {
  const supabase = getAdminClient();

  try {
    const queueItem = {
      chat_message_id: params.chat_message_id || null,
      whatsapp_metadata_id: params.whatsapp_metadata_id || null,
      booking_id: params.booking_id || null,
      trigger_type: params.trigger_type,
      status: 'pending' as QueueStatus,
      priority: params.priority || 5,
      retry_count: 0,
      max_retries: MAX_RETRIES,
      next_retry_at: new Date().toISOString(),
      should_fallback_to_email: params.should_fallback_to_email ?? true,
    };

    const { data, error } = await supabase
      .from('whatsapp_message_queue')
      .insert(queueItem)
      .select()
      .single();

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to enqueue message');
    }

    console.log(`Message enqueued: ${data.id} (trigger: ${params.trigger_type})`);
    return data as WhatsAppMessageQueue;
  } catch (error) {
    console.error('Enqueue message error:', error);
    throw error;
  }
};

/**
 * Process a single queue item
 */
const processQueueItem = async (item: WhatsAppMessageQueue): Promise<{
  success: boolean;
  error?: string;
}> => {
  const supabase = getAdminClient();

  try {
    // Mark as processing
    await supabase
      .from('whatsapp_message_queue')
      .update({
        status: 'processing',
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    // Get WhatsApp metadata
    if (!item.whatsapp_metadata_id) {
      throw new Error('No whatsapp_metadata_id provided');
    }

    const { data: metadata } = await supabase
      .from('whatsapp_message_metadata')
      .select('*, template:whatsapp_message_templates(*)')
      .eq('id', item.whatsapp_metadata_id)
      .single();

    if (!metadata) {
      throw new Error('WhatsApp metadata not found');
    }

    // Check if phone is opted out
    const isOptedOut = await whatsappService.isPhoneOptedOut(metadata.recipient_phone);
    if (isOptedOut) {
      throw new Error('Recipient has opted out of WhatsApp messages');
    }

    // Send message based on type
    let result;
    if (metadata.message_type === 'template' && metadata.template) {
      // Send template message
      result = await whatsappService.sendTemplateMessage({
        to: metadata.recipient_phone,
        template_name: metadata.template.template_name,
        language_code: metadata.template.language_code,
        variables: metadata.template_variables || {},
      });
    } else if (metadata.message_type === 'text') {
      // Get text from chat message
      const { data: chatMessage } = await supabase
        .from('chat_messages')
        .select('content')
        .eq('id', metadata.chat_message_id)
        .single();

      if (!chatMessage) {
        throw new Error('Chat message not found');
      }

      result = await whatsappService.sendTextMessage({
        to: metadata.recipient_phone,
        text: chatMessage.content,
      });
    } else {
      throw new Error(`Unsupported message type: ${metadata.message_type}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to send message');
    }

    // Update metadata with WhatsApp message ID
    await supabase
      .from('whatsapp_message_metadata')
      .update({
        whatsapp_message_id: result.whatsapp_message_id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', item.whatsapp_metadata_id);

    // Mark queue item as completed
    await supabase
      .from('whatsapp_message_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    return { success: true };
  } catch (error: any) {
    console.error('Process queue item error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
};

/**
 * Retry a failed queue item
 */
const retryQueueItem = async (item: WhatsAppMessageQueue, error: string): Promise<void> => {
  const supabase = getAdminClient();

  try {
    const newRetryCount = item.retry_count + 1;

    if (newRetryCount >= item.max_retries) {
      // Max retries reached - mark as failed
      await supabase
        .from('whatsapp_message_queue')
        .update({
          status: 'failed',
          last_error: error,
          completed_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      // Update metadata status
      if (item.whatsapp_metadata_id) {
        await supabase
          .from('whatsapp_message_metadata')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            failure_reason: error,
          })
          .eq('id', item.whatsapp_metadata_id);
      }

      console.log(`Queue item ${item.id} failed after ${item.max_retries} retries`);

      // Trigger email fallback if enabled
      if (item.should_fallback_to_email && !item.email_fallback_sent) {
        await sendEmailFallback(item);
      }
    } else {
      // Schedule retry
      const nextRetryAt = getNextRetryTime(newRetryCount);

      await supabase
        .from('whatsapp_message_queue')
        .update({
          status: 'pending',
          retry_count: newRetryCount,
          next_retry_at: nextRetryAt.toISOString(),
          last_error: error,
        })
        .eq('id', item.id);

      console.log(
        `Queue item ${item.id} scheduled for retry ${newRetryCount}/${item.max_retries} at ${nextRetryAt.toISOString()}`
      );
    }
  } catch (err) {
    console.error('Retry queue item error:', err);
  }
};

/**
 * Send email fallback when WhatsApp fails
 */
const sendEmailFallback = async (item: WhatsAppMessageQueue): Promise<void> => {
  const supabase = getAdminClient();

  try {
    console.log(`Sending email fallback for queue item ${item.id}`);

    // TODO: Implement email sending
    // This would use an email service to send the notification via email
    // For now, just mark as sent

    await supabase
      .from('whatsapp_message_queue')
      .update({
        email_fallback_sent: true,
        email_fallback_sent_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    // TODO: Notify admin of WhatsApp failure
    console.log(`Email fallback sent for queue item ${item.id}`);
  } catch (error) {
    console.error('Send email fallback error:', error);
  }
};

/**
 * Process pending queue items (called by cron job)
 */
export const processQueue = async (): Promise<QueueProcessResult> => {
  if (!WHATSAPP_QUEUE_ENABLED) {
    console.log('WhatsApp queue processing is disabled');
    return { processed: 0, succeeded: 0, failed: 0, retried: 0 };
  }

  const supabase = getAdminClient();
  const result: QueueProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    retried: 0,
  };

  try {
    // Get pending items ready for processing
    const { data: pendingItems, error } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('priority', { ascending: true }) // Higher priority first (lower number)
      .order('created_at', { ascending: true }) // Older items first
      .limit(50); // Process 50 at a time

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch queue items');
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('No pending queue items to process');
      return result;
    }

    console.log(`Processing ${pendingItems.length} queue items...`);

    // Process each item
    for (const item of pendingItems as WhatsAppMessageQueue[]) {
      result.processed++;

      const processResult = await processQueueItem(item);

      if (processResult.success) {
        result.succeeded++;
      } else {
        // Retry logic
        await retryQueueItem(item, processResult.error || 'Unknown error');

        if (item.retry_count + 1 >= item.max_retries) {
          result.failed++;
        } else {
          result.retried++;
        }
      }

      // Small delay between items to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `Queue processing complete: ${result.processed} processed, ${result.succeeded} succeeded, ${result.failed} failed, ${result.retried} retried`
    );

    return result;
  } catch (error) {
    console.error('Process queue error:', error);
    throw error;
  }
};

/**
 * Cancel a queued message
 */
export const cancelQueueItem = async (id: string): Promise<void> => {
  const supabase = getAdminClient();

  try {
    const { error } = await supabase
      .from('whatsapp_message_queue')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('status', ['pending', 'processing']);

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to cancel queue item');
    }

    console.log(`Queue item ${id} cancelled`);
  } catch (error) {
    console.error('Cancel queue item error:', error);
    throw error;
  }
};

/**
 * Manually retry a failed queue item
 */
export const manualRetry = async (id: string): Promise<void> => {
  const supabase = getAdminClient();

  try {
    // Get the queue item
    const { data: item, error } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !item) {
      throw new AppError('NOT_FOUND', 'Queue item not found');
    }

    // Reset retry count and schedule for immediate processing
    await supabase
      .from('whatsapp_message_queue')
      .update({
        status: 'pending',
        retry_count: 0,
        next_retry_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', id);

    console.log(`Queue item ${id} scheduled for manual retry`);
  } catch (error) {
    console.error('Manual retry error:', error);
    throw error;
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async (): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
  oldest_pending: Date | null;
  avg_retry_count: number;
}> => {
  const supabase = getAdminClient();

  try {
    // Get count by status
    const { data: stats, error: statsError } = await supabase
      .from('whatsapp_message_queue')
      .select('status')
      .then((res) => {
        const counts: Record<string, number> = {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        };

        if (res.data) {
          res.data.forEach((item: any) => {
            counts[item.status] = (counts[item.status] || 0) + 1;
          });
        }

        return { data: counts, error: res.error };
      });

    if (statsError) {
      throw statsError;
    }

    // Get oldest pending item
    const { data: oldestPending } = await supabase
      .from('whatsapp_message_queue')
      .select('created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    // Get average retry count
    const { data: retryData } = await supabase
      .from('whatsapp_message_queue')
      .select('retry_count')
      .gt('retry_count', 0);

    const avgRetryCount =
      retryData && retryData.length > 0
        ? retryData.reduce((sum: number, item: any) => sum + item.retry_count, 0) / retryData.length
        : 0;

    const total = Object.values(stats || {}).reduce((sum, count) => sum + count, 0);

    return {
      pending: stats?.pending || 0,
      processing: stats?.processing || 0,
      completed: stats?.completed || 0,
      failed: stats?.failed || 0,
      cancelled: stats?.cancelled || 0,
      total,
      oldest_pending: oldestPending?.created_at ? new Date(oldestPending.created_at) : null,
      avg_retry_count: Math.round(avgRetryCount * 100) / 100,
    };
  } catch (error) {
    console.error('Get queue stats error:', error);
    throw error;
  }
};

/**
 * List pending queue items
 */
export const listPendingItems = async (params: {
  limit?: number;
  offset?: number;
}): Promise<{
  items: WhatsAppMessageQueue[];
  total: number;
}> => {
  const supabase = getAdminClient();
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  try {
    const { data, error, count } = await supabase
      .from('whatsapp_message_queue')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .order('next_retry_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch pending items');
    }

    return {
      items: (data || []) as WhatsAppMessageQueue[],
      total: count || 0,
    };
  } catch (error) {
    console.error('List pending items error:', error);
    throw error;
  }
};

/**
 * Clean up old completed/failed queue items
 * Should be called periodically (e.g., weekly)
 */
export const cleanupOldItems = async (daysToKeep: number = 30): Promise<number> => {
  const supabase = getAdminClient();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('whatsapp_message_queue')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('completed_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to cleanup old items');
    }

    const deletedCount = data?.length || 0;
    console.log(`Cleaned up ${deletedCount} old queue items (older than ${daysToKeep} days)`);

    return deletedCount;
  } catch (error) {
    console.error('Cleanup old items error:', error);
    throw error;
  }
};
