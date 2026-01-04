/**
 * Notifications Service
 * FEATURE-03: Notification System
 *
 * Core business logic for creating, managing, and delivering notifications.
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { sendNotificationEmail, wrapInEmailTemplate } from './email.service';
import { shouldSendNotification } from './notification-preferences.service';
import type {
  Notification,
  NotificationWithType,
  NotificationTemplate,
  NotificationListParams,
  NotificationListResponse,
  CreateNotificationRequest,
  BulkNotificationRequest,
  NotificationStats,
  BulkOperationResult,
  MarkReadResult,
  CleanupResult,
} from '../types/notification.types';

// ============================================================================
// Create Notifications
// ============================================================================

/**
 * Create a single notification
 */
export const createNotification = async (
  request: CreateNotificationRequest,
  actorId?: string
): Promise<NotificationWithType> => {
  const supabase = getAdminClient();

  let title = request.title;
  let message = request.message;
  let variant = request.variant;
  let notificationTypeId = request.notification_type_id;
  let templateId: string | null = null;
  let priority = request.priority || 'normal';

  // If using template, resolve it
  if (request.template_name) {
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*, notification_type:notification_types(*)')
      .eq('name', request.template_name)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new AppError('NOT_FOUND', `Template '${request.template_name}' not found`);
    }

    templateId = template.id;
    notificationTypeId = template.notification_type_id;
    priority = request.priority || template.default_priority;
    variant = request.variant || template.default_variant;

    // Render template with data
    title = title || renderTemplate(template.title_template, request.data || {});
    message = message || renderTemplate(template.message_template, request.data || {});
  }

  if (!title || !message) {
    throw new AppError('BAD_REQUEST', 'Title and message are required');
  }

  const userId = request.user_id || actorId;
  if (!userId) {
    throw new AppError('BAD_REQUEST', 'User ID is required');
  }

  // Create the notification
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      notification_type_id: notificationTypeId,
      template_id: templateId,
      title,
      message,
      variant: variant || 'info',
      data: request.data || {},
      priority,
      action_url: request.action_url,
      action_label: request.action_label,
      expires_at: request.expires_at,
    })
    .select(
      `
      *,
      notification_type:notification_types(*)
    `
    )
    .single();

  if (error || !notification) {
    logger.error('Failed to create notification', { error, request });
    throw new AppError('INTERNAL_ERROR', 'Failed to create notification');
  }

  // Send email if requested
  if (request.send_email) {
    await sendEmailForNotification(notification, request.template_name, request.data);
  }

  return notification;
};

/**
 * Create notifications for multiple users (bulk)
 */
export const createBulkNotifications = async (
  request: BulkNotificationRequest,
  actorId: string
): Promise<BulkOperationResult> => {
  const results: BulkOperationResult = { created: 0, failed: 0 };

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < request.user_ids.length; i += batchSize) {
    const batch = request.user_ids.slice(i, i + batchSize);

    const promises = batch.map(async (userId) => {
      try {
        await createNotification(
          {
            ...request,
            user_id: userId,
          },
          actorId
        );
        results.created++;
      } catch (error) {
        logger.error('Failed to create bulk notification', { userId, error });
        results.failed++;
      }
    });

    await Promise.all(promises);
  }

  logger.info('Bulk notifications created', { created: results.created, failed: results.failed });
  return results;
};

/**
 * Notify all users with a specific role
 */
export const notifyUsersByRole = async (
  roleName: string,
  request: Omit<BulkNotificationRequest, 'user_ids'>,
  actorId: string
): Promise<BulkOperationResult> => {
  const supabase = getAdminClient();

  // Get the role
  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (!role) {
    throw new AppError('NOT_FOUND', `Role '${roleName}' not found`);
  }

  // Get all users with that role
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role_id', role.id);

  if (!userRoles || userRoles.length === 0) {
    logger.info('No users found with role', { roleName });
    return { created: 0, failed: 0 };
  }

  const userIds = userRoles.map((ur) => ur.user_id);
  logger.info('Notifying users by role', { roleName, userCount: userIds.length });

  return createBulkNotifications({ ...request, user_ids: userIds }, actorId);
};

// ============================================================================
// Read Notifications
// ============================================================================

/**
 * Get user's notifications with pagination and filtering
 */
export const getUserNotifications = async (
  userId: string,
  params: NotificationListParams
): Promise<NotificationListResponse> => {
  const supabase = getAdminClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('notifications')
    .select(
      `
      *,
      notification_type:notification_types(*)
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId);

  // Apply filters
  if (params.read !== undefined) {
    query = query.eq('read', params.read);
  }

  if (params.type) {
    const { data: notifType } = await supabase
      .from('notification_types')
      .select('id')
      .eq('name', params.type)
      .single();
    if (notifType) {
      query = query.eq('notification_type_id', notifType.id);
    }
  }

  if (params.priority) {
    query = query.eq('priority', params.priority);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  // Filter out expired notifications
  query = query.or('expires_at.is.null,expires_at.gt.now()');

  // Apply sorting
  const sortBy = params.sortBy || 'created_at';
  const ascending = params.sortOrder === 'asc';

  if (sortBy === 'priority') {
    // Custom priority ordering: urgent > high > normal > low
    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
  } else {
    query = query.order(sortBy, { ascending });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: notifications, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch notifications', { error, userId });
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch notifications');
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
    .or('expires_at.is.null,expires_at.gt.now()');

  const total = count || 0;

  return {
    notifications: notifications || [],
    total,
    unread_count: unreadCount || 0,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a single notification by ID
 */
export const getNotification = async (
  notificationId: string,
  userId: string
): Promise<NotificationWithType> => {
  const supabase = getAdminClient();

  const { data: notification, error } = await supabase
    .from('notifications')
    .select(
      `
      *,
      notification_type:notification_types(*)
    `
    )
    .eq('id', notificationId)
    .eq('user_id', userId)
    .single();

  if (error || !notification) {
    throw new AppError('NOT_FOUND', 'Notification not found');
  }

  return notification;
};

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = async (userId: string): Promise<NotificationStats> => {
  const supabase = getAdminClient();

  // Get total count
  const { count: total } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.now()');

  // Get unread count
  const { count: unread } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
    .or('expires_at.is.null,expires_at.gt.now()');

  // Get counts by type
  const { data: typeGroups } = await supabase
    .from('notifications')
    .select(
      `
      notification_type:notification_types(name)
    `
    )
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.now()');

  const byType: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeGroups?.forEach((n: any) => {
    const typeName = n.notification_type?.name || 'unknown';
    byType[typeName] = (byType[typeName] || 0) + 1;
  });

  // Get counts by priority
  const { data: priorityGroups } = await supabase
    .from('notifications')
    .select('priority')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.now()');

  const byPriority: Record<string, number> = { low: 0, normal: 0, high: 0, urgent: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  priorityGroups?.forEach((n: any) => {
    byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
  });

  return {
    total: total || 0,
    unread: unread || 0,
    by_type: byType,
    by_priority: byPriority as Record<'low' | 'normal' | 'high' | 'urgent', number>,
  };
};

// ============================================================================
// Update Notifications
// ============================================================================

/**
 * Mark notification(s) as read
 */
export const markAsRead = async (
  userId: string,
  notificationIds?: string[]
): Promise<MarkReadResult> => {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  let query = supabase
    .from('notifications')
    .update({ read: true, read_at: now, updated_at: now })
    .eq('user_id', userId)
    .eq('read', false);

  if (notificationIds && notificationIds.length > 0) {
    query = query.in('id', notificationIds);
  }

  const { data, error } = await query.select();

  if (error) {
    logger.error('Failed to mark notifications as read', { error, userId });
    throw new AppError('INTERNAL_ERROR', 'Failed to mark notifications as read');
  }

  return { updated: data?.length || 0 };
};

/**
 * Mark all notifications as read for user
 */
export const markAllAsRead = async (userId: string): Promise<MarkReadResult> => {
  return markAsRead(userId);
};

// ============================================================================
// Delete Notifications
// ============================================================================

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  const { error, count } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete notification', { error, notificationId });
    throw new AppError('INTERNAL_ERROR', 'Failed to delete notification');
  }

  if (count === 0) {
    throw new AppError('NOT_FOUND', 'Notification not found');
  }
};

/**
 * Delete all notifications for a user
 */
export const clearAllNotifications = async (userId: string): Promise<CleanupResult> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .select();

  if (error) {
    logger.error('Failed to clear notifications', { error, userId });
    throw new AppError('INTERNAL_ERROR', 'Failed to clear notifications');
  }

  return { deleted: data?.length || 0 };
};

/**
 * Cleanup expired notifications (can be run as a scheduled job)
 */
export const cleanupExpiredNotifications = async (): Promise<CleanupResult> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null)
    .select();

  if (error) {
    logger.error('Failed to cleanup expired notifications', { error });
    throw new AppError('INTERNAL_ERROR', 'Failed to cleanup expired notifications');
  }

  const deleted = data?.length || 0;
  if (deleted > 0) {
    logger.info(`Cleaned up ${deleted} expired notifications`);
  }

  return { deleted };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simple template rendering with {{placeholder}} syntax
 */
function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value ?? ''));
  }
  return result;
}

/**
 * Send email notification if user preferences allow
 */
async function sendEmailForNotification(
  notification: NotificationWithType,
  templateName?: string,
  data?: Record<string, unknown>
): Promise<void> {
  const supabase = getAdminClient();

  try {
    // Check per-template email preference if template is used
    if (templateName) {
      const shouldSend = await shouldSendNotification(
        notification.user_id,
        templateName,
        'email'
      );

      if (!shouldSend) {
        logger.debug('Email notification disabled for template', {
          userId: notification.user_id,
          templateName,
        });
        return;
      }
    }

    // Get user's email
    const { data: user } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', notification.user_id)
      .single();

    if (!user || !user.email) {
      logger.warn('User not found or no email for notification', {
        userId: notification.user_id,
      });
      return;
    }

    // Get email template if using a template
    let emailSubject = notification.title;
    let emailBody = `<h1>${notification.title}</h1><p>${notification.message}</p>`;

    if (templateName) {
      const { data: template } = await supabase
        .from('notification_templates')
        .select('email_subject_template, email_body_template')
        .eq('name', templateName)
        .single();

      if (template?.email_subject_template) {
        emailSubject = renderTemplate(template.email_subject_template, data || {});
      }
      if (template?.email_body_template) {
        emailBody = renderTemplate(template.email_body_template, data || {});
      }
    }

    // Add action button if present
    if (notification.action_url) {
      emailBody += `
        <p style="margin-top: 24px;">
          <a href="${notification.action_url}" class="button" style="background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            ${notification.action_label || 'View Details'}
          </a>
        </p>
      `;
    }

    // Wrap in email template
    const wrappedBody = wrapInEmailTemplate(emailBody, emailSubject);

    // Send the email
    const sent = await sendNotificationEmail({
      to: user.email,
      subject: emailSubject,
      html: wrappedBody,
    });

    // Update notification to mark email as sent
    if (sent) {
      await supabase
        .from('notifications')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);
    }
  } catch (error) {
    logger.error('Failed to send notification email', {
      error,
      notificationId: notification.id,
    });
    // Don't throw - email failure shouldn't fail notification creation
  }
}
