/**
 * NotificationSettingsTab Component
 * FEATURE-03: Notification System (User Preferences)
 *
 * Tab content for managing notification preferences within the Profile page.
 */

import React, { useCallback } from 'react';
import { NotificationSettings } from '@/components/features';
import { useNotificationPreferences } from '@/hooks';
import { useToast } from '@/context/NotificationContext';
import type { NotificationChannel } from '@/types/notification.types';

export const NotificationSettingsTab: React.FC = () => {
  const {
    preferences,
    isLoading,
    isSaving,
    error,
    togglePreference,
    resetToDefaults,
  } = useNotificationPreferences();

  const { toast } = useToast();

  const handleToggle = useCallback(
    async (templateId: string, channel: NotificationChannel, enabled: boolean) => {
      try {
        await togglePreference(templateId, channel, enabled);
        toast({
          variant: 'success',
          title: 'Preference updated',
          message: `Notification ${enabled ? 'enabled' : 'disabled'} successfully`,
          duration: 3000,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update preference';
        toast({
          variant: 'error',
          title: 'Update failed',
          message,
          duration: 5000,
        });
      }
    },
    [togglePreference, toast]
  );

  const handleResetToDefaults = useCallback(async () => {
    try {
      await resetToDefaults();
      toast({
        variant: 'success',
        title: 'Preferences reset',
        message: 'All notification preferences have been reset to defaults',
        duration: 3000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset preferences';
      toast({
        variant: 'error',
        title: 'Reset failed',
        message,
        duration: 5000,
      });
    }
  }, [resetToDefaults, toast]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <NotificationSettings
          preferences={preferences}
          onToggle={handleToggle}
          onResetToDefaults={handleResetToDefaults}
          isLoading={isLoading}
          isSaving={isSaving}
          error={error}
        />
      </div>
    </div>
  );
};
