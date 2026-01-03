import React, { useState } from 'react';
import type { AvatarProps } from './Avatar.types';
import { designTokens } from '@/design-system';

// Avatar colors from design tokens
const avatarColorKeys = Object.keys(designTokens.colors.avatar) as Array<keyof typeof designTokens.colors.avatar>;

const sizeStyles = {
  xs: 'h-5 w-5 text-2xs',
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-14 w-14 text-base',
  'xl-lg': 'h-16 w-16 text-base',
  '2xl': 'h-18 w-18 text-lg',
};

const statusSizeStyles = {
  xs: 'h-1.5 w-1.5 ring-1',
  sm: 'h-1.5 w-1.5 ring-1',
  md: 'h-2 w-2 ring-2',
  lg: 'h-2.5 w-2.5 ring-2',
  xl: 'h-3 w-3 ring-2',
  'xl-lg': 'h-3 w-3 ring-2',
  '2xl': 'h-3.5 w-3.5 ring-2',
};

const statusColors = {
  online: 'bg-success',
  offline: 'bg-gray-400',
  busy: 'bg-error',
  away: 'bg-warning',
};

/**
 * Generate initials from a name
 */
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

/**
 * Generate a consistent background color from a string using design tokens
 */
const getColorFromString = (str: string): string => {
  // Use design token avatar colors via Tailwind classes
  const colorClasses = avatarColorKeys.map((key) => `bg-avatar-${key}`);

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colorClasses[Math.abs(hash) % colorClasses.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  fallback,
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  const bgColor = name ? getColorFromString(name) : 'bg-gray-400';

  return (
    <div className={`relative inline-flex ${className}`}>
      {showFallback ? (
        <div
          className={`
            inline-flex items-center justify-center
            ${sizeStyles[size]}
            ${shapeClass}
            ${bgColor}
            text-white font-medium
          `}
          aria-label={name || alt || 'Avatar'}
        >
          {fallback || (name ? getInitials(name) : '?')}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          onError={() => setImageError(true)}
          className={`
            object-cover
            ${sizeStyles[size]}
            ${shapeClass}
          `}
          {...props}
        />
      )}

      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            block rounded-full ring-white dark:ring-dark-card
            ${statusSizeStyles[size]}
            ${statusColors[status]}
          `}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};
