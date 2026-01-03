import { HTMLAttributes, ReactNode } from 'react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the alert */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Title text for the alert */
  title?: string;
  /** Content of the alert */
  children: ReactNode;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Icon to display (defaults to variant icon) */
  icon?: ReactNode;
  /** Whether to show the default icon */
  showIcon?: boolean;
}
