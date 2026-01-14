import React from 'react';
import type { BadgeProps } from './Badge.types';

const variantStyles = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-primary/10 text-primary dark:bg-primary/20',
  success: 'bg-primary text-white',
  warning: 'bg-warning/10 text-warning dark:bg-warning/20',
  error: 'bg-error/10 text-error dark:bg-error/20',
  info: 'bg-info/10 text-info dark:bg-info/20',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-2xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-0.5 text-sm',
};

const dotStyles = {
  default: 'bg-gray-500',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  rounded = true,
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${rounded ? 'rounded-full' : 'rounded'}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`
            -ml-0.5 mr-1.5 h-2 w-2 rounded-full
            ${dotStyles[variant]}
          `}
        />
      )}
      {children}
    </span>
  );
};
