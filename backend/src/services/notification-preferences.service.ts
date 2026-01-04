/**
 * Notification Preferences Service
 * FEATURE-03: Notification System (User Preferences)
 *
 * Business logic for managing per-template notification channel preferences.
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import type {
  NotificationPreference,
  NotificationPreferenceWithTemplate,
  NotificationPreferencesGrouped,
  NotificationPreferencesResponse,
  NotificationChannel,
} from '../types/notification.types';

// ============================================================================
// Get Preferences
// ============================================================================

/**
 * Get all notification preferences for a user, grouped by type
 */
export const getUserPreferences = async (
  userId: string
): Promise<NotificationPreferencesResponse> => {
  const supabase = getAdminClient();

  // Use the database function that returns all templates with preferences
  const { data, error } = await supabase.rpc('get_user_notification_preferences', {
    p_user_id: userId,
  });

  if (error) {
    logger.error('Failed to get user notification preferences', { error, userId });
    throw new AppError('INTERNAL_ERROR', 'Failed to get notification preferences');
  }

  const preferences = data as NotificationPreferenceWithTemplate[];

  // Group by notification type
  const grouped = groupPreferencesByType(preferences);

  return {
    preferences: grouped,
    total_templates: preferences.length,
  };
};

/**
 * Check if a notification should be sent for a specific channel
 */
export const shouldSendNotification = async (
  userId: string,
  templateName: string,
  channel: NotificationChannel
): Promise<boolean> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc('should_send_notification', {
    p_user_id: userId,
    p_template_name: templateName,
    p_channel: channel,
  });

  if (error) {
    logger.error('Failed to check notification preference', { error, userId, templateName, channel });
    // Default to true if check fails - better to send than miss
    return true;
  }

  return data === true;
};

// ============================================================================
// Update Preferences
// ============================================================================

/**
 * Toggle a single preference (upsert)
 */
export const togglePreference = async (
  userId: string,
  templateId: string,
  channel: NotificationChannel,
  enabled: boolean
): Promise<NotificationPreference> => {
  const supabase = getAdminClient();

  // Build the upsert parameters
  const emailEnabled = channel === 'email' ? enabled : null;
  const inAppEnabled = channel === 'in_app' ? enabled : null;
  const pushEnabled = channel === 'push' ? enabled : null;

  // Use the database function for upsert
  const { data, error } = await supabase.rpc('upsert_notification_preference', {
    p_user_id: userId,
    p_template_id: templateId,
    p_email_enabled: emailEnabled,
    p_in_app_enabled: inAppEnabled,
    p_push_enabled: pushEnabled,
  });

  if (error) {
    logger.error('Failed to toggle notification preference', {
      error,
      userId,
      templateId,
      channel,
      enabled,
    });
    throw new AppError('INTERNAL_ERROR', 'Failed to update notification preference');
  }

  return data as NotificationPreference;
};

/**
 * Bulk update multiple preferences
 */
export const bulkUpdatePreferences = async (
  userId: string,
  preferences: {
    template_id: string;
    email_enabled?: boolean;
    in_app_enabled?: boolean;
    push_enabled?: boolean;
  }[]
): Promise<{ updated: number }> => {
  const supabase = getAdminClient();
  let updated = 0;

  // Process each preference
  for (const pref of preferences) {
    const { error } = await supabase.rpc('upsert_notification_preference', {
      p_user_id: userId,
      p_template_id: pref.template_id,
      p_email_enabled: pref.email_enabled ?? null,
      p_in_app_enabled: pref.in_app_enabled ?? null,
      p_push_enabled: pref.push_enabled ?? null,
    });

    if (error) {
      logger.warn('Failed to update preference in bulk', {
        error,
        userId,
        templateId: pref.template_id,
      });
    } else {
      updated++;
    }
  }

  logger.info('Bulk updated notification preferences', {
    userId,
    requested: preferences.length,
    updated,
  });

  return { updated };
};

// ============================================================================
// Reset Preferences
// ============================================================================

/**
 * Reset all preferences to defaults (delete all custom preferences)
 */
export const resetPreferences = async (userId: string): Promise<{ deleted: number }> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('notification_preferences')
    .delete()
    .eq('user_id', userId)
    .select();

  if (error) {
    logger.error('Failed to reset notification preferences', { error, userId });
    throw new AppError('INTERNAL_ERROR', 'Failed to reset notification preferences');
  }

  const deleted = data?.length || 0;
  logger.info('Reset notification preferences', { userId, deleted });

  return { deleted };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Group preferences by notification type
 */
function groupPreferencesByType(
  preferences: NotificationPreferenceWithTemplate[]
): NotificationPreferencesGrouped[] {
  const groupMap = new Map<string, NotificationPreferencesGrouped>();

  for (const pref of preferences) {
    const typeId = pref.type_id;

    if (!groupMap.has(typeId)) {
      groupMap.set(typeId, {
        type_id: typeId,
        type_name: pref.type_name,
        type_display_name: pref.type_display_name,
        type_icon: pref.type_icon,
        templates: [],
      });
    }

    const group = groupMap.get(typeId)!;
    group.templates.push({
      template_id: pref.template_id,
      template_name: pref.template_name,
      template_title: pref.template_title,
      email_enabled: pref.email_enabled,
      in_app_enabled: pref.in_app_enabled,
      push_enabled: pref.push_enabled,
    });
  }

  // Convert to array and sort by type_sort_order (via the original preferences order)
  const result = Array.from(groupMap.values());

  // Sort by type sort order (which came from the database)
  // Since preferences are already sorted by type_sort_order, maintain the order
  return result;
}
