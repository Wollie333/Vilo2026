/**
 * Booking Cron Service
 * Handles automated booking status changes and notifications
 */

import { getAdminClient } from '../config/supabase';
import { Booking, BookingWithDetails } from '../types/booking.types';
import { sendNotification } from './notifications.service';
import {
  sendInitialReviewRequestEmail,
  send30DayReminderEmail,
  send80DayFinalReminderEmail
} from './review-emails.service';

// ============================================================================
// AUTO CHECKOUT AT CHECKOUT TIME
// ============================================================================

/**
 * Automatically check out bookings at their checkout time
 * Run daily at 12:00 PM (noon) to catch all checkout times
 */
export async function autoCheckoutBookings(): Promise<{
  processed: number;
  errors: number;
  bookings: string[];
}> {
  const supabase = getAdminClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`[AUTO CHECKOUT] Running at ${now.toISOString()}`);

  try {
    // Find bookings that should be checked out
    // - booking_status = 'checked_in'
    // - check_out_date is today or earlier
    // - current time >= property checkout time
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_id,
        property_id,
        check_out_date,
        properties!inner (
          id,
          name,
          check_out_time,
          owner_id
        )
      `)
      .eq('booking_status', 'checked_in')
      .lte('check_out_date', today);

    if (error) {
      console.error('[AUTO CHECKOUT] Error fetching bookings:', error);
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[AUTO CHECKOUT] No bookings to checkout');
      return { processed: 0, errors: 0, bookings: [] };
    }

    console.log(`[AUTO CHECKOUT] Found ${bookings.length} bookings to process`);

    const results = {
      processed: 0,
      errors: 0,
      bookings: [] as string[],
    };

    // Process each booking
    for (const booking of bookings) {
      try {
        const property = booking.properties as any;
        const checkoutTime = property.check_out_time || '11:00:00';

        // Parse checkout time
        const [hours, minutes] = checkoutTime.split(':').map(Number);
        const checkoutDateTime = new Date(booking.check_out_date);
        checkoutDateTime.setHours(hours, minutes, 0, 0);

        // Only checkout if current time >= checkout time
        if (now >= checkoutDateTime) {
          console.log(`[AUTO CHECKOUT] Checking out booking ${booking.booking_reference}`);

          // Update booking status to checked_out
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              booking_status: 'checked_out',
              checked_out_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', booking.id);

          if (updateError) {
            console.error(`[AUTO CHECKOUT] Error updating booking ${booking.booking_reference}:`, updateError);
            results.errors++;
            continue;
          }

          // Send checkout notification to guest
          if (booking.guest_id) {
            await sendNotification({
              user_id: booking.guest_id,
              type: 'booking',
              title: 'Checkout Complete',
              message: `Your checkout for booking ${booking.booking_reference} is complete. We hope you enjoyed your stay!`,
              action_url: `/guest/bookings/${booking.id}`,
              priority: 'normal',
            }).catch(err => {
              console.error(`[AUTO CHECKOUT] Failed to send notification to guest:`, err);
            });
          }

          // Send notification to property owner
          if (property.owner_id) {
            await sendNotification({
              user_id: property.owner_id,
              type: 'booking',
              title: 'Guest Checked Out',
              message: `${booking.guest_name} has checked out from ${property.name}`,
              action_url: `/bookings/${booking.id}`,
              priority: 'normal',
            }).catch(err => {
              console.error(`[AUTO CHECKOUT] Failed to send notification to owner:`, err);
            });
          }

          results.processed++;
          results.bookings.push(booking.booking_reference);
        }
      } catch (error) {
        console.error(`[AUTO CHECKOUT] Error processing booking ${booking.booking_reference}:`, error);
        results.errors++;
      }
    }

    console.log(`[AUTO CHECKOUT] Completed: ${results.processed} processed, ${results.errors} errors`);
    return results;
  } catch (error) {
    console.error('[AUTO CHECKOUT] Fatal error:', error);
    throw error;
  }
}

// ============================================================================
// NO-SHOW DETECTION
// ============================================================================

/**
 * Detect bookings where guest didn't check in within 24 hours
 * Sends alert to staff (does NOT auto-mark as no_show)
 * Run daily at 6:00 PM
 */
export async function detectNoShows(): Promise<{
  detected: number;
  errors: number;
  bookings: string[];
}> {
  const supabase = getAdminClient();
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split('T')[0];

  console.log(`[NO-SHOW DETECTION] Running at ${now.toISOString()}`);

  try {
    // Find bookings where:
    // - booking_status = 'confirmed'
    // - check_in_date was yesterday or earlier
    // - Not checked in yet (24+ hours past check-in time)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_phone,
        property_id,
        check_in_date,
        properties!inner (
          id,
          name,
          check_in_time,
          owner_id
        )
      `)
      .eq('booking_status', 'confirmed')
      .lte('check_in_date', yesterdayDate);

    if (error) {
      console.error('[NO-SHOW DETECTION] Error fetching bookings:', error);
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[NO-SHOW DETECTION] No potential no-shows detected');
      return { detected: 0, errors: 0, bookings: [] };
    }

    console.log(`[NO-SHOW DETECTION] Found ${bookings.length} potential no-shows`);

    const results = {
      detected: 0,
      errors: 0,
      bookings: [] as string[],
    };

    // Send alerts to property owners
    for (const booking of bookings) {
      try {
        const property = booking.properties as any;

        console.log(`[NO-SHOW DETECTION] Potential no-show: ${booking.booking_reference}`);

        // Send alert to property owner
        if (property.owner_id) {
          await sendNotification({
            user_id: property.owner_id,
            type: 'booking',
            title: 'Potential No-Show Alert',
            message: `Guest ${booking.guest_name} has not checked in for booking ${booking.booking_reference}. Please verify and mark as no-show if needed.`,
            action_url: `/bookings/${booking.id}`,
            priority: 'high',
            variant: 'warning',
          }).catch(err => {
            console.error(`[NO-SHOW DETECTION] Failed to send notification:`, err);
          });
        }

        results.detected++;
        results.bookings.push(booking.booking_reference);
      } catch (error) {
        console.error(`[NO-SHOW DETECTION] Error processing booking ${booking.booking_reference}:`, error);
        results.errors++;
      }
    }

    console.log(`[NO-SHOW DETECTION] Completed: ${results.detected} alerts sent, ${results.errors} errors`);
    return results;
  } catch (error) {
    console.error('[NO-SHOW DETECTION] Fatal error:', error);
    throw error;
  }
}

// ============================================================================
// FAILED CHECKOUT TRACKING
// ============================================================================

/**
 * Mark abandoned bookings as failed_checkout after 90 days
 * Run daily at 2:00 AM
 */
export async function markFailedCheckouts(): Promise<{
  marked: number;
  errors: number;
  bookings: string[];
}> {
  const supabase = getAdminClient();
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  console.log(`[FAILED CHECKOUT] Running at ${now.toISOString()}`);

  try {
    // Find bookings where:
    // - booking_status = 'pending'
    // - payment_status = 'pending'
    // - created_at < 90 days ago
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, booking_reference, guest_email, guest_id, created_at')
      .eq('booking_status', 'pending')
      .eq('payment_status', 'pending')
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (error) {
      console.error('[FAILED CHECKOUT] Error fetching bookings:', error);
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[FAILED CHECKOUT] No abandoned checkouts to mark');
      return { marked: 0, errors: 0, bookings: [] };
    }

    console.log(`[FAILED CHECKOUT] Found ${bookings.length} abandoned checkouts`);

    const results = {
      marked: 0,
      errors: 0,
      bookings: [] as string[],
    };

    // Mark each booking as failed_checkout
    for (const booking of bookings) {
      try {
        console.log(`[FAILED CHECKOUT] Marking ${booking.booking_reference} as failed_checkout`);

        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'failed_checkout',
            failed_checkout_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`[FAILED CHECKOUT] Error updating booking ${booking.booking_reference}:`, updateError);
          results.errors++;
          continue;
        }

        results.marked++;
        results.bookings.push(booking.booking_reference);
      } catch (error) {
        console.error(`[FAILED CHECKOUT] Error processing booking ${booking.booking_reference}:`, error);
        results.errors++;
      }
    }

    console.log(`[FAILED CHECKOUT] Completed: ${results.marked} marked, ${results.errors} errors`);
    return results;
  } catch (error) {
    console.error('[FAILED CHECKOUT] Fatal error:', error);
    throw error;
  }
}

// ============================================================================
// EFT VERIFICATION REMINDERS
// ============================================================================

/**
 * Send reminders for EFT payments needing verification
 * - At 48 hours: Send reminder
 * - At 96 hours (4 days): Mark as failed_checkout
 * Run every 6 hours
 */
export async function processEFTVerificationReminders(): Promise<{
  reminders_sent: number;
  marked_failed: number;
  errors: number;
}> {
  const supabase = getAdminClient();
  const now = new Date();

  console.log(`[EFT VERIFICATION] Running at ${now.toISOString()}`);

  try {
    // Find EFT bookings awaiting verification
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_id,
        property_id,
        payment_method,
        created_at,
        abandoned_cart_reminder_sent,
        properties!inner (
          id,
          name,
          owner_id
        )
      `)
      .eq('payment_status', 'verification_pending')
      .eq('payment_method', 'eft');

    if (error) {
      console.error('[EFT VERIFICATION] Error fetching bookings:', error);
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[EFT VERIFICATION] No EFT payments needing verification');
      return { reminders_sent: 0, marked_failed: 0, errors: 0 };
    }

    console.log(`[EFT VERIFICATION] Found ${bookings.length} EFT payments to process`);

    const results = {
      reminders_sent: 0,
      marked_failed: 0,
      errors: 0,
    };

    for (const booking of bookings) {
      try {
        const createdAt = new Date(booking.created_at);
        const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const property = booking.properties as any;

        // 48 hours: Send reminder (if not already sent)
        if (hoursElapsed >= 48 && hoursElapsed < 96 && !booking.abandoned_cart_reminder_sent) {
          console.log(`[EFT VERIFICATION] Sending 48hr reminder for ${booking.booking_reference}`);

          // Send reminder to guest
          if (booking.guest_id) {
            await sendNotification({
              user_id: booking.guest_id,
              type: 'booking',
              title: 'Payment Verification Needed',
              message: `Your EFT payment for booking ${booking.booking_reference} is still pending verification. Please ensure payment has been made and proof uploaded.`,
              action_url: `/guest/bookings/${booking.id}`,
              priority: 'high',
              variant: 'warning',
            }).catch(err => {
              console.error(`[EFT VERIFICATION] Failed to send reminder to guest:`, err);
            });
          }

          // Send reminder to property owner
          if (property.owner_id) {
            await sendNotification({
              user_id: property.owner_id,
              type: 'booking',
              title: 'EFT Payment Needs Verification',
              message: `Booking ${booking.booking_reference} has been pending EFT verification for 48 hours. Please verify payment.`,
              action_url: `/bookings/${booking.id}`,
              priority: 'high',
              variant: 'warning',
            }).catch(err => {
              console.error(`[EFT VERIFICATION] Failed to send reminder to owner:`, err);
            });
          }

          // Mark reminder as sent
          await supabase
            .from('bookings')
            .update({ abandoned_cart_reminder_sent: true })
            .eq('id', booking.id);

          results.reminders_sent++;
        }

        // 96 hours (4 days): Mark as failed_checkout
        if (hoursElapsed >= 96) {
          console.log(`[EFT VERIFICATION] Marking ${booking.booking_reference} as failed_checkout (96hrs elapsed)`);

          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              payment_status: 'failed_checkout',
              failed_checkout_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', booking.id);

          if (updateError) {
            console.error(`[EFT VERIFICATION] Error updating booking ${booking.booking_reference}:`, updateError);
            results.errors++;
            continue;
          }

          // Notify guest
          if (booking.guest_id) {
            await sendNotification({
              user_id: booking.guest_id,
              type: 'booking',
              title: 'Booking Cancelled - Payment Not Verified',
              message: `Your booking ${booking.booking_reference} has been cancelled due to unverified payment. Please contact the property if you have made payment.`,
              action_url: `/guest/bookings/${booking.id}`,
              priority: 'high',
              variant: 'error',
            }).catch(err => {
              console.error(`[EFT VERIFICATION] Failed to send cancellation notification:`, err);
            });
          }

          results.marked_failed++;
        }
      } catch (error) {
        console.error(`[EFT VERIFICATION] Error processing booking ${booking.booking_reference}:`, error);
        results.errors++;
      }
    }

    console.log(`[EFT VERIFICATION] Completed: ${results.reminders_sent} reminders, ${results.marked_failed} marked failed, ${results.errors} errors`);
    return results;
  } catch (error) {
    console.error('[EFT VERIFICATION] Fatal error:', error);
    throw error;
  }
}

// ============================================================================
// ABANDONED CART RECOVERY EMAILS
// ============================================================================

/**
 * Send recovery emails for abandoned bookings (failed_checkout)
 * Runs daily at 3 AM to send emails to bookings marked as failed_checkout
 * in the last 24-48 hours
 */
export async function sendAbandonedCartRecoveryEmails(): Promise<{
  emails_sent: number;
  errors: number;
  bookings: string[];
}> {
  const supabase = getAdminClient();
  const now = new Date();

  // Look for bookings marked as failed_checkout in the last 24-48 hours
  // This gives us a window after the markFailedCheckouts job runs
  const fortyEightHoursAgo = new Date(now);
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  const twentyFourHoursAgo = new Date(now);
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  console.log(`[RECOVERY EMAIL] Running at ${now.toISOString()}`);

  try {
    // Find bookings where:
    // - payment_status = 'failed_checkout'
    // - recovery_email_sent = false
    // - failed_checkout_at is between 24-48 hours ago
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_id,
        property_id,
        total_amount,
        currency,
        check_in_date,
        check_out_date,
        failed_checkout_at,
        properties!inner (
          id,
          name
        )
      `)
      .eq('payment_status', 'failed_checkout')
      .eq('recovery_email_sent', false)
      .gte('failed_checkout_at', fortyEightHoursAgo.toISOString())
      .lte('failed_checkout_at', twentyFourHoursAgo.toISOString());

    if (error) {
      console.error('[RECOVERY EMAIL] Error fetching bookings:', error);
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[RECOVERY EMAIL] No abandoned bookings need recovery emails');
      return { emails_sent: 0, errors: 0, bookings: [] };
    }

    console.log(`[RECOVERY EMAIL] Found ${bookings.length} bookings to send recovery emails`);

    const results = {
      emails_sent: 0,
      errors: 0,
      bookings: [] as string[],
    };

    // Process each booking
    for (const booking of bookings) {
      try {
        const property = booking.properties as any;

        console.log(`[RECOVERY EMAIL] Sending recovery email for ${booking.booking_reference}`);

        // Send in-app notification
        if (booking.guest_id) {
          await sendNotification({
            user_id: booking.guest_id,
            type: 'booking',
            title: 'Complete Your Booking',
            message: `Your booking at ${property.name} is still available! Complete your payment to secure your reservation.`,
            action_url: `/guest/bookings/${booking.id}`,
            priority: 'high',
            variant: 'info',
          }).catch(err => {
            console.error(`[RECOVERY EMAIL] Failed to send notification:`, err);
          });
        }

        // TODO: Send actual email when email service is configured
        // For now, just mark as sent since in-app notification was sent

        // Mark recovery email as sent
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            recovery_email_sent: true,
            recovery_email_sent_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`[RECOVERY EMAIL] Error updating booking ${booking.booking_reference}:`, updateError);
          results.errors++;
          continue;
        }

        results.emails_sent++;
        results.bookings.push(booking.booking_reference);
      } catch (error) {
        console.error(`[RECOVERY EMAIL] Error processing booking ${booking.booking_reference}:`, error);
        results.errors++;
      }
    }

    console.log(`[RECOVERY EMAIL] Completed: ${results.emails_sent} emails sent, ${results.errors} errors`);
    return results;
  } catch (error) {
    console.error('[RECOVERY EMAIL] Fatal error:', error);
    throw error;
  }
}

// ============================================================================
// REVIEW REQUEST EMAILS (24h, 30d, 80d)
// ============================================================================

/**
 * Send review request emails 24 hours after checkout
 * Run daily at 10:00 AM
 */
export async function sendInitialReviewRequests(): Promise<{
  sent: number;
  errors: number;
  bookings: string[];
}> {
  const supabase = getAdminClient();
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  console.log(`[REVIEW REQUEST - 24H] Running at ${now.toISOString()}`);

  try {
    // Find bookings checked out 24 hours ago that haven't received review request
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_id,
        property_id,
        check_in_date,
        check_out_date,
        checked_out_at,
        properties!inner (
          id,
          name,
          owner_id
        )
      `)
      .in('booking_status', ['checked_out', 'completed'])
      .not('checked_out_at', 'is', null)
      .is('review_sent_at', null)
      .gte('checked_out_at', new Date(twentyFourHoursAgo.getTime() - 2 * 60 * 60 * 1000).toISOString()) // 22-26h window
      .lte('checked_out_at', new Date(twentyFourHoursAgo.getTime() + 2 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[REVIEW REQUEST - 24H] Error fetching bookings:', error);
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[REVIEW REQUEST - 24H] No bookings found');
      return { sent: 0, errors: 0, bookings: [] };
    }

    console.log(`[REVIEW REQUEST - 24H] Found ${bookings.length} bookings`);

    const results = { sent: 0, errors: 0, bookings: [] as string[] };

    for (const booking of bookings) {
      try {
        // Check if review already exists
        const { data: existingReview } = await supabase
          .from('property_reviews')
          .select('id')
          .eq('booking_id', booking.id)
          .single();

        if (existingReview) {
          console.log(`[REVIEW REQUEST - 24H] Booking ${booking.booking_reference} already has review, skipping`);
          continue;
        }

        const property = booking.properties as any;
        const daysRemaining = 90 - Math.floor((now.getTime() - new Date(booking.checked_out_at).getTime()) / (1000 * 60 * 60 * 24));

        // Send in-app notification
        if (booking.guest_id) {
          await sendNotification({
            user_id: booking.guest_id,
            type: 'review',
            title: `How was your stay at ${property.name}?`,
            message: `We'd love to hear about your recent experience. Your feedback helps other travelers!`,
            action_url: `/reviews/write/${booking.id}`,
            action_label: 'Write Review',
            priority: 'normal',
            variant: 'info',
          }).catch(err => console.error(`[REVIEW REQUEST - 24H] Failed to send notification:`, err));
        }

        // Send email via Resend
        await sendInitialReviewRequestEmail({
          guestEmail: booking.guest_email,
          guestName: booking.guest_name,
          propertyName: property.name,
          bookingId: booking.id,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          daysRemaining,
        }).catch(err => console.error(`[REVIEW REQUEST - 24H] Failed to send email:`, err));

        // Update review_sent_at
        await supabase
          .from('bookings')
          .update({ review_sent_at: now.toISOString() })
          .eq('id', booking.id);

        results.sent++;
        results.bookings.push(booking.booking_reference);

        console.log(`[REVIEW REQUEST - 24H] Sent to ${booking.guest_email} for ${booking.booking_reference}`);
      } catch (error) {
        console.error(`[REVIEW REQUEST - 24H] Error processing booking ${booking.booking_reference}:`, error);
        results.errors++;
      }
    }

    console.log(`[REVIEW REQUEST - 24H] Completed: ${results.sent} sent, ${results.errors} errors`);
    return results;
  } catch (error) {
    console.error('[REVIEW REQUEST - 24H] Fatal error:', error);
    throw error;
  }
}

/**
 * Send reminder emails 30 days after checkout (if no review yet)
 * Run daily at 11:00 AM
 */
export async function send30DayReviewReminders(): Promise<{
  sent: number;
  errors: number;
  bookings: string[];
}> {
  const supabase = getAdminClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  console.log(`[REVIEW REMINDER - 30D] Running at ${now.toISOString()}`);

  try {
    // Find bookings checked out 30 days ago, review_sent_at exists, but no review submitted
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_id,
        property_id,
        check_in_date,
        check_out_date,
        checked_out_at,
        properties!inner (
          id,
          name,
          owner_id
        )
      `)
      .in('booking_status', ['checked_out', 'completed'])
      .not('checked_out_at', 'is', null)
      .not('review_sent_at', 'is', null)
      .gte('checked_out_at', new Date(thirtyDaysAgo.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()) // 29-31 day window
      .lte('checked_out_at', new Date(thirtyDaysAgo.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[REVIEW REMINDER - 30D] Error:', error);
      throw error;
    }

    if (!bookings || bookings.length === 0) {
      console.log('[REVIEW REMINDER - 30D] No bookings found');
      return { sent: 0, errors: 0, bookings: [] };
    }

    const results = { sent: 0, errors: 0, bookings: [] as string[] };

    for (const booking of bookings) {
      try {
        // Check if review exists
        const { data: review } = await supabase
          .from('property_reviews')
          .select('id')
          .eq('booking_id', booking.id)
          .single();

        if (review) {
          console.log(`[REVIEW REMINDER - 30D] Review already exists for ${booking.booking_reference}`);
          continue;
        }

        const property = booking.properties as any;
        const daysRemaining = 60; // 90 - 30 = 60 days left

        // Send reminder notification
        if (booking.guest_id) {
          await sendNotification({
            user_id: booking.guest_id,
            type: 'review',
            title: `Still time to review ${property.name}`,
            message: `We'd still love to hear about your stay! ${daysRemaining} days left to share your experience.`,
            action_url: `/reviews/write/${booking.id}`,
            action_label: 'Write Review',
            priority: 'normal',
            variant: 'info',
          }).catch(err => console.error('[REVIEW REMINDER - 30D] Notification failed:', err));
        }

        // Send email via Resend
        await send30DayReminderEmail({
          guestEmail: booking.guest_email,
          guestName: booking.guest_name,
          propertyName: property.name,
          bookingId: booking.id,
          daysRemaining,
        }).catch(err => console.error('[REVIEW REMINDER - 30D] Email failed:', err));

        results.sent++;
        results.bookings.push(booking.booking_reference);
      } catch (error) {
        console.error(`[REVIEW REMINDER - 30D] Error processing ${booking.booking_reference}:`, error);
        results.errors++;
      }
    }

    console.log(`[REVIEW REMINDER - 30D] Completed: ${results.sent} sent`);
    return results;
  } catch (error) {
    console.error('[REVIEW REMINDER - 30D] Fatal error:', error);
    throw error;
  }
}

/**
 * Send final reminder 80 days after checkout (10 days before expiry)
 * Run daily at 12:00 PM
 */
export async function send80DayFinalReminders(): Promise<{
  sent: number;
  errors: number;
  bookings: string[];
}> {
  const supabase = getAdminClient();
  const now = new Date();
  const eightyDaysAgo = new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000);

  console.log(`[REVIEW REMINDER - 80D] Running at ${now.toISOString()}`);

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest_name,
        guest_email,
        guest_id,
        property_id,
        check_in_date,
        check_out_date,
        checked_out_at,
        properties!inner (
          id,
          name,
          owner_id
        )
      `)
      .in('booking_status', ['checked_out', 'completed'])
      .not('checked_out_at', 'is', null)
      .gte('checked_out_at', new Date(eightyDaysAgo.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString())
      .lte('checked_out_at', new Date(eightyDaysAgo.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      console.log('[REVIEW REMINDER - 80D] No bookings found');
      return { sent: 0, errors: 0, bookings: [] };
    }

    const results = { sent: 0, errors: 0, bookings: [] as string[] };

    for (const booking of bookings) {
      try {
        // Check if review exists
        const { data: review } = await supabase
          .from('property_reviews')
          .select('id')
          .eq('booking_id', booking.id)
          .single();

        if (review) continue;

        const property = booking.properties as any;

        // Send URGENT notification
        if (booking.guest_id) {
          await sendNotification({
            user_id: booking.guest_id,
            type: 'review',
            title: `⚠️ Last chance to review ${property.name}`,
            message: `Only 10 days left to share your feedback! Don't miss your opportunity to help other travelers.`,
            action_url: `/reviews/write/${booking.id}`,
            action_label: 'Write Review Now',
            priority: 'high',
            variant: 'warning',
          }).catch(err => console.error('[REVIEW REMINDER - 80D] Notification failed:', err));
        }

        // Send urgent email via Resend
        await send80DayFinalReminderEmail({
          guestEmail: booking.guest_email,
          guestName: booking.guest_name,
          propertyName: property.name,
          bookingId: booking.id,
        }).catch(err => console.error('[REVIEW REMINDER - 80D] Email failed:', err));

        results.sent++;
        results.bookings.push(booking.booking_reference);
      } catch (error) {
        console.error(`[REVIEW REMINDER - 80D] Error processing ${booking.booking_reference}:`, error);
        results.errors++;
      }
    }

    console.log(`[REVIEW REMINDER - 80D] Completed: ${results.sent} sent`);
    return results;
  } catch (error) {
    console.error('[REVIEW REMINDER - 80D] Fatal error:', error);
    throw error;
  }
}

// ============================================================================
// MASTER CRON JOB RUNNER
// ============================================================================

/**
 * Run all cron jobs based on schedule
 * This should be called by a scheduler (e.g., node-cron, external cron)
 */
export async function runBookingCronJobs(): Promise<void> {
  console.log('========================================');
  console.log('Running Booking Cron Jobs');
  console.log('========================================');

  try {
    // Run all jobs in parallel
    const [
      checkoutResults,
      noShowResults,
      failedCheckoutResults,
      eftResults,
      recoveryResults,
      review24hResults,
      review30dResults,
      review80dResults,
    ] = await Promise.allSettled([
      autoCheckoutBookings(),
      detectNoShows(),
      markFailedCheckouts(),
      processEFTVerificationReminders(),
      sendAbandonedCartRecoveryEmails(),
      sendInitialReviewRequests(),
      send30DayReviewReminders(),
      send80DayFinalReminders(),
    ]);

    console.log('\n========================================');
    console.log('Cron Jobs Summary:');
    console.log('========================================');

    if (checkoutResults.status === 'fulfilled') {
      console.log(`✅ Auto Checkout: ${checkoutResults.value.processed} processed`);
    } else {
      console.error('❌ Auto Checkout failed:', checkoutResults.reason);
    }

    if (noShowResults.status === 'fulfilled') {
      console.log(`✅ No-Show Detection: ${noShowResults.value.detected} alerts sent`);
    } else {
      console.error('❌ No-Show Detection failed:', noShowResults.reason);
    }

    if (failedCheckoutResults.status === 'fulfilled') {
      console.log(`✅ Failed Checkouts: ${failedCheckoutResults.value.marked} marked`);
    } else {
      console.error('❌ Failed Checkouts failed:', failedCheckoutResults.reason);
    }

    if (eftResults.status === 'fulfilled') {
      console.log(`✅ EFT Verification: ${eftResults.value.reminders_sent} reminders, ${eftResults.value.marked_failed} marked failed`);
    } else {
      console.error('❌ EFT Verification failed:', eftResults.reason);
    }

    if (recoveryResults.status === 'fulfilled') {
      console.log(`✅ Recovery Emails: ${recoveryResults.value.emails_sent} sent`);
    } else {
      console.error('❌ Recovery Emails failed:', recoveryResults.reason);
    }

    if (review24hResults.status === 'fulfilled') {
      console.log(`✅ Review Requests (24h): ${review24hResults.value.sent} sent`);
    } else {
      console.error('❌ Review Requests (24h) failed:', review24hResults.reason);
    }

    if (review30dResults.status === 'fulfilled') {
      console.log(`✅ Review Reminders (30d): ${review30dResults.value.sent} sent`);
    } else {
      console.error('❌ Review Reminders (30d) failed:', review30dResults.reason);
    }

    if (review80dResults.status === 'fulfilled') {
      console.log(`✅ Final Reminders (80d): ${review80dResults.value.sent} sent`);
    } else {
      console.error('❌ Final Reminders (80d) failed:', review80dResults.reason);
    }

    console.log('========================================\n');
  } catch (error) {
    console.error('Fatal error running cron jobs:', error);
    throw error;
  }
}
