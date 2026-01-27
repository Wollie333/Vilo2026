/**
 * Review Email Service
 * Email templates and sending logic for review requests
 *
 * NOTE: This service uses database templates with fallback to hardcoded templates.
 * Try template-based sending first, fallback to hardcoded on error.
 */

import { sendNotificationEmail, wrapInEmailTemplate } from './email.service';
import * as emailTemplateService from './email-template.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ============================================================================
// Email Template Helpers
// ============================================================================

/**
 * Get the frontend URL for review links
 */
function getFrontendUrl(): string {
  return env.FRONTEND_URL || 'http://localhost:5173';
}

// ============================================================================
// Review Request Emails
// ============================================================================

/**
 * Send initial review request (24 hours after checkout)
 */
export async function sendInitialReviewRequestEmail(data: {
  guestEmail: string;
  guestName: string;
  propertyName: string;
  bookingId: string;
  checkInDate: string;
  checkOutDate: string;
  daysRemaining: number;
}): Promise<boolean> {
  const reviewUrl = `${getFrontendUrl()}/reviews/write/${data.bookingId}`;

  // Try template-based sending first
  try {
    logger.info('[REVIEW_EMAILS] Attempting template-based send for review_request_initial');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'review_request_initial',
      recipient_email: data.guestEmail,
      variables: {
        guest_name: data.guestName,
        property_name: data.propertyName,
        check_in_date: new Date(data.checkInDate).toLocaleDateString(),
        check_out_date: new Date(data.checkOutDate).toLocaleDateString(),
        review_url: reviewUrl,
        days_remaining: data.daysRemaining.toString(),
      },
      context_type: 'review_request',
      context_id: data.bookingId,
    });

    logger.info('Initial review request email sent (template-based)', {
      bookingId: data.bookingId,
      guestEmail: data.guestEmail,
    });
    return true;
  } catch (templateError) {
    logger.warn('[REVIEW_EMAILS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    const emailContent = `
      <h1>How was your stay at ${data.propertyName}?</h1>
      <p>Hi ${data.guestName},</p>
      <p>Thank you for staying with us from ${new Date(data.checkInDate).toLocaleDateString()} to ${new Date(data.checkOutDate).toLocaleDateString()}!</p>
      <p>We'd love to hear about your experience. Your feedback helps other travelers make informed decisions and helps us improve our service.</p>

      <p><strong>Share your thoughts:</strong></p>
      <ul>
        <li>Rate your experience across 5 categories</li>
        <li>Share what you loved (or what could be better)</li>
        <li>Upload photos from your stay (optional)</li>
      </ul>

      <p style="text-align: center;">
        <a href="${reviewUrl}" class="button">Write Your Review</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        You have ${data.daysRemaining} days remaining to submit your review.
      </p>

      <p>Thank you for choosing ${data.propertyName}!</p>
    `;

    const html = wrapInEmailTemplate(emailContent, `Review Your Stay at ${data.propertyName}`);

    try {
      const sent = await sendNotificationEmail({
        to: data.guestEmail,
        subject: `How was your stay at ${data.propertyName}? ⭐`,
        html,
      });

      if (sent) {
        logger.info('Initial review request email sent (fallback)', {
          bookingId: data.bookingId,
          guestEmail: data.guestEmail,
        });
      }

      return sent;
    } catch (error) {
      logger.error('Failed to send initial review request email', {
        error,
        bookingId: data.bookingId,
        guestEmail: data.guestEmail,
      });
      return false;
    }
  }
}

/**
 * Send 30-day reminder email
 */
export async function send30DayReminderEmail(data: {
  guestEmail: string;
  guestName: string;
  propertyName: string;
  bookingId: string;
  daysRemaining: number;
}): Promise<boolean> {
  const reviewUrl = `${getFrontendUrl()}/reviews/write/${data.bookingId}`;

  // Try template-based sending first
  try {
    logger.info('[REVIEW_EMAILS] Attempting template-based send for review_request_30d_reminder');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'review_request_30d_reminder',
      recipient_email: data.guestEmail,
      variables: {
        guest_name: data.guestName,
        property_name: data.propertyName,
        review_url: reviewUrl,
        days_remaining: data.daysRemaining.toString(),
      },
      context_type: 'review_request',
      context_id: data.bookingId,
    });

    logger.info('30-day review reminder email sent (template-based)', {
      bookingId: data.bookingId,
      guestEmail: data.guestEmail,
    });
    return true;
  } catch (templateError) {
    logger.warn('[REVIEW_EMAILS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    const emailContent = `
      <h1>Still time to review ${data.propertyName}</h1>
      <p>Hi ${data.guestName},</p>
      <p>We noticed you haven't had a chance to review your recent stay at ${data.propertyName} yet.</p>
      <p>We'd still love to hear your feedback! Your review helps future guests and takes just a few minutes.</p>

      <p style="text-align: center;">
        <a href="${reviewUrl}" class="button">Share Your Experience</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        You have ${data.daysRemaining} days remaining to submit your review.
      </p>

      <p>Thank you!</p>
    `;

    const html = wrapInEmailTemplate(emailContent, `Reminder: Review ${data.propertyName}`);

    try {
      const sent = await sendNotificationEmail({
        to: data.guestEmail,
        subject: `Still time to review ${data.propertyName} 💭`,
        html,
      });

      if (sent) {
        logger.info('30-day review reminder email sent (fallback)', {
          bookingId: data.bookingId,
          guestEmail: data.guestEmail,
        });
      }

      return sent;
    } catch (error) {
      logger.error('Failed to send 30-day reminder email', {
        error,
        bookingId: data.bookingId,
        guestEmail: data.guestEmail,
      });
      return false;
    }
  }
}

/**
 * Send final 80-day reminder (urgent)
 */
export async function send80DayFinalReminderEmail(data: {
  guestEmail: string;
  guestName: string;
  propertyName: string;
  bookingId: string;
}): Promise<boolean> {
  const reviewUrl = `${getFrontendUrl()}/reviews/write/${data.bookingId}`;

  // Try template-based sending first
  try {
    logger.info('[REVIEW_EMAILS] Attempting template-based send for review_request_80d_final');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'review_request_80d_final',
      recipient_email: data.guestEmail,
      variables: {
        guest_name: data.guestName,
        property_name: data.propertyName,
        review_url: reviewUrl,
      },
      context_type: 'review_request',
      context_id: data.bookingId,
    });

    logger.info('80-day final reminder email sent (template-based)', {
      bookingId: data.bookingId,
      guestEmail: data.guestEmail,
    });
    return true;
  } catch (templateError) {
    logger.warn('[REVIEW_EMAILS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    const emailContent = `
      <h1 style="color: #f59e0b;">⚠️ Last Chance to Review ${data.propertyName}</h1>
      <p>Hi ${data.guestName},</p>
      <p><strong>Only 10 days left</strong> to share your feedback about your stay at ${data.propertyName}!</p>
      <p>After 90 days, the review window closes permanently. Don't miss your opportunity to help other travelers and share your experience.</p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">
          <strong>⏰ Expires in 10 days</strong><br>
          Your chance to leave a review ends soon!
        </p>
      </div>

      <p style="text-align: center;">
        <a href="${reviewUrl}" class="button">Write Your Review Now</a>
      </p>

      <p>Thank you for your time!</p>
    `;

    const html = wrapInEmailTemplate(emailContent, `⚠️ Last Chance: Review ${data.propertyName}`);

    try {
      const sent = await sendNotificationEmail({
        to: data.guestEmail,
        subject: `⚠️ Last chance to review ${data.propertyName} - 10 days left!`,
        html,
      });

      if (sent) {
        logger.info('80-day final reminder email sent (fallback)', {
          bookingId: data.bookingId,
          guestEmail: data.guestEmail,
        });
      }

      return sent;
    } catch (error) {
      logger.error('Failed to send 80-day final reminder email', {
        error,
        bookingId: data.bookingId,
        guestEmail: data.guestEmail,
      });
      return false;
    }
  }
}

/**
 * Send manual review request (triggered by property owner)
 */
export async function sendManualReviewRequestEmail(data: {
  guestEmail: string;
  guestName: string;
  propertyName: string;
  bookingId: string;
  daysRemaining: number;
}): Promise<boolean> {
  const reviewUrl = `${getFrontendUrl()}/reviews/write/${data.bookingId}`;

  // Try template-based sending first
  try {
    logger.info('[REVIEW_EMAILS] Attempting template-based send for review_request_manual');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'review_request_manual',
      recipient_email: data.guestEmail,
      variables: {
        guest_name: data.guestName,
        property_name: data.propertyName,
        review_url: reviewUrl,
        days_remaining: data.daysRemaining.toString(),
      },
      context_type: 'review_request',
      context_id: data.bookingId,
    });

    logger.info('Manual review request email sent (template-based)', {
      bookingId: data.bookingId,
      guestEmail: data.guestEmail,
    });
    return true;
  } catch (templateError) {
    logger.warn('[REVIEW_EMAILS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    const emailContent = `
      <h1>We'd love your feedback on ${data.propertyName}</h1>
      <p>Hi ${data.guestName},</p>
      <p>Thank you for staying at ${data.propertyName}. We hope you had a wonderful experience!</p>
      <p>We'd really appreciate it if you could take a moment to share your feedback. Your review helps us improve and helps other guests make informed decisions.</p>

      <p style="text-align: center;">
        <a href="${reviewUrl}" class="button">Leave a Review</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        You have ${data.daysRemaining} days remaining to submit your review.
      </p>

      <p>Thank you for choosing us!</p>
    `;

    const html = wrapInEmailTemplate(emailContent, `Share Your Feedback - ${data.propertyName}`);

    try {
      const sent = await sendNotificationEmail({
        to: data.guestEmail,
        subject: `We'd love your feedback on ${data.propertyName} ⭐`,
        html,
      });

      if (sent) {
        logger.info('Manual review request email sent (fallback)', {
          bookingId: data.bookingId,
          guestEmail: data.guestEmail,
        });
      }

      return sent;
    } catch (error) {
      logger.error('Failed to send manual review request email', {
        error,
        bookingId: data.bookingId,
        guestEmail: data.guestEmail,
      });
      return false;
    }
  }
}
