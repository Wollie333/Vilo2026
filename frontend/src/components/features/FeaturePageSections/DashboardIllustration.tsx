/**
 * DashboardIllustration Component
 * Embeds actual dashboard components with demo data for feature page illustrations
 */

import React, { useState, useEffect } from 'react';

interface DashboardIllustrationProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showNotification?: boolean;
  notificationContent?: React.ReactNode;
}

export const DashboardIllustration: React.FC<DashboardIllustrationProps> = ({
  title,
  subtitle,
  children,
  showNotification,
  notificationContent,
}) => {
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotif(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  return (
    <div className="relative">
      {/* Blur glow effect */}
      <div className="absolute inset-[-1rem] bg-gradient-to-r from-primary/20 via-teal-500/20 to-primary/20 rounded-3xl blur-3xl opacity-60" />

      {/* Notification toast (optional) */}
      {showNotification && showNotif && (
        <div className="absolute -top-8 -right-4 w-96 z-50 animate-[fadeSlideIn_0.8s_ease-out_forwards,float_4s_ease-in-out_0.8s_infinite]">
          {notificationContent}
        </div>
      )}

      {/* Dashboard preview */}
      <div className="relative bg-white dark:bg-dark-card rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-dark-border">
        {/* Header matching AuthenticatedLayout */}
        <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Body with component preview */}
        <div className="bg-gray-50 dark:bg-dark-bg p-6 max-h-[600px] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

// Notification Toast Component
interface NotificationToastProps {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  title,
  message,
}) => {
  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const iconColors = {
    success: 'text-green-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <div className={`rounded-lg border p-4 shadow-lg ${colors[type]}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${iconColors[type]}`}>
          {type === 'success' && (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {type === 'info' && (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
