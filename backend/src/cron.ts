/**
 * Cron Job Scheduler
 * Runs automated booking status updates and notifications
 */

import cron from 'node-cron';
import {
  runBookingCronJobs,
  autoCheckoutBookings,
  detectNoShows,
  markFailedCheckouts,
  processEFTVerificationReminders,
  sendAbandonedCartRecoveryEmails,
} from './services/booking-cron.service';

// ============================================================================
// CRON JOB SCHEDULES
// ============================================================================

/**
 * Schedule all cron jobs
 */
export function initializeCronJobs(): void {
  console.log('🕐 Initializing Booking Cron Jobs...');

  // Run all jobs once on startup (for testing)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Running cron jobs on startup');
    runBookingCronJobs().catch((err) => {
      console.error('Error running startup cron jobs:', err);
    });
  }

  // ============================================================================
  // JOB 1: Auto Checkout - Daily at 12:00 PM (noon)
  // ============================================================================
  cron.schedule('0 12 * * *', async () => {
    console.log('⏰ [CRON] Running auto checkout job');
    try {
      await autoCheckoutBookings();
    } catch (error) {
      console.error('❌ [CRON] Auto checkout job failed:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg', // Adjust to your timezone
  });

  console.log('✅ Scheduled: Auto Checkout (Daily at 12:00 PM)');

  // ============================================================================
  // JOB 2: No-Show Detection - Daily at 6:00 PM
  // ============================================================================
  cron.schedule('0 18 * * *', async () => {
    console.log('⏰ [CRON] Running no-show detection job');
    try {
      await detectNoShows();
    } catch (error) {
      console.error('❌ [CRON] No-show detection job failed:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg',
  });

  console.log('✅ Scheduled: No-Show Detection (Daily at 6:00 PM)');

  // ============================================================================
  // JOB 3: Failed Checkouts - Daily at 2:00 AM
  // ============================================================================
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [CRON] Running failed checkout job');
    try {
      await markFailedCheckouts();
    } catch (error) {
      console.error('❌ [CRON] Failed checkout job failed:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg',
  });

  console.log('✅ Scheduled: Failed Checkouts (Daily at 2:00 AM)');

  // ============================================================================
  // JOB 4: EFT Verification - Every 6 hours
  // ============================================================================
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ [CRON] Running EFT verification job');
    try {
      await processEFTVerificationReminders();
    } catch (error) {
      console.error('❌ [CRON] EFT verification job failed:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg',
  });

  console.log('✅ Scheduled: EFT Verification (Every 6 hours)');

  // ============================================================================
  // JOB 5: Abandoned Cart Recovery Emails - Daily at 3:00 AM
  // (Runs 1 hour after failed checkouts are marked)
  // ============================================================================
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ [CRON] Running abandoned cart recovery email job');
    try {
      await sendAbandonedCartRecoveryEmails();
    } catch (error) {
      console.error('❌ [CRON] Recovery email job failed:', error);
    }
  }, {
    timezone: 'Africa/Johannesburg',
  });

  console.log('✅ Scheduled: Abandoned Cart Recovery (Daily at 3:00 AM)');

  console.log('🎯 All booking cron jobs initialized successfully');
}

/**
 * Run cron jobs manually (for testing)
 */
export async function runManualCronJobs(): Promise<void> {
  console.log('🔧 Running manual cron jobs...');
  await runBookingCronJobs();
}
