/**
 * PreferenceGroup Component
 * FEATURE-03: Notification System (User Preferences)
 *
 * A collapsible section for a notification type containing template preference rows.
 */

import React, { useState } from 'react';
import { PreferenceRow } from './PreferenceRow';
import type { PreferenceGroupProps } from './NotificationSettings.types';

// Inline SVG icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export const PreferenceGroup: React.FC<PreferenceGroupProps> = ({
  group,
  onToggle,
  defaultExpanded = false,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const templateCount = group.templates.length;

  return (
    <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-dark-card-hover transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          {/* Chevron */}
          {isExpanded ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}

          {/* Type name */}
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {group.type_display_name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {templateCount} notification{templateCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </button>

      {/* Content - Template rows */}
      {isExpanded && (
        <div
          className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg"
          style={
            {
              '--accordion-content-height': 'auto',
            } as React.CSSProperties
          }
        >
          {/* Channel headers */}
          <div className="flex items-center justify-end py-2 px-4 bg-gray-50 dark:bg-dark-card border-b border-gray-100 dark:border-dark-border">
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

          {/* Template rows */}
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {group.templates.map((template) => (
              <PreferenceRow
                key={template.template_id}
                template={template}
                onToggle={onToggle}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
