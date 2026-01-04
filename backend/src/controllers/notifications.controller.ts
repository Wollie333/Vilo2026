/**
 * Notifications Controller
 * FEATURE-03: Notification System
 *
 * HTTP request handlers for notification endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as notificationsService from '../services/notifications.service';
import type { NotificationListParams } from '../types/notification.types';

// ============================================================================
// List & Get
// ============================================================================

/**
 * GET /api/notifications
 * List user's notifications with pagination and filtering
 */
export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await notificationsService.getUserNotifications(
      req.user!.id,
      req.query as unknown as NotificationListParams
    );

    sendSuccess(res, result, 200, {
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/stats
 * Get notification statistics for current user
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await notificationsService.getNotificationStats(req.user!.id);
    sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/:id
 * Get a single notification
 */
export const getNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await notificationsService.getNotification(
      req.params.id,
      req.user!.id
    );
    sendSuccess(res, { notification });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Create
// ============================================================================

/**
 * POST /api/notifications
 * Create a notification (admin only)
 */
export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await notificationsService.createNotification(
      req.body,
      req.user!.id
    );
    sendSuccess(
      res,
      { notification, message: 'Notification created successfully' },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/bulk
 * Create notifications for multiple users (admin only)
 */
export const createBulkNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await notificationsService.createBulkNotifications(
      req.body,
      req.user!.id
    );
    sendSuccess(
      res,
      {
        ...result,
        message: `Created ${result.created} notification(s)${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/notify-role
 * Notify all users with a specific role (admin only)
 */
export const notifyByRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role_name, ...notificationData } = req.body;
    const result = await notificationsService.notifyUsersByRole(
      role_name,
      notificationData,
      req.user!.id
    );
    sendSuccess(
      res,
      {
        ...result,
        message: `Notified ${result.created} user(s) with role '${role_name}'`,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Update
// ============================================================================

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await notificationsService.markAsRead(req.user!.id, [req.params.id]);
    sendSuccess(res, { ...result, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await notificationsService.markAllAsRead(req.user!.id);
    sendSuccess(res, { ...result, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read
 * Mark multiple notifications as read
 */
export const markMultipleAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { notification_ids } = req.body;
    const result = await notificationsService.markAsRead(req.user!.id, notification_ids);
    sendSuccess(res, { ...result, message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Delete
// ============================================================================

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await notificationsService.deleteNotification(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications
 * Clear all notifications for current user
 */
export const clearAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await notificationsService.clearAllNotifications(req.user!.id);
    sendSuccess(res, { ...result, message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
};
