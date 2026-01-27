import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

// ============================================================================
// User Type Schemas (Member Types)
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
  // Note: category and name cannot be changed after creation for data integrity
});

// ============================================================================
// Subscription Status Schema
// ============================================================================

export const subscriptionStatusSchema = z.enum([
  'active',
  'trial',
  'cancelled',
  'expired',
  'past_due',
]);

// ============================================================================
// Limits Schema (JSONB limits on subscription types)
// ============================================================================

export const limitsSchema = z.record(
  z.string().min(1).max(50).regex(/^[a-z_]+$/, 'Limit key must be lowercase with underscores only'),
  z.number().int().min(-1) // -1 means unlimited
).default({});

// ============================================================================
// Pricing Schema (JSONB pricing tiers on subscription types)
// ============================================================================

// Legacy pricing schema (kept for backward compatibility)
export const pricingSchema = z.object({
  monthly: z.number().int().min(0).optional(), // Price in cents for monthly billing
  annual: z.number().int().min(0).optional(),  // Price in cents for annual billing
}).default({});

// NEW: Individual billing type configuration
export const billingTypeConfigSchema = z.object({
  enabled: z.boolean(),
  price_cents: z.number().int().min(0),
  billing_cycle_days: z.number().int().min(1).max(730).optional(),
  trial_period_days: z.number().int().min(0).max(365).optional().nullable(),
  description: z.string().max(200).optional(),
});

// NEW: Enhanced pricing tiers with full config per billing type
export const pricingTiersEnhancedSchema = z.object({
  monthly: billingTypeConfigSchema.optional(),
  annual: billingTypeConfigSchema.optional(),
  one_off: billingTypeConfigSchema.optional(),
}).default({});

// NEW: Billing types enabled flags
export const billingTypesEnabledSchema = z.object({
  monthly: z.boolean(),
  annual: z.boolean(),
  one_off: z.boolean(),
}).refine(
  (data) => data.monthly || data.annual || data.one_off,
  { message: 'At least one billing type must be enabled' }
);

// ============================================================================
// Subscription Type Schemas (with embedded limits)
// ============================================================================

export const createSubscriptionTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50)
    .regex(/^[a-z_]+$/, 'Name must be lowercase with underscores only'),
  display_name: z.string().min(1, 'Display name is required').max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).default('USD'),
  trial_period_days: z.number().int().min(0).max(365).optional().nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  limits: limitsSchema.optional().default({}), // Embedded JSONB limits

  // Multi-billing support
  billing_types: billingTypesEnabledSchema.optional(), // Which billing types to enable
  pricing_tiers: pricingTiersEnhancedSchema.optional(), // Config for each billing type
  // Alternative: Individual price inputs (UI convenience)
  monthly_price_cents: z.number().int().min(0).optional(),
  annual_price_cents: z.number().int().min(0).optional(),
  one_off_price_cents: z.number().int().min(0).optional(),

  // CMS fields for checkout page customization
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  custom_headline: z.string().max(200).optional().nullable(),
  custom_description: z.string().max(1000).optional().nullable(),
  custom_features: z.array(z.string().max(200)).optional().default([]),
  custom_cta_text: z.string().max(50).optional().nullable(),
  checkout_badge: z.string().max(50).optional().nullable(),
  checkout_accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional().nullable(),

  // Legacy fields (accepted but ignored - for backward compatibility)
  billing_cycle_days: z.number().int().min(1).max(730).optional().nullable(),
  is_recurring: z.boolean().optional(),
  price_cents: z.number().int().min(0).optional(),
  pricing: pricingSchema.optional(),
});

export const updateSubscriptionTypeSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  currency: z.string().length(3).optional(),
  trial_period_days: z.number().int().min(0).max(365).optional().nullable(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  limits: limitsSchema.optional(), // Embedded JSONB limits

  // Multi-billing support
  billing_types: billingTypesEnabledSchema.optional(), // Which billing types to enable
  pricing_tiers: pricingTiersEnhancedSchema.optional(), // Config for each billing type
  // Alternative: Individual price inputs (UI convenience)
  monthly_price_cents: z.number().int().min(0).optional(),
  annual_price_cents: z.number().int().min(0).optional(),
  one_off_price_cents: z.number().int().min(0).optional(),

  // CMS fields for checkout page customization
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  custom_headline: z.string().max(200).optional().nullable(),
  custom_description: z.string().max(1000).optional().nullable(),
  custom_features: z.array(z.string().max(200)).optional(),
  custom_cta_text: z.string().max(50).optional().nullable(),
  checkout_badge: z.string().max(50).optional().nullable(),
  checkout_accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional().nullable(),

  // Legacy fields (accepted but ignored - for backward compatibility)
  billing_cycle_days: z.number().int().min(1).max(730).optional().nullable(),
  is_recurring: z.boolean().optional(),
  price_cents: z.number().int().min(0).optional(),
  pricing: pricingSchema.optional(),
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
// User Subscription Schemas (with status field)
// ============================================================================

export const createUserSubscriptionSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  subscription_type_id: z.string().uuid('Invalid subscription type ID'),
  status: subscriptionStatusSchema.default('active'),
  expires_at: z.string().datetime().optional(),
  trial_ends_at: z.string().datetime().optional(),
});

export const updateUserSubscriptionSchema = z.object({
  subscription_type_id: z.string().uuid().optional(),
  status: subscriptionStatusSchema.optional(),
  expires_at: z.string().datetime().optional().nullable(),
  trial_ends_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const cancelSubscriptionSchema = z.object({
  cancellation_reason: z.string().max(500).optional(),
});

export const userSubscriptionListQuerySchema = z.object({
  status: subscriptionStatusSchema.optional(),
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

export const limitKeySchema = z.string().min(1).max(50).regex(/^[a-z_]+$/, 'Limit key must be lowercase with underscores only');

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
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type CreateSubscriptionTypeInput = z.infer<typeof createSubscriptionTypeSchema>;
export type UpdateSubscriptionTypeInput = z.infer<typeof updateSubscriptionTypeSchema>;
export type SubscriptionTypeListQuery = z.infer<typeof subscriptionTypeListQuerySchema>;
export type CreateUserSubscriptionInput = z.infer<typeof createUserSubscriptionSchema>;
export type UpdateUserSubscriptionInput = z.infer<typeof updateUserSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type UserSubscriptionListQuery = z.infer<typeof userSubscriptionListQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type CheckLimitInput = z.infer<typeof checkLimitSchema>;
