/**
 * NotificationBanner Types
 */

export type NotificationVariant = 'success' | 'warning' | 'error' | 'info' | 'pending';

export interface NotificationBannerProps {
  /**
   * Visual variant of the notification
   */
  variant: NotificationVariant;

  /**
   * Main heading text
   */
  title: string;

  /**
   * Description or body text
   */
  description: string | React.ReactNode;

  /**
   * Optional icon to display (if not provided, default icon for variant is used)
   */
  icon?: React.ReactNode;

  /**
   * Optional action button(s)
   */
  actions?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show the notification
   */
  show?: boolean;
}
