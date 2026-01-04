/**
 * Notifications Routes
 * FEATURE-03: Notification System
 *
 * Route definitions for notification endpoints.
 */

import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import {
  authenticate,
  loadUserProfile,
  requirePermission,
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware';
import {
  notificationIdParamSchema,
  notificationListQuerySchema,
  createNotificationSchema,
  bulkNotificationSchema,
  markReadSchema,
  notifyByRoleSchema,
} from '../validators/notification.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// User Routes (own notifications)
// ============================================================================

// GET /api/notifications - List user's notifications
router.get(
  '/',
  validateQuery(notificationListQuerySchema),
  notificationsController.listNotifications
);

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', notificationsController.getStats);

// GET /api/notifications/:id - Get single notification
router.get(
  '/:id',
  validateParams(notificationIdParamSchema),
  notificationsController.getNotification
);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', notificationsController.markAllAsRead);

// PATCH /api/notifications/read - Mark multiple as read
router.patch(
  '/read',
  validateBody(markReadSchema),
  notificationsController.markMultipleAsRead
);

// PATCH /api/notifications/:id/read - Mark single as read
router.patch(
  '/:id/read',
  validateParams(notificationIdParamSchema),
  notificationsController.markAsRead
);

// DELETE /api/notifications - Clear all notifications
router.delete('/', notificationsController.clearAllNotifications);

// DELETE /api/notifications/:id - Delete single notification
router.delete(
  '/:id',
  validateParams(notificationIdParamSchema),
  notificationsController.deleteNotification
);

// ============================================================================
// Admin Routes (create/manage notifications for others)
// ============================================================================

// POST /api/notifications - Create notification (admin)
router.post(
  '/',
  requirePermission('notifications', 'create'),
  validateBody(createNotificationSchema),
  notificationsController.createNotification
);

// POST /api/notifications/bulk - Bulk create notifications (admin)
router.post(
  '/bulk',
  requirePermission('notifications', 'create'),
  validateBody(bulkNotificationSchema),
  notificationsController.createBulkNotifications
);

// POST /api/notifications/notify-role - Notify users by role (admin)
router.post(
  '/notify-role',
  requirePermission('notifications', 'create'),
  validateBody(notifyByRoleSchema),
  notificationsController.notifyByRole
);

export default router;
