/**
 * NotificationBanner Component
 *
 * Modern, reusable notification banner with icon, title, description, and optional actions
 */

import React from 'react';
import type { NotificationBannerProps } from './NotificationBanner.types';

// Default Icons
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Variant configurations
const variantConfig = {
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-900 dark:text-green-100',
    description: 'text-green-800 dark:text-green-200',
    defaultIcon: <CheckCircleIcon className="w-6 h-6" />,
  },
  warning: {
    container: 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-600',
    icon: 'text-orange-600 dark:text-orange-400',
    title: 'text-orange-900 dark:text-orange-100',
    description: 'text-orange-800 dark:text-orange-200',
    defaultIcon: <ExclamationIcon className="w-6 h-6" />,
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    description: 'text-red-800 dark:text-red-200',
    defaultIcon: <XCircleIcon className="w-6 h-6" />,
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    description: 'text-blue-800 dark:text-blue-200',
    defaultIcon: <InfoIcon className="w-6 h-6" />,
  },
  pending: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-900 dark:text-yellow-100',
    description: 'text-yellow-800 dark:text-yellow-200',
    defaultIcon: <ClockIcon className="w-6 h-6" />,
  },
};

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  variant,
  title,
  description,
  icon,
  actions,
  className = '',
  show = true,
}) => {
  if (!show) return null;

  const config = variantConfig[variant];
  const iconToRender = icon || config.defaultIcon;

  return (
    <div className={`rounded-lg border-2 p-4 ${config.container} ${className}`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 mt-0.5 ${config.icon}`}>
          {iconToRender}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-semibold mb-1 ${config.title}`}>
            {title}
          </h3>
          <div className={`text-sm ${config.description} ${actions ? 'mb-3' : ''}`}>
            {description}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
