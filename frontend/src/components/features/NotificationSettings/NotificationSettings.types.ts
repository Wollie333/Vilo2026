/**
 * NotificationSettings Component Types
 * FEATURE-03: Notification System (User Preferences)
 */

import type {
  NotificationChannel,
  TemplatePreference,
  NotificationPreferenceGroup,
} from '@/types/notification.types';

/**
 * Props for the preference row (single template)
 */
export interface PreferenceRowProps {
  template: TemplatePreference;
  onToggle: (templateId: string, channel: NotificationChannel, enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Props for the preference group (collapsible section)
 */
export interface PreferenceGroupProps {
  group: NotificationPreferenceGroup;
  onToggle: (templateId: string, channel: NotificationChannel, enabled: boolean) => void;
  defaultExpanded?: boolean;
  disabled?: boolean;
}

/**
 * Props for the main notification settings component
 */
export interface NotificationSettingsProps {
  preferences: NotificationPreferenceGroup[];
  onToggle: (templateId: string, channel: NotificationChannel, enabled: boolean) => void;
  onResetToDefaults?: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  className?: string;
}
