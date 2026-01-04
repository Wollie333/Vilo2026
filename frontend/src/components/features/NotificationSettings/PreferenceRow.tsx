/**
 * PreferenceRow Component
 * FEATURE-03: Notification System (User Preferences)
 *
 * A single template row with toggles for each notification channel.
 */

import React from 'react';
import { Switch } from '@/components/ui';
import type { PreferenceRowProps } from './NotificationSettings.types';

export const PreferenceRow: React.FC<PreferenceRowProps> = ({
  template,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-dark-card-hover rounded-md transition-colors">
      {/* Template title */}
      <div className="flex-1 min-w-0 pr-4">
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {template.template_title}
        </span>
      </div>

      {/* Channel toggles */}
      <div className="flex items-center gap-8">
        {/* Email */}
        <div className="w-12 flex justify-center">
          <Switch
            checked={template.email_enabled}
            onCheckedChange={(checked) => onToggle(template.template_id, 'email', checked)}
            disabled={disabled}
            size="sm"
            aria-label={`Email notifications for ${template.template_title}`}
          />
        </div>

        {/* In-App */}
        <div className="w-12 flex justify-center">
          <Switch
            checked={template.in_app_enabled}
            onCheckedChange={(checked) => onToggle(template.template_id, 'in_app', checked)}
            disabled={disabled}
            size="sm"
            aria-label={`In-app notifications for ${template.template_title}`}
          />
        </div>

        {/* Push */}
        <div className="w-12 flex justify-center">
          <Switch
            checked={template.push_enabled}
            onCheckedChange={(checked) => onToggle(template.template_id, 'push', checked)}
            disabled={disabled}
            size="sm"
            aria-label={`Push notifications for ${template.template_title}`}
          />
        </div>
      </div>
    </div>
  );
};
