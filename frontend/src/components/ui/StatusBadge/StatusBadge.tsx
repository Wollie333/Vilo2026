import React from 'react';

export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'active'
  | 'inactive'
  | 'default';

export interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-success-light text-success-dark dark:bg-success/20 dark:text-success',
  warning: 'bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning',
  error: 'bg-error-light text-error-dark dark:bg-error/20 dark:text-error',
  info: 'bg-info-light text-info-dark dark:bg-info/20 dark:text-info',
  pending: 'bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning',
  confirmed: 'bg-success-light text-success-dark dark:bg-success/20 dark:text-success',
  cancelled: 'bg-error-light text-error-dark dark:bg-error/20 dark:text-error',
  completed: 'bg-info-light text-info-dark dark:bg-info/20 dark:text-info',
  active: 'bg-success-light text-success-dark dark:bg-success/20 dark:text-success',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const dotStyles: Record<StatusType, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  pending: 'bg-warning',
  confirmed: 'bg-success',
  cancelled: 'bg-error',
  completed: 'bg-info',
  active: 'bg-success',
  inactive: 'bg-gray-400',
  default: 'bg-gray-500',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-2xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

const dotSizeStyles = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'md',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${statusStyles[status]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`rounded-full ${dotStyles[status]} ${dotSizeStyles[size]}`} />
      )}
      {children}
    </span>
  );
};
