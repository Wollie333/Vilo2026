/**
 * Notification Preferences Service (Frontend)
 * FEATURE-03: Notification System (User Preferences)
 *
 * API client for notification preference endpoints.
 */

import { api } from './api.service';
import type {
  NotificationPreferencesResponse,
  TogglePreferenceRequest,
  BulkUpdatePreferencesRequest,
  UpdatePreferencesResponse,
  ResetPreferencesResponse,
} from '@/types/notification.types';

class NotificationPreferencesService {
  private basePath = '/notification-preferences';

  /**
   * Get all notification preferences for current user, grouped by type
   */
  async getPreferences(): Promise<NotificationPreferencesResponse> {
    const response = await api.get<NotificationPreferencesResponse>(this.basePath);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch notification preferences');
    }

    return response.data;
  }

  /**
   * Toggle a single preference (template + channel + enabled)
   */
  async togglePreference(request: TogglePreferenceRequest): Promise<UpdatePreferencesResponse> {
    const response = await api.patch<UpdatePreferencesResponse>(this.basePath, request);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update preference');
    }

    return response.data;
  }

  /**
   * Bulk update multiple preferences
   */
  async bulkUpdate(request: BulkUpdatePreferencesRequest): Promise<UpdatePreferencesResponse> {
    const response = await api.put<UpdatePreferencesResponse>(`${this.basePath}/bulk`, request);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update preferences');
    }

    return response.data;
  }

  /**
   * Reset all preferences to defaults
   */
  async resetToDefaults(): Promise<ResetPreferencesResponse> {
    const response = await api.delete<ResetPreferencesResponse>(this.basePath);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to reset preferences');
    }

    return response.data;
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
