/**
 * NotificationSettings Component
 * FEATURE-03: Notification System (User Preferences)
 *
 * Main component for displaying and managing notification preferences.
 */

import React from 'react';
import { Button, Spinner, Alert } from '@/components/ui';
import { PreferenceGroup } from './PreferenceGroup';
import type { NotificationSettingsProps } from './NotificationSettings.types';

// Inline SVG icon
const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  preferences,
  onToggle,
  onResetToDefaults,
  isLoading = false,
  isSaving = false,
  error = null,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="error" title="Error loading preferences">
          {error}
        </Alert>
      </div>
    );
  }

  if (preferences.length === 0) {
    return (
      <div className={`text-center py-12 text-gray-500 dark:text-gray-400 ${className}`}>
        No notification templates available.
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notification Preferences
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Control how you receive notifications for each type of event.
          </p>
        </div>

        {onResetToDefaults && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetToDefaults}
            disabled={isSaving}
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        )}
      </div>

      {/* Global channel header */}
      <div className="hidden sm:flex items-center justify-end mb-2 pr-4">
        <div className="flex items-center gap-8">
          <div className="w-12 text-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Email
            </span>
          </div>
          <div className="w-12 text-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              In-App
            </span>
          </div>
          <div className="w-12 text-center">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Push
            </span>
          </div>
        </div>
      </div>

      {/* Preference groups */}
      <div className="space-y-3">
        {preferences.map((group, index) => (
          <PreferenceGroup
            key={group.type_id}
            group={group}
            onToggle={onToggle}
            defaultExpanded={index === 0}
            disabled={isSaving}
          />
        ))}
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <Spinner size="sm" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
};
