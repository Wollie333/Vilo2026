/**
 * Booking Notifications Service
 *
 * Handles sending notifications for booking-related events.
 * Integrates with the main notification system.
 *
 * NOTE: This service uses database templates with fallback to hardcoded templates.
 * Try template-based sending first, fallback to hardcoded on error.
 */

import { createNotification } from './notifications.service';
import { sendNotificationEmail, wrapInEmailTemplate } from './email.service';
import * as emailTemplateService from './email-template.service';
import { logger } from '../utils/logger';
import type { BookingWithDetails } from '../types/booking.types';

// ============================================================================
// Types
// ============================================================================

interface BookingNotificationData {
  booking: BookingWithDetails;
  recipientUserId?: string;
  recipientEmail?: string;
  recipientName?: string;
}

// ============================================================================
// Email Templates
// ============================================================================

const getBookingConfirmationEmailHtml = (booking: BookingWithDetails, temporaryPassword?: string | null): string => {
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #047857; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Booking Confirmed</h1>
      </div>

      <div style="padding: 20px; background-color: #f9fafb;">
        <p>Dear ${booking.guest_name},</p>

        <p>Your booking has been confirmed! Here are your reservation details:</p>

        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #047857; margin-top: 0;">Booking Reference: ${booking.booking_reference}</h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>Property:</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                ${booking.property?.name || 'Property'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>Check-in:</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                ${formatDate(booking.check_in_date)} (from 2:00 PM)
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>Check-out:</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                ${formatDate(booking.check_out_date)} (before 10:00 AM)
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>Nights:</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                ${booking.total_nights}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>Guests:</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                ${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${booking.children > 0 ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <strong>Total:</strong>
              </td>
              <td style="padding: 10px 0; font-size: 18px; font-weight: bold; color: #047857;">
                ${formatCurrency(booking.total_amount, booking.currency)}
              </td>
            </tr>
          </table>
        </div>

        ${booking.special_requests ? `
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <strong>Special Requests:</strong>
          <p style="margin: 5px 0 0 0;">${booking.special_requests}</p>
        </div>
        ` : ''}

        ${temporaryPassword ? `
        <div style="background-color: #dbeafe; border-left: 4px solid #047857; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #047857; margin-top: 0;">Your Guest Account</h3>
          <p style="margin: 10px 0;">We've created a guest account so you can manage your booking online.</p>

          <div style="background-color: white; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${booking.guest_email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${temporaryPassword}</code></p>
          </div>

          <p style="margin: 15px 0 10px 0;"><strong>To access your booking:</strong></p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Visit <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="color: #047857; text-decoration: none;">Vilo Guest Portal</a></li>
            <li>Log in with your email and temporary password</li>
            <li>Set a new password for security</li>
            <li>View and manage your bookings</li>
          </ol>

          <p style="margin-top: 15px; font-size: 12px; color: #6b7280;">
            <strong>Important:</strong> Please change your password after your first login for security.
          </p>
        </div>
        ` : ''}

        <p>If you have any questions, please don't hesitate to contact us.</p>

        <p>We look forward to hosting you!</p>

        <p>Best regards,<br>The Vilo Team</p>
      </div>

      <div style="background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Vilo.</p>
        <p style="margin: 10px 0 0 0;">Booking Reference: ${booking.booking_reference}</p>
      </div>
    </div>
  `;
};

const getBookingCancellationEmailHtml = (booking: BookingWithDetails, reason?: string): string => {
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Booking Cancelled</h1>
      </div>

      <div style="padding: 20px; background-color: #f9fafb;">
        <p>Dear ${booking.guest_name},</p>

        <p>Your booking has been cancelled. Here are the details:</p>

        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #dc2626; margin-top: 0;">Booking Reference: ${booking.booking_reference}</h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>Property:</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                ${booking.property?.name || 'Property'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>Original dates:</strong>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                ${formatDate(booking.check_in_date)} - ${formatDate(booking.check_out_date)}
              </td>
            </tr>
          </table>
        </div>

        ${reason ? `
        <div style="background-color: #fef2f2; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <strong>Reason for cancellation:</strong>
          <p style="margin: 5px 0 0 0;">${reason}</p>
        </div>
        ` : ''}

        <p>If you have any questions about this cancellation or would like to rebook, please contact us.</p>

        <p>Best regards,<br>The Vilo Team</p>
      </div>

      <div style="background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from Vilo.</p>
      </div>
    </div>
  `;
};

const getNewBookingHostEmailHtml = (booking: BookingWithDetails): string => {
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-ZA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #047857; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Booking Received</h1>
      </div>

      <div style="padding: 20px; background-color: #f9fafb;">
        <p>You have received a new booking!</p>

        <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #047857; margin-top: 0;">${booking.booking_reference}</h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Guest:</strong></td>
              <td style="padding: 8px 0;">${booking.guest_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0;">${booking.guest_email}</td>
            </tr>
            ${booking.guest_phone ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0;">${booking.guest_phone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0;"><strong>Property:</strong></td>
              <td style="padding: 8px 0;">${booking.property?.name || 'Property'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Dates:</strong></td>
              <td style="padding: 8px 0;">${formatDate(booking.check_in_date)} - ${formatDate(booking.check_out_date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Guests:</strong></td>
              <td style="padding: 8px 0;">${booking.adults + booking.children}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Total:</strong></td>
              <td style="padding: 8px 0; font-weight: bold;">${formatCurrency(booking.total_amount, booking.currency)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Status:</strong></td>
              <td style="padding: 8px 0;">${booking.booking_status}</td>
            </tr>
          </table>
        </div>

        ${booking.special_requests ? `
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <strong>Special Requests:</strong>
          <p style="margin: 5px 0 0 0;">${booking.special_requests}</p>
        </div>
        ` : ''}

        <p>
          <a href="${process.env.APP_URL || 'https://vilo.app'}/bookings/${booking.id}"
             style="display: inline-block; background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Booking
          </a>
        </p>
      </div>
    </div>
  `;
};

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Send booking confirmation email to guest
 */
export const sendBookingConfirmationEmail = async (
  booking: BookingWithDetails,
  temporaryPassword?: string | null
): Promise<void> => {
  const templateKey = temporaryPassword ? 'booking_confirmation_temp_password' : 'booking_confirmation';

  // Try template-based sending first
  try {
    logger.info(`[BOOKING_NOTIFICATIONS] Attempting template-based send for ${templateKey}`);

    const formatCurrency = (amount: number, currency: string = 'ZAR') => {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
      }).format(amount);
    };

    await emailTemplateService.sendEmailFromTemplate({
      template_key: templateKey,
      recipient_email: booking.guest_email,
      variables: {
        guest_name: booking.guest_name,
        booking_reference: booking.booking_reference,
        property_name: booking.property?.name || 'Property',
        check_in_date: new Date(booking.check_in_date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        check_out_date: new Date(booking.check_out_date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        total_nights: booking.total_nights.toString(),
        adults: booking.adults.toString(),
        children: booking.children.toString(),
        total_amount: formatCurrency(booking.total_amount, booking.currency),
        temporary_password: temporaryPassword || '',
      },
      context_type: 'booking',
      context_id: booking.id,
    });

    logger.info('Booking confirmation email sent (template-based)', {
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      guestEmail: booking.guest_email,
      isNewGuestAccount: !!temporaryPassword,
    });
  } catch (templateError) {
    logger.warn('[BOOKING_NOTIFICATIONS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    try {
      const htmlContent = getBookingConfirmationEmailHtml(booking, temporaryPassword);
      const wrappedHtml = wrapInEmailTemplate(htmlContent, `Booking Confirmed - ${booking.booking_reference}`);

      await sendNotificationEmail({
        to: booking.guest_email,
        subject: `Booking Confirmed - ${booking.booking_reference}`,
        html: wrappedHtml,
      });

      logger.info('Booking confirmation email sent (fallback)', {
        bookingId: booking.id,
        bookingReference: booking.booking_reference,
        guestEmail: booking.guest_email,
        isNewGuestAccount: !!temporaryPassword,
      });
    } catch (error) {
      logger.error('Failed to send booking confirmation email', {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};

/**
 * Send booking cancellation email to guest
 */
export const sendBookingCancellationEmail = async (
  booking: BookingWithDetails,
  reason?: string
): Promise<void> => {
  // Try template-based sending first
  try {
    logger.info('[BOOKING_NOTIFICATIONS] Attempting template-based send for booking_cancelled');

    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'booking_cancelled',
      recipient_email: booking.guest_email,
      variables: {
        guest_name: booking.guest_name,
        booking_reference: booking.booking_reference,
        property_name: booking.property?.name || 'Property',
        check_in_date: new Date(booking.check_in_date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        check_out_date: new Date(booking.check_out_date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        cancellation_reason: reason || '',
      },
      context_type: 'booking',
      context_id: booking.id,
    });

    logger.info('Booking cancellation email sent (template-based)', {
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      guestEmail: booking.guest_email,
    });
  } catch (templateError) {
    logger.warn('[BOOKING_NOTIFICATIONS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    try {
      const htmlContent = getBookingCancellationEmailHtml(booking, reason);
      const wrappedHtml = wrapInEmailTemplate(htmlContent, `Booking Cancelled - ${booking.booking_reference}`);

      await sendNotificationEmail({
        to: booking.guest_email,
        subject: `Booking Cancelled - ${booking.booking_reference}`,
        html: wrappedHtml,
      });

      logger.info('Booking cancellation email sent (fallback)', {
        bookingId: booking.id,
        bookingReference: booking.booking_reference,
        guestEmail: booking.guest_email,
      });
    } catch (error) {
      logger.error('Failed to send booking cancellation email', {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};

/**
 * Notify host of new booking
 */
export const notifyHostNewBooking = async (
  booking: BookingWithDetails,
  hostUserId: string,
  hostEmail?: string
): Promise<void> => {
  try {
    // Create in-app notification for host
    await createNotification({
      user_id: hostUserId,
      title: 'New Booking Received',
      message: `${booking.guest_name} has made a booking for ${booking.property?.name || 'your property'} from ${new Date(booking.check_in_date).toLocaleDateString()}`,
      variant: 'success',
      priority: 'normal',
      action_url: `/bookings/${booking.id}`,
      action_label: 'View Booking',
      data: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        guest_name: booking.guest_name,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        total_amount: booking.total_amount,
      },
    });

    // Send email notification to host if email provided
    if (hostEmail) {
      const htmlContent = getNewBookingHostEmailHtml(booking);
      const wrappedHtml = wrapInEmailTemplate(htmlContent, `New Booking - ${booking.booking_reference}`);

      await sendNotificationEmail({
        to: hostEmail,
        subject: `New Booking - ${booking.booking_reference}`,
        html: wrappedHtml,
      });
    }

    logger.info('Host notified of new booking', {
      bookingId: booking.id,
      hostUserId,
    });
  } catch (error) {
    logger.error('Failed to notify host of new booking', {
      bookingId: booking.id,
      hostUserId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Notify host of booking cancellation
 */
export const notifyHostBookingCancellation = async (
  booking: BookingWithDetails,
  hostUserId: string,
  reason?: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: hostUserId,
      title: 'Booking Cancelled',
      message: `Booking ${booking.booking_reference} by ${booking.guest_name} has been cancelled${reason ? `: ${reason}` : ''}`,
      variant: 'warning',
      priority: 'normal',
      action_url: `/bookings/${booking.id}`,
      action_label: 'View Details',
      data: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        guest_name: booking.guest_name,
        cancellation_reason: reason,
      },
    });

    logger.info('Host notified of booking cancellation', {
      bookingId: booking.id,
      hostUserId,
    });
  } catch (error) {
    logger.error('Failed to notify host of booking cancellation', {
      bookingId: booking.id,
      hostUserId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Send check-in reminder to guest
 */
export const sendCheckInReminder = async (
  booking: BookingWithDetails,
  daysUntilCheckIn: number
): Promise<void> => {
  // Try template-based sending first
  try {
    logger.info('[BOOKING_NOTIFICATIONS] Attempting template-based send for booking_checkin_reminder');

    await emailTemplateService.sendEmailFromTemplate({
      template_key: 'booking_checkin_reminder',
      recipient_email: booking.guest_email,
      variables: {
        guest_name: booking.guest_name,
        booking_reference: booking.booking_reference,
        property_name: booking.property?.name || 'our property',
        check_in_date: new Date(booking.check_in_date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' }),
        check_out_date: new Date(booking.check_out_date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' }),
        days_until_checkin: daysUntilCheckIn.toString(),
      },
      context_type: 'booking',
      context_id: booking.id,
    });

    logger.info('Check-in reminder sent (template-based)', {
      bookingId: booking.id,
      daysUntilCheckIn,
    });
  } catch (templateError) {
    logger.warn('[BOOKING_NOTIFICATIONS] Template-based send failed, using fallback', { error: templateError });

    // Fallback to hardcoded template
    try {
      const subject = daysUntilCheckIn === 0
        ? `Check-in Today - ${booking.booking_reference}`
        : `Check-in Reminder - ${daysUntilCheckIn} day${daysUntilCheckIn !== 1 ? 's' : ''} until your stay`;

      // Simple reminder email
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #047857; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${daysUntilCheckIn === 0 ? 'Check-in Today!' : 'Upcoming Stay Reminder'}</h1>
          </div>

          <div style="padding: 20px; background-color: #f9fafb;">
            <p>Dear ${booking.guest_name},</p>

            <p>${daysUntilCheckIn === 0
              ? 'Your check-in is today!'
              : `Just a reminder that your stay at ${booking.property?.name || 'our property'} is coming up in ${daysUntilCheckIn} day${daysUntilCheckIn !== 1 ? 's' : ''}.`
            }</p>

            <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
              <p><strong>Check-in:</strong> ${new Date(booking.check_in_date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })} from 2:00 PM</p>
              <p><strong>Check-out:</strong> ${new Date(booking.check_out_date).toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })} before 10:00 AM</p>
            </div>

            <p>We look forward to hosting you!</p>

            <p>Best regards,<br>The Vilo Team</p>
          </div>
        </div>
      `;

      const wrappedHtml = wrapInEmailTemplate(htmlContent, subject);

      await sendNotificationEmail({
        to: booking.guest_email,
        subject,
        html: wrappedHtml,
      });

      logger.info('Check-in reminder sent (fallback)', {
        bookingId: booking.id,
        daysUntilCheckIn,
      });
    } catch (error) {
      logger.error('Failed to send check-in reminder', {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};

/**
 * Send payment received notification
 */
export const notifyPaymentReceived = async (
  booking: BookingWithDetails,
  amount: number,
  hostUserId: string
): Promise<void> => {
  try {
    const formatCurrency = (amt: number, currency: string = 'ZAR') => {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
      }).format(amt);
    };

    await createNotification({
      user_id: hostUserId,
      title: 'Payment Received',
      message: `Payment of ${formatCurrency(amount, booking.currency)} received for booking ${booking.booking_reference}`,
      variant: 'success',
      priority: 'normal',
      action_url: `/bookings/${booking.id}`,
      action_label: 'View Booking',
      data: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        amount,
        currency: booking.currency,
      },
    });

    logger.info('Payment notification sent to host', {
      bookingId: booking.id,
      amount,
      hostUserId,
    });
  } catch (error) {
    logger.error('Failed to send payment notification', {
      bookingId: booking.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
