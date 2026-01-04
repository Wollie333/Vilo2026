/**
 * Toast Component Types
 * FEATURE-03: Notification System
 */

import type { NotificationVariant, ToastPosition } from '@/types/notification.types';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  variant: NotificationVariant;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  onDismiss?: () => void;
}

export interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
  position?: ToastPosition;
}

export interface ToastContainerProps {
  position?: ToastPosition;
  maxToasts?: number;
}
