import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

// ============================================================================
// User Type Schemas
// ============================================================================

export const createUserTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50)
    .regex(/^[a-z_]+$/, 'Name must be lowercase with underscores only'),
  display_name: z.string().min(1, 'Display name is required').max(100),
  description: z.string().max(500).optional(),
  can_have_subscription: z.boolean().default(false),
  can_have_team: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});

export const updateUserTypeSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  can_have_subscription: z.boolean().optional(),
  can_have_team: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

// ============================================================================
// Billing Status Schemas
// ============================================================================

export const billingStatusColorSchema = z.enum(['default', 'success', 'warning', 'error', 'info']);

export const createBillingStatusSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50)
    .regex(/^[a-z_]+$/, 'Name must be lowercase with underscores only'),
  display_name: z.string().min(1, 'Display name is required').max(100),
  description: z.string().max(500).optional(),
  color: billingStatusColorSchema.default('default'),
  feature_access_level: z.number().int().min(0).max(100).default(0),
  sort_order: z.number().int().min(0).default(0),
});

export const updateBillingStatusSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: billingStatusColorSchema.optional(),
  feature_access_level: z.number().int().min(0).max(100).optional(),
  sort_order: z.number().int().min(0).optional(),
});

// ============================================================================
// Subscription Type Schemas
// ============================================================================

export const createSubscriptionTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50)
    .regex(/^[a-z_]+$/, 'Name must be lowercase with underscores only'),
  display_name: z.string().min(1, 'Display name is required').max(100),
  description: z.string().max(500).optional(),
  billing_cycle_days: z.number().int().min(1).max(730).optional().nullable(),
  is_recurring: z.boolean().default(true),
  price_cents: z.number().int().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const updateSubscriptionTypeSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  billing_cycle_days: z.number().int().min(1).max(730).optional().nullable(),
  is_recurring: z.boolean().optional(),
  price_cents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const subscriptionTypeListQuerySchema = z.object({
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  is_recurring: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  sortBy: z.enum(['sort_order', 'name', 'price_cents', 'created_at']).default('sort_order'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// Subscription Limit Schemas
// ============================================================================

export const limitKeySchema = z.string().min(1).max(50).regex(/^[a-z_]+$/, 'Limit key must be lowercase with underscores only');

export const createSubscriptionLimitSchema = z.object({
  subscription_type_id: z.string().uuid('Invalid subscription type ID'),
  limit_key: limitKeySchema,
  limit_value: z.number().int().min(-1), // -1 means unlimited
  description: z.string().max(500).optional(),
});

export const updateSubscriptionLimitSchema = z.object({
  limit_value: z.number().int().min(-1).optional(),
  description: z.string().max(500).optional().nullable(),
});

export const bulkUpdateLimitsSchema = z.object({
  limits: z.array(
    z.object({
      limit_key: limitKeySchema,
      limit_value: z.number().int().min(-1),
      description: z.string().max(500).optional(),
    })
  ).min(1, 'At least one limit is required'),
});

export const subscriptionTypeLimitsParamSchema = z.object({
  subscriptionTypeId: z.string().uuid('Invalid subscription type ID'),
});

// ============================================================================
// User Subscription Schemas
// ============================================================================

export const createUserSubscriptionSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  subscription_type_id: z.string().uuid('Invalid subscription type ID'),
  billing_status_id: z.string().uuid('Invalid billing status ID'),
  expires_at: z.string().datetime().optional(),
  trial_ends_at: z.string().datetime().optional(),
});

export const updateUserSubscriptionSchema = z.object({
  subscription_type_id: z.string().uuid().optional(),
  billing_status_id: z.string().uuid().optional(),
  expires_at: z.string().datetime().optional().nullable(),
  trial_ends_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const cancelSubscriptionSchema = z.object({
  cancellation_reason: z.string().max(500).optional(),
});

export const userSubscriptionListQuerySchema = z.object({
  billing_status_id: z.string().uuid().optional(),
  subscription_type_id: z.string().uuid().optional(),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  expires_before: z.string().datetime().optional(),
  expires_after: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'expires_at', 'started_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// ============================================================================
// Limit Check Schema
// ============================================================================

export const checkLimitSchema = z.object({
  limit_key: limitKeySchema,
  current_count: z.number().int().min(0).default(0),
});

// ============================================================================
// Type Exports
// ============================================================================

export type IdParam = z.infer<typeof idParamSchema>;
export type CreateUserTypeInput = z.infer<typeof createUserTypeSchema>;
export type UpdateUserTypeInput = z.infer<typeof updateUserTypeSchema>;
export type CreateBillingStatusInput = z.infer<typeof createBillingStatusSchema>;
export type UpdateBillingStatusInput = z.infer<typeof updateBillingStatusSchema>;
export type CreateSubscriptionTypeInput = z.infer<typeof createSubscriptionTypeSchema>;
export type UpdateSubscriptionTypeInput = z.infer<typeof updateSubscriptionTypeSchema>;
export type SubscriptionTypeListQuery = z.infer<typeof subscriptionTypeListQuerySchema>;
export type CreateSubscriptionLimitInput = z.infer<typeof createSubscriptionLimitSchema>;
export type UpdateSubscriptionLimitInput = z.infer<typeof updateSubscriptionLimitSchema>;
export type BulkUpdateLimitsInput = z.infer<typeof bulkUpdateLimitsSchema>;
export type SubscriptionTypeLimitsParam = z.infer<typeof subscriptionTypeLimitsParamSchema>;
export type CreateUserSubscriptionInput = z.infer<typeof createUserSubscriptionSchema>;
export type UpdateUserSubscriptionInput = z.infer<typeof updateUserSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type UserSubscriptionListQuery = z.infer<typeof userSubscriptionListQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type CheckLimitInput = z.infer<typeof checkLimitSchema>;
