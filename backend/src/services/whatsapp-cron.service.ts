/**
 * WhatsApp Cron Service
 * Automated jobs for queue processing and scheduled messages
 */

import * as whatsappQueueService from './whatsapp-queue.service';
import * as whatsappAutomation from './whatsapp-automation.service';

// ============================================================================
// QUEUE PROCESSING
// ============================================================================

/**
 * Process pending WhatsApp messages in the queue
 * Handles retry logic and email fallbacks
 *
 * Runs: Every 5 minutes
 */
export const processWhatsAppQueue = async (): Promise<void> => {
  console.log('[WhatsApp Cron] Starting queue processing...');

  try {
    const result = await whatsappQueueService.processQueue();

    console.log('[WhatsApp Cron] Queue processing completed:', {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      fallbacks: result.fallbacks_triggered,
    });

    // Alert if high failure rate
    if (result.processed > 0 && result.failed > result.succeeded * 0.5) {
      console.error('[WhatsApp Cron] ⚠️ HIGH FAILURE RATE DETECTED', {
        failure_rate: `${Math.round((result.failed / result.processed) * 100)}%`,
        total_processed: result.processed,
        failed: result.failed,
      });
      // TODO: Send admin notification for high failure rate
    }

    // Alert if queue is growing
    const stats = await whatsappQueueService.getQueueStats();
    if (stats.pending_count > 100) {
      console.warn('[WhatsApp Cron] ⚠️ QUEUE BACKLOG WARNING', {
        pending_count: stats.pending_count,
      });
      // TODO: Send admin notification for queue backlog
    }

  } catch (error) {
    console.error('[WhatsApp Cron] Queue processing error:', error);
    throw error;
  }
};

// ============================================================================
// SCHEDULED MESSAGES
// ============================================================================

/**
 * Process scheduled WhatsApp messages
 * - Payment reminders (X days before check-in with balance due)
 * - Pre-arrival messages (1-3 days before check-in)
 *
 * Runs: Every 6 hours
 */
export const processScheduledMessages = async (): Promise<void> => {
  console.log('[WhatsApp Cron] Starting scheduled message processing...');

  try {
    const result = await whatsappAutomation.processScheduledMessages();

    console.log('[WhatsApp Cron] Scheduled messages processed:', {
      payment_reminders_sent: result.payment_reminders_sent,
      pre_arrival_sent: result.pre_arrival_sent,
      total_sent: result.payment_reminders_sent + result.pre_arrival_sent,
    });

  } catch (error) {
    console.error('[WhatsApp Cron] Scheduled message processing error:', error);
    throw error;
  }
};

// ============================================================================
// CLEANUP JOBS
// ============================================================================

/**
 * Clean up old completed queue items
 * Removes items older than 30 days to prevent table bloat
 *
 * Runs: Daily at 3:00 AM
 */
export const cleanupOldQueueItems = async (): Promise<void> => {
  console.log('[WhatsApp Cron] Starting queue cleanup...');

  try {
    const deletedCount = await whatsappQueueService.cleanupOldItems(30);

    console.log('[WhatsApp Cron] Queue cleanup completed:', {
      deleted_count: deletedCount,
    });

  } catch (error) {
    console.error('[WhatsApp Cron] Queue cleanup error:', error);
    throw error;
  }
};

// ============================================================================
// COMBINED JOB RUNNER (for testing)
// ============================================================================

/**
 * Run all WhatsApp cron jobs (for testing/manual execution)
 */
export const runWhatsAppCronJobs = async (): Promise<void> => {
  console.log('🚀 Running all WhatsApp cron jobs...');

  try {
    await processWhatsAppQueue();
    await processScheduledMessages();
    console.log('✅ All WhatsApp cron jobs completed');
  } catch (error) {
    console.error('❌ WhatsApp cron jobs failed:', error);
    throw error;
  }
};
