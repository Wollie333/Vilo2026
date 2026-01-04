/**
 * Notification Types (Frontend)
 * FEATURE-03: Notification System
 *
 * TypeScript interfaces for the frontend notification system.
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

// ============================================================================
// Notification Types (from API)
// ============================================================================

export interface NotificationType {
  id: string;
  name: string;
  label: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type_id: string | null;
  template_id: string | null;
  title: string;
  message: string;
  variant: NotificationVariant;
  data: Record<string, unknown>;
  priority: NotificationPriority;
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  action_label: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  notification_type?: NotificationType;
}

// ============================================================================
// Toast Types
// ============================================================================

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  variant: NotificationVariant;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  onDismiss?: () => void;
}

export interface ToastOptions {
  variant?: NotificationVariant;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  onDismiss?: () => void;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface NotificationListParams {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: string;
  priority?: NotificationPriority;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'priority' | 'read';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<NotificationPriority, number>;
}

export interface MarkReadResponse {
  updated: number;
}

// ============================================================================
// Context Types
// ============================================================================

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  toasts: Toast[];
}

export interface NotificationContextValue extends NotificationState {
  // Toast methods
  toast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // Notification methods
  fetchNotifications: (params?: NotificationListParams) => Promise<void>;
  markAsRead: (notificationIds?: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ToastContainerProps {
  position?: ToastPosition;
  maxToasts?: number;
}

export interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  position?: ToastPosition;
}

export interface NotificationCenterProps {
  className?: string;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

// ============================================================================
// Notification Preferences Types
// ============================================================================

export type NotificationChannel = 'email' | 'in_app' | 'push';

/**
 * Template preference within a group
 */
export interface TemplatePreference {
  template_id: string;
  template_name: string;
  template_title: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
}

/**
 * Preferences grouped by notification type
 */
export interface NotificationPreferenceGroup {
  type_id: string;
  type_name: string;
  type_display_name: string;
  type_icon: string | null;
  templates: TemplatePreference[];
}

/**
 * Response from get preferences endpoint
 */
export interface NotificationPreferencesResponse {
  preferences: NotificationPreferenceGroup[];
  total_templates: number;
}

/**
 * Request to toggle a single preference
 */
export interface TogglePreferenceRequest {
  template_id: string;
  channel: NotificationChannel;
  enabled: boolean;
}

/**
 * Single preference update for bulk
 */
export interface BulkPreferenceUpdate {
  template_id: string;
  email_enabled?: boolean;
  in_app_enabled?: boolean;
  push_enabled?: boolean;
}

/**
 * Request for bulk update
 */
export interface BulkUpdatePreferencesRequest {
  preferences: BulkPreferenceUpdate[];
}

/**
 * Response from toggle/bulk update
 */
export interface UpdatePreferencesResponse {
  updated: number;
  message: string;
}

/**
 * Response from reset preferences
 */
export interface ResetPreferencesResponse {
  deleted: number;
  message: string;
}

/**
 * Notification preferences state for hook
 */
export interface NotificationPreferencesState {
  preferences: NotificationPreferenceGroup[];
  totalTemplates: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

/**
 * Notification preferences hook return value
 */
export interface UseNotificationPreferencesReturn extends NotificationPreferencesState {
  togglePreference: (templateId: string, channel: NotificationChannel, enabled: boolean) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refetch: () => Promise<void>;
}
