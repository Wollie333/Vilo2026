/**
 * Refund Email Service
 * Email templates for refund-related notifications
 *
 * NOTE: This service uses database templates with fallback to hardcoded templates.
 * Try template-based sending first, fallback to hardcoded on error.
 */

import { sendNotificationEmail, wrapInEmailTemplate } from './email.service';
import * as emailTemplateService from './email-template.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ============================================================================
// Helper Functions
// ============================================================================

function getFrontendUrl(): string {
  return env.FRONTEND_URL || 'http://localhost:5173';
}

function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ============================================================================
// Refund Request Emails
// ============================================================================

/**
 * Send refund request notification to admin/property owner
 */
export async function sendRefundRequestedEmailToAdmin(data: {
  adminEmail: string;
  guestName: string;
  bookingReference: string;
  refundAmount: number;
  currency: string;
  reason: string;
  refundId: string;
}): Promise<boolean> {
  const refundUrl = `${getFrontendUrl()}/admin/refunds/${data.refundId}`;

  // Try template-based sending first
  try {
    logger.info('[REFUND_EMAILS] Attempting template-based send for refund_requested');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'refund_requested',
      recipient_email: data.adminEmail,
      variables: {
        guest_name: data.guestName,
        booking_reference: data.bookingReference,
        refund_amount: formatCurrency(data.refundAmount, data.currency),
        reason: data.reason,
        refund_url: refundUrl,
      },
      context_type: 'refund',
      context_id: data.refundId,
    });

    logger.info('Refund request email sent to admin (template-based)', {
      refundId: data.refundId,
      adminEmail: data.adminEmail,
    });
    return true;
  } catch (templateError) {
    logger.warn('[REFUND_EMAILS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    const emailContent = `
      <h1>New Refund Request</h1>
      <p><strong>${data.guestName}</strong> has requested a refund for booking <strong>${data.bookingReference}</strong>.</p>

      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>Booking:</strong></td>
            <td style="padding: 8px 0;">${data.bookingReference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Guest:</strong></td>
            <td style="padding: 8px 0;">${data.guestName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Amount:</strong></td>
            <td style="padding: 8px 0;"><strong>${formatCurrency(data.refundAmount, data.currency)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top;"><strong>Reason:</strong></td>
            <td style="padding: 8px 0;">${data.reason}</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center;">
        <a href="${refundUrl}" class="button">Review Refund Request</a>
      </p>

      <p>Please review and process this request promptly.</p>
    `;

    const html = wrapInEmailTemplate(emailContent, 'New Refund Request');

    try {
      const sent = await sendNotificationEmail({
        to: data.adminEmail,
        subject: `Refund Request: ${data.bookingReference} - ${formatCurrency(data.refundAmount, data.currency)}`,
        html,
      });

      if (sent) {
        logger.info('Refund request email sent to admin (fallback)', {
          refundId: data.refundId,
          adminEmail: data.adminEmail,
        });
      }

      return sent;
    } catch (error) {
      logger.error('Failed to send refund request email to admin', {
        error,
        refundId: data.refundId,
      });
      return false;
    }
  }
}

/**
 * Send refund approved notification to guest
 */
export async function sendRefundApprovedEmailToGuest(data: {
  guestEmail: string;
  guestName: string;
  bookingReference: string;
  approvedAmount: number;
  currency: string;
  refundId: string;
}): Promise<boolean> {
  const refundUrl = `${getFrontendUrl()}/guest/refunds/${data.refundId}`;

  // Try template-based sending first
  try {
    logger.info('[REFUND_EMAILS] Attempting template-based send for refund_approved');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'refund_approved',
      recipient_email: data.guestEmail,
      variables: {
        guest_name: data.guestName,
        booking_reference: data.bookingReference,
        approved_amount: formatCurrency(data.approvedAmount, data.currency),
        refund_url: refundUrl,
      },
      context_type: 'refund',
      context_id: data.refundId,
    });

    logger.info('Refund approved email sent to guest (template-based)', {
      refundId: data.refundId,
      guestEmail: data.guestEmail,
    });
    return true;
  } catch (templateError) {
    logger.warn('[REFUND_EMAILS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    const emailContent = `
    <h1 style="color: #047857;">✅ Refund Approved</h1>
    <p>Hi ${data.guestName},</p>
    <p>Good news! Your refund request for booking <strong>${data.bookingReference}</strong> has been approved.</p>

    <div style="background-color: #d1fae5; border-left: 4px solid #047857; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;">
        <strong>Approved Amount:</strong> ${formatCurrency(data.approvedAmount, data.currency)}
      </p>
    </div>

    <p>The refund is now being processed and will be returned to your original payment method within 5-10 business days.</p>

    <p style="text-align: center;">
      <a href="${refundUrl}" class="button">View Refund Status</a>
    </p>

    <p>You will receive another email when the refund is completed.</p>

    <p>Thank you for your patience!</p>
  `;

    const html = wrapInEmailTemplate(emailContent, 'Refund Approved');

    try {
      const sent = await sendNotificationEmail({
        to: data.guestEmail,
        subject: `Refund Approved - ${data.bookingReference}`,
        html,
      });

      if (sent) {
        logger.info('Refund approved email sent to guest (fallback)', {
          refundId: data.refundId,
          guestEmail: data.guestEmail,
        });
      }

      return sent;
    } catch (error) {
      logger.error('Failed to send refund approved email to guest', {
        error,
        refundId: data.refundId,
      });
      return false;
    }
  }
}

/**
 * Send refund rejected notification to guest
 */
export async function sendRefundRejectedEmailToGuest(data: {
  guestEmail: string;
  guestName: string;
  bookingReference: string;
  rejectionReason: string;
  refundId: string;
}): Promise<boolean> {
  const refundUrl = `${getFrontendUrl()}/guest/refunds/${data.refundId}`;

  // Try template-based sending first
  try {
    logger.info('[REFUND_EMAILS] Attempting template-based send for refund_rejected');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'refund_rejected',
      recipient_email: data.guestEmail,
      variables: {
        guest_name: data.guestName,
        booking_reference: data.bookingReference,
        rejection_reason: data.rejectionReason,
        refund_url: refundUrl,
      },
      context_type: 'refund',
      context_id: data.refundId,
    });

    logger.info('Refund rejected email sent to guest (template-based)', {
      refundId: data.refundId,
      guestEmail: data.guestEmail,
    });
    return true;
  } catch (templateError) {
    logger.warn('[REFUND_EMAILS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    const emailContent = `
    <h1>Refund Request Update</h1>
    <p>Hi ${data.guestName},</p>
    <p>We've reviewed your refund request for booking <strong>${data.bookingReference}</strong>.</p>

    <p>Unfortunately, we're unable to approve this refund at this time.</p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #78350f;">
        <strong>Reason:</strong><br>
        ${data.rejectionReason}
      </p>
    </div>

    <p>If you have any questions or would like to discuss this further, please don't hesitate to contact us.</p>

    <p style="text-align: center;">
      <a href="${refundUrl}" class="button">View Details</a>
    </p>

    <p>We appreciate your understanding.</p>
  `;

    const html = wrapInEmailTemplate(emailContent, 'Refund Request Update');

    try {
      const sent = await sendNotificationEmail({
        to: data.guestEmail,
        subject: `Refund Request Update - ${data.bookingReference}`,
        html,
      });

      if (sent) {
        logger.info('Refund rejected email sent to guest (fallback)', {
          refundId: data.refundId,
          guestEmail: data.guestEmail,
        });
      }

      return sent;
    } catch (error) {
      logger.error('Failed to send refund rejected email to guest', {
        error,
        refundId: data.refundId,
      });
      return false;
    }
  }
}

/**
 * Send refund completed notification to guest
 */
export async function sendRefundCompletedEmailToGuest(data: {
  guestEmail: string;
  guestName: string;
  bookingReference: string;
  refundedAmount: number;
  currency: string;
  refundId: string;
}): Promise<boolean> {
  const refundUrl = `${getFrontendUrl()}/guest/refunds/${data.refundId}`;

  // Try template-based sending first
  try {
    logger.info('[REFUND_EMAILS] Attempting template-based send for refund_completed');
    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'refund_completed',
      recipient_email: data.guestEmail,
      variables: {
        guest_name: data.guestName,
        booking_reference: data.bookingReference,
        refunded_amount: formatCurrency(data.refundedAmount, data.currency),
        refund_url: refundUrl,
      },
      context_type: 'refund',
      context_id: data.refundId,
    });

    logger.info('Refund completed email sent to guest (template-based)', {
      refundId: data.refundId,
      guestEmail: data.guestEmail,
    });
    return true;
  } catch (templateError) {
    logger.warn('[REFUND_EMAILS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    const emailContent = `
    <h1 style="color: #047857;">✅ Refund Completed</h1>
    <p>Hi ${data.guestName},</p>
    <p>Your refund for booking <strong>${data.bookingReference}</strong> has been successfully processed!</p>

    <div style="background-color: #d1fae5; border-left: 4px solid #047857; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;">
        <strong>Refunded Amount:</strong> ${formatCurrency(data.refundedAmount, data.currency)}
      </p>
    </div>

    <p>The funds have been returned to your original payment method and should appear in your account within:</p>
    <ul>
      <li><strong>Credit/Debit Card:</strong> 5-10 business days</li>
      <li><strong>Bank Transfer:</strong> 3-5 business days</li>
      <li><strong>Other methods:</strong> As per provider policy</li>
    </ul>

    <p style="text-align: center;">
      <a href="${refundUrl}" class="button">View Refund Receipt</a>
    </p>

    <p>If you have any questions, please don't hesitate to contact us.</p>

    <p>Thank you!</p>
  `;

    const html = wrapInEmailTemplate(emailContent, 'Refund Completed');

    try {
      const sent = await sendNotificationEmail({
        to: data.guestEmail,
        subject: `Refund Completed - ${data.bookingReference}`,
        html,
      });

      if (sent) {
        logger.info('Refund completed email sent to guest (fallback)', {
          refundId: data.refundId,
          guestEmail: data.guestEmail,
        });
      }

      return sent;
    } catch (error) {
      logger.error('Failed to send refund completed email to guest', {
        error,
        refundId: data.refundId,
      });
      return false;
    }
  }
}
