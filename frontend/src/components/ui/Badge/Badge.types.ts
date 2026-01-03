import { HTMLAttributes, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual variant of the badge */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the badge has a dot indicator */
  dot?: boolean;
  /** Whether the badge is rounded (pill shape) */
  rounded?: boolean;
  /** Content of the badge */
  children: ReactNode;
}
