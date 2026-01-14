/**
 * Icons Types
 *
 * Type definitions for icon components
 */

export interface IconProps {
  /**
   * Size of the icon
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Custom className for additional styling
   */
  className?: string;

  /**
   * Color of the icon (uses Tailwind text color classes)
   */
  color?: string;

  /**
   * Stroke width for outline icons
   * @default 2
   */
  strokeWidth?: number;
}

/**
 * Size mapping for icons
 */
export const iconSizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
} as const;
