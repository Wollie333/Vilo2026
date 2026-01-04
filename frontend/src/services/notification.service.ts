/**
 * Notification Service (Frontend)
 * FEATURE-03: Notification System
 *
 * API client for notification endpoints.
 */

import { api } from './api.service';
import type {
  Notification,
  NotificationListParams,
  NotificationListResponse,
  NotificationStats,
  MarkReadResponse,
} from '@/types/notification.types';

class NotificationService {
  private basePath = '/api/notifications';

  /**
   * Get user's notifications with pagination and filtering
   */
  async getNotifications(params: NotificationListParams = {}): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.read !== undefined) queryParams.set('read', String(params.read));
    if (params.type) queryParams.set('type', params.type);
    if (params.priority) queryParams.set('priority', params.priority);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

    const response = await api.get<NotificationListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch notifications');
    }

    return response.data;
  }

  /**
   * Get a single notification by ID
   */
  async getNotification(id: string): Promise<Notification> {
    const response = await api.get<Notification>(`${this.basePath}/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch notification');
    }

    return response.data;
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    const response = await api.get<NotificationStats>(`${this.basePath}/stats`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch notification stats');
    }

    return response.data;
  }

  /**
   * Mark specific notification(s) as read
   */
  async markAsRead(notificationIds?: string[]): Promise<MarkReadResponse> {
    const response = await api.patch<MarkReadResponse>(`${this.basePath}/read`, {
      notification_ids: notificationIds,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark notifications as read');
    }

    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<MarkReadResponse> {
    const response = await api.patch<MarkReadResponse>(`${this.basePath}/read-all`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark all notifications as read');
    }

    return response.data;
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(id: string): Promise<void> {
    const response = await api.delete(`${this.basePath}/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete notification');
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    const response = await api.delete(this.basePath);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to clear notifications');
    }
  }
}

export const notificationService = new NotificationService();
