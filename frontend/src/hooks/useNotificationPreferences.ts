/**
 * useNotificationPreferences Hook
 * FEATURE-03: Notification System (User Preferences)
 *
 * React hook for managing notification preferences state and operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationPreferencesService } from '@/services/notification-preferences.service';
import type {
  NotificationPreferenceGroup,
  NotificationChannel,
  UseNotificationPreferencesReturn,
} from '@/types/notification.types';

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferenceGroup[]>([]);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all preferences from API
   * @param silent - If true, don't show loading state (used for error recovery)
   */
  const fetchPreferences = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await notificationPreferencesService.getPreferences();
      setPreferences(response.preferences);
      setTotalTemplates(response.total_templates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(message);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Toggle a single preference
   */
  const togglePreference = useCallback(
    async (templateId: string, channel: NotificationChannel, enabled: boolean) => {
      setIsSaving(true);
      setError(null);

      // Optimistic update
      setPreferences((prev) =>
        prev.map((group) => ({
          ...group,
          templates: group.templates.map((template) =>
            template.template_id === templateId
              ? {
                  ...template,
                  [channel === 'email'
                    ? 'email_enabled'
                    : channel === 'in_app'
                      ? 'in_app_enabled'
                      : 'push_enabled']: enabled,
                }
              : template
          ),
        }))
      );

      try {
        await notificationPreferencesService.togglePreference({
          template_id: templateId,
          channel,
          enabled,
        });
        // Success - clear any previous error
        setError(null);
      } catch (err) {
        // Revert optimistic update on error
        const message = err instanceof Error ? err.message : 'Failed to update preference';
        setError(message);
        // Silently refetch to restore correct state (no loading spinner)
        await fetchPreferences(true);
        // Re-throw so caller can handle (e.g., show toast)
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [fetchPreferences]
  );

  /**
   * Reset all preferences to defaults
   */
  const resetToDefaults = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await notificationPreferencesService.resetToDefaults();
      // Refetch to get default values
      await fetchPreferences();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset preferences';
      setError(message);
      // Re-throw so caller can handle (e.g., show toast)
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [fetchPreferences]);

  /**
   * Refetch preferences
   */
  const refetch = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    totalTemplates,
    isLoading,
    isSaving,
    error,
    togglePreference,
    resetToDefaults,
    refetch,
  };
}
