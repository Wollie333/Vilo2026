/**
 * NotificationSettingsTab Component
 * FEATURE-03: Notification System (User Preferences)
 *
 * Tab content for managing notification preferences within the Profile page.
 */

import React from 'react';
import { NotificationSettings } from '@/components/features';
import { useNotificationPreferences } from '@/hooks';

export const NotificationSettingsTab: React.FC = () => {
  const {
    preferences,
    isLoading,
    isSaving,
    error,
    togglePreference,
    resetToDefaults,
  } = useNotificationPreferences();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <NotificationSettings
          preferences={preferences}
          onToggle={togglePreference}
          onResetToDefaults={resetToDefaults}
          isLoading={isLoading}
          isSaving={isSaving}
          error={error}
        />
      </div>
    </div>
  );
};
