/**
 * Notification Types
 * FEATURE-03: Notification System
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

// ============================================================================
// Database Entities
// ============================================================================

/**
 * Notification type/category from database
 */
export interface NotificationType {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  color: string;
  is_system_type: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Notification template from database
 */
export interface NotificationTemplate {
  id: string;
  notification_type_id: string;
  name: string;
  title_template: string;
  message_template: string;
  email_subject_template: string | null;
  email_body_template: string | null;
  default_priority: NotificationPriority;
  default_variant: NotificationVariant;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Notification template with type joined
 */
export interface NotificationTemplateWithType extends NotificationTemplate {
  notification_type?: NotificationType;
}

/**
 * Main notification entity from database
 */
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
  email_sent: boolean;
  email_sent_at: string | null;
  push_sent: boolean;
  push_sent_at: string | null;
  action_url: string | null;
  action_label: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Notification with type info joined
 */
export interface NotificationWithType extends Notification {
  notification_type?: NotificationType;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request to create a single notification
 */
export interface CreateNotificationRequest {
  /** Target user ID (defaults to authenticated user for self-notifications) */
  user_id?: string;
  /** Use template to generate content */
  template_name?: string;
  /** Direct type reference (if not using template) */
  notification_type_id?: string;
  /** Title (override or provide directly if not using template) */
  title?: string;
  /** Message (override or provide directly if not using template) */
  message?: string;
  /** Variant (override template default) */
  variant?: NotificationVariant;
  /** Template variables and additional metadata */
  data?: Record<string, unknown>;
  /** Priority level */
  priority?: NotificationPriority;
  /** Deep link URL when clicked */
  action_url?: string;
  /** Button/link text */
  action_label?: string;
  /** Expiration timestamp */
  expires_at?: string;
  /** Whether to send email notification */
  send_email?: boolean;
}

/**
 * Request to create notifications for multiple users
 */
export interface BulkNotificationRequest {
  /** Target user IDs */
  user_ids: string[];
  /** Use template to generate content */
  template_name?: string;
  /** Direct type reference */
  notification_type_id?: string;
  /** Title */
  title?: string;
  /** Message */
  message?: string;
  /** Variant */
  variant?: NotificationVariant;
  /** Template variables */
  data?: Record<string, unknown>;
  /** Priority level */
  priority?: NotificationPriority;
  /** Deep link URL */
  action_url?: string;
  /** Button text */
  action_label?: string;
  /** Expiration */
  expires_at?: string;
  /** Send email */
  send_email?: boolean;
}

/**
 * Query parameters for listing notifications
 */
export interface NotificationListParams {
  page?: number;
  limit?: number;
  /** Filter by read status */
  read?: boolean;
  /** Filter by notification type name */
  type?: string;
  /** Filter by priority */
  priority?: NotificationPriority;
  /** Filter from date */
  startDate?: string;
  /** Filter to date */
  endDate?: string;
  /** Sort field */
  sortBy?: 'created_at' | 'priority';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response for paginated notification list
 */
export interface NotificationListResponse {
  notifications: NotificationWithType[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Request to mark specific notifications as read
 */
export interface MarkReadRequest {
  /** Specific notification IDs (if empty/undefined, marks all) */
  notification_ids?: string[];
}

/**
 * Notification statistics for a user
 */
export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<NotificationPriority, number>;
}

/**
 * Result of bulk operations
 */
export interface BulkOperationResult {
  created: number;
  failed: number;
}

/**
 * Result of mark read operations
 */
export interface MarkReadResult {
  updated: number;
}

/**
 * Result of cleanup operations
 */
export interface CleanupResult {
  deleted: number;
}

// ============================================================================
// Email Types
// ============================================================================

/**
 * Email options for sending notifications
 */
export interface NotificationEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ============================================================================
// Realtime Types
// ============================================================================

/**
 * Supabase Realtime payload for notification changes
 */
export interface NotificationRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Notification | null;
  old: Notification | null;
}

// ============================================================================
// Notification Preferences Types
// ============================================================================

export type NotificationChannel = 'email' | 'in_app' | 'push';

/**
 * Notification preference entity from database
 */
export interface NotificationPreference {
  id: string;
  user_id: string;
  template_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Preference with template and type info (from get_user_notification_preferences function)
 */
export interface NotificationPreferenceWithTemplate {
  template_id: string;
  template_name: string;
  template_title: string;
  type_id: string;
  type_name: string;
  type_display_name: string;
  type_icon: string | null;
  type_sort_order: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
}

/**
 * Preferences grouped by notification type
 */
export interface NotificationPreferencesGrouped {
  type_id: string;
  type_name: string;
  type_display_name: string;
  type_icon: string | null;
  templates: {
    template_id: string;
    template_name: string;
    template_title: string;
    email_enabled: boolean;
    in_app_enabled: boolean;
    push_enabled: boolean;
  }[];
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
 * Request to bulk update preferences
 */
export interface BulkPreferenceUpdate {
  template_id: string;
  email_enabled?: boolean;
  in_app_enabled?: boolean;
  push_enabled?: boolean;
}

export interface BulkUpdatePreferencesRequest {
  preferences: BulkPreferenceUpdate[];
}

/**
 * Response for get preferences endpoint
 */
export interface NotificationPreferencesResponse {
  preferences: NotificationPreferencesGrouped[];
  total_templates: number;
}

/**
 * Response for toggle preference endpoint
 */
export interface TogglePreferenceResponse {
  preference: NotificationPreference;
}

/**
 * Response for bulk update endpoint
 */
export interface BulkUpdatePreferencesResponse {
  updated: number;
}

/**
 * Response for reset preferences endpoint
 */
export interface ResetPreferencesResponse {
  deleted: number;
}
