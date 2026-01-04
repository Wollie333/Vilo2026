/**
 * NotificationCenter Component Types
 * FEATURE-03: Notification System
 */

import type { Notification } from '@/types/notification.types';

export interface NotificationCenterProps {
  className?: string;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}
