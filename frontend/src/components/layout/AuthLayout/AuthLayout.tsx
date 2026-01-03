import React from 'react';
import { ThemeToggle, LogoIcon } from '@/components/ui';
import type { AuthLayoutProps } from './AuthLayout.types';

const AuthLogo = () => (
  <div className="flex items-center justify-center">
    <LogoIcon size="lg" />
  </div>
);

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg">
      {/* Theme toggle in corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and title */}
          <div className="text-center">
            {showLogo && (
              <div className="mb-6">
                <AuthLogo />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form card */}
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Vilo. All rights reserved.
      </div>
    </div>
  );
};
