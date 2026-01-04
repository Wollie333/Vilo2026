/**
 * Email Service
 * FEATURE-03: Notification System
 *
 * Abstraction layer for sending emails through different providers:
 * - Supabase Edge Functions
 * - Resend
 * - SendGrid
 */

import { getAdminClient } from '../config/supabase';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { NotificationEmailOptions } from '../types/notification.types';

// ============================================================================
// Main Email Function
// ============================================================================

/**
 * Send notification email using configured provider
 * Returns true if email was sent successfully, false otherwise
 */
export const sendNotificationEmail = async (
  options: NotificationEmailOptions
): Promise<boolean> => {
  const provider = env.EMAIL_PROVIDER;

  if (provider === 'none') {
    logger.debug('Email provider not configured, skipping email send', {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }

  try {
    switch (provider) {
      case 'supabase':
        await sendViaSupabase(options);
        break;
      case 'resend':
        await sendViaResend(options);
        break;
      case 'sendgrid':
        await sendViaSendGrid(options);
        break;
      default:
        logger.warn('Unknown email provider', { provider });
        return false;
    }

    logger.info('Email sent successfully', {
      provider,
      to: options.to,
      subject: options.subject,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      error,
      provider,
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
};

// ============================================================================
// Provider Implementations
// ============================================================================

/**
 * Send via Supabase Edge Function
 * Requires a 'send-email' edge function deployed in Supabase
 */
async function sendViaSupabase(options: NotificationEmailOptions): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    },
  });

  if (error) {
    throw new Error(`Supabase email function error: ${error.message}`);
  }
}

/**
 * Send via Resend API
 * https://resend.com/docs/api-reference/emails/send-email
 */
async function sendViaResend(options: NotificationEmailOptions): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const fromEmail = env.EMAIL_FROM || 'noreply@vilo.app';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorText}`);
  }
}

/**
 * Send via SendGrid API
 * https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
async function sendViaSendGrid(options: NotificationEmailOptions): Promise<void> {
  const apiKey = env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  const fromEmail = env.EMAIL_FROM || 'noreply@vilo.app';

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: options.to }],
        },
      ],
      from: { email: fromEmail },
      subject: options.subject,
      content: [
        {
          type: 'text/plain',
          value: options.text || stripHtml(options.html),
        },
        {
          type: 'text/html',
          value: options.html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error (${response.status}): ${errorText}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Strip HTML tags to create plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Wrap content in a basic email template
 */
export function wrapInEmailTemplate(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Vilo Notification'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eee;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #047857;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      padding: 20px 0;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    h1 {
      color: #047857;
    }
    .button {
      display: inline-block;
      background-color: #047857;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Vilo</div>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} Vilo. All rights reserved.</p>
    <p>This is an automated notification. Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}
