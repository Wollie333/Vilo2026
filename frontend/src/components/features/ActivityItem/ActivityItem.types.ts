import type { ActivityLogEntry } from '@/services/users.service';

export interface ActivityItemProps {
  activity: ActivityLogEntry;
  className?: string;
}

export type ActivityAction =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.approved'
  | 'user.suspended'
  | 'user.activated'
  | 'user.password_reset'
  | 'user.email_verified'
  | 'user.avatar_updated'
  | 'role.assigned'
  | 'role.removed'
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'permission.granted'
  | 'permission.denied'
  | 'permission.removed'
  | 'property.assigned'
  | 'property.removed';
