/**
 * Notification Validators (Zod Schemas)
 * FEATURE-03: Notification System
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export const notificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

export const notificationVariantSchema = z.enum(['info', 'success', 'warning', 'error']);

// ============================================================================
// List Query Schema
// ============================================================================

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  read: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : undefined),
    z.boolean().optional()
  ),
  type: z.string().max(50).optional(),
  priority: notificationPrioritySchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['created_at', 'priority']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Create Notification Schema
// ============================================================================

export const createNotificationSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    template_name: z.string().max(100).optional(),
    notification_type_id: z.string().uuid().optional(),
    title: z.string().min(1).max(255).optional(),
    message: z.string().min(1).max(5000).optional(),
    variant: notificationVariantSchema.optional(),
    data: z.record(z.unknown()).optional(),
    priority: notificationPrioritySchema.default('normal'),
    action_url: z.string().max(500).optional(),
    action_label: z.string().max(100).optional(),
    expires_at: z.string().datetime().optional(),
    send_email: z.boolean().default(false),
  })
  .refine((data) => data.template_name || (data.title && data.message), {
    message: 'Either template_name or both title and message are required',
  });

// ============================================================================
// Bulk Notification Schema
// ============================================================================

export const bulkNotificationSchema = z
  .object({
    user_ids: z.array(z.string().uuid()).min(1).max(1000),
    template_name: z.string().max(100).optional(),
    notification_type_id: z.string().uuid().optional(),
    title: z.string().min(1).max(255).optional(),
    message: z.string().min(1).max(5000).optional(),
    variant: notificationVariantSchema.optional(),
    data: z.record(z.unknown()).optional(),
    priority: notificationPrioritySchema.default('normal'),
    action_url: z.string().max(500).optional(),
    action_label: z.string().max(100).optional(),
    expires_at: z.string().datetime().optional(),
    send_email: z.boolean().default(false),
  })
  .refine((data) => data.template_name || (data.title && data.message), {
    message: 'Either template_name or both title and message are required',
  });

// ============================================================================
// Mark Read Schema
// ============================================================================

export const markReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// Notify by Role Schema
// ============================================================================

export const notifyByRoleSchema = z
  .object({
    role_name: z.string().min(1).max(50),
    template_name: z.string().max(100).optional(),
    notification_type_id: z.string().uuid().optional(),
    title: z.string().min(1).max(255).optional(),
    message: z.string().min(1).max(5000).optional(),
    variant: notificationVariantSchema.optional(),
    data: z.record(z.unknown()).optional(),
    priority: notificationPrioritySchema.default('normal'),
    action_url: z.string().max(500).optional(),
    action_label: z.string().max(100).optional(),
    expires_at: z.string().datetime().optional(),
    send_email: z.boolean().default(false),
  })
  .refine((data) => data.template_name || (data.title && data.message), {
    message: 'Either template_name or both title and message are required',
  });

// ============================================================================
// Notification Preferences Schemas
// ============================================================================

export const notificationChannelSchema = z.enum(['email', 'in_app', 'push']);

/**
 * Schema for toggling a single preference
 */
export const togglePreferenceSchema = z.object({
  template_id: z.string().uuid('Invalid template ID'),
  channel: notificationChannelSchema,
  enabled: z.boolean(),
});

/**
 * Schema for a single preference in bulk update
 */
export const bulkPreferenceUpdateItemSchema = z.object({
  template_id: z.string().uuid('Invalid template ID'),
  email_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
});

/**
 * Schema for bulk updating multiple preferences
 */
export const bulkUpdatePreferencesSchema = z.object({
  preferences: z
    .array(bulkPreferenceUpdateItemSchema)
    .min(1, 'At least one preference is required')
    .max(50, 'Maximum 50 preferences per request'),
});

// ============================================================================
// Inferred Types
// ============================================================================

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type BulkNotificationInput = z.infer<typeof bulkNotificationSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type NotifyByRoleInput = z.infer<typeof notifyByRoleSchema>;
export type TogglePreferenceInput = z.infer<typeof togglePreferenceSchema>;
export type BulkPreferenceUpdateItem = z.infer<typeof bulkPreferenceUpdateItemSchema>;
export type BulkUpdatePreferencesInput = z.infer<typeof bulkUpdatePreferencesSchema>;
