/**
 * Quote Request Validators
 *
 * Zod schemas for validating quote request API inputs
 */

import { z } from 'zod';

// ============================================================================
// Enum Schemas
// ============================================================================

export const quoteDateFlexibilitySchema = z.enum([
  'exact',
  'flexible',
  'very_flexible',
]);

export const quoteGroupTypeSchema = z.enum([
  'family',
  'friends',
  'business',
  'wedding',
  'corporate_event',
  'retreat',
  'conference',
  'celebration',
  'other',
]);

export const quoteRequestStatusSchema = z.enum([
  'pending',
  'responded',
  'converted',
  'declined',
  'expired',
]);

// ============================================================================
// Create Quote Request Schema (Guest Submission)
// ============================================================================

export const createQuoteRequestSchema = z.object({
  property_id: z.string().uuid('Invalid property ID'),

  // Guest info
  guest_name: z
    .string()
    .min(1, 'Guest name is required')
    .max(255, 'Guest name is too long')
    .trim(),
  guest_email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  guest_phone: z
    .string()
    .max(50, 'Phone number is too long')
    .trim()
    .optional(),

  // Date requirements
  date_flexibility: quoteDateFlexibilitySchema,
  preferred_check_in: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  preferred_check_out: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  flexible_date_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  flexible_date_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional(),
  nights_count: z
    .number()
    .int('Nights must be a whole number')
    .min(1, 'Nights must be at least 1')
    .max(365, 'Nights cannot exceed 365')
    .optional(),

  // Guest requirements
  adults_count: z
    .number()
    .int('Adults must be a whole number')
    .min(1, 'At least 1 adult is required')
    .max(100, 'Adults cannot exceed 100'),
  children_count: z
    .number()
    .int('Children must be a whole number')
    .min(0, 'Children cannot be negative')
    .max(100, 'Children cannot exceed 100')
    .optional()
    .default(0),
  group_type: quoteGroupTypeSchema,

  // Budget
  budget_min: z
    .number()
    .min(0, 'Budget minimum cannot be negative')
    .optional(),
  budget_max: z
    .number()
    .min(0, 'Budget maximum cannot be negative')
    .optional(),

  // Special requirements
  special_requirements: z
    .string()
    .max(2000, 'Special requirements are too long')
    .trim()
    .optional(),
  event_type: z
    .string()
    .max(100, 'Event type is too long')
    .trim()
    .optional(),
  event_description: z
    .string()
    .max(1000, 'Event description is too long')
    .trim()
    .optional(),
  preferred_room_types: z
    .array(z.string())
    .max(20, 'Too many preferred room types')
    .optional(),

  // Metadata
  source: z
    .string()
    .max(50, 'Source is too long')
    .optional()
    .default('website'),
  user_agent: z.string().max(500, 'User agent is too long').optional(),
  referrer_url: z.string().max(500, 'Referrer URL is too long').optional(),
})
  .refine(
    (data) => {
      // If date_flexibility is 'exact', both check-in and check-out must be provided
      if (data.date_flexibility === 'exact') {
        return !!data.preferred_check_in && !!data.preferred_check_out;
      }
      return true;
    },
    {
      message: 'Check-in and check-out dates are required for exact date flexibility',
      path: ['preferred_check_in'],
    }
  )
  .refine(
    (data) => {
      // If date_flexibility is 'flexible', flexible range must be provided
      if (data.date_flexibility === 'flexible') {
        return !!data.flexible_date_start && !!data.flexible_date_end;
      }
      return true;
    },
    {
      message: 'Flexible date range is required for flexible date flexibility',
      path: ['flexible_date_start'],
    }
  )
  .refine(
    (data) => {
      // Budget max must be >= budget min if both provided
      if (data.budget_min !== undefined && data.budget_max !== undefined) {
        return data.budget_max >= data.budget_min;
      }
      return true;
    },
    {
      message: 'Budget maximum must be greater than or equal to budget minimum',
      path: ['budget_max'],
    }
  )
  .refine(
    (data) => {
      // Check-out must be after check-in if both provided
      if (data.preferred_check_in && data.preferred_check_out) {
        return new Date(data.preferred_check_out) > new Date(data.preferred_check_in);
      }
      return true;
    },
    {
      message: 'Check-out date must be after check-in date',
      path: ['preferred_check_out'],
    }
  )
  .refine(
    (data) => {
      // Flexible end must be after flexible start if both provided
      if (data.flexible_date_start && data.flexible_date_end) {
        return new Date(data.flexible_date_end) > new Date(data.flexible_date_start);
      }
      return true;
    },
    {
      message: 'Flexible date end must be after flexible date start',
      path: ['flexible_date_end'],
    }
  );

// ============================================================================
// Respond to Quote Request Schema (Property Owner)
// ============================================================================

export const respondToQuoteSchema = z.object({
  response_message: z
    .string()
    .min(1, 'Response message is required')
    .max(2000, 'Response message is too long')
    .trim(),
  suggested_dates: z
    .object({
      check_in: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-in date format (YYYY-MM-DD)'),
      check_out: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-out date format (YYYY-MM-DD)'),
    })
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        return new Date(data.check_out) > new Date(data.check_in);
      },
      {
        message: 'Check-out date must be after check-in date',
        path: ['check_out'],
      }
    ),
  estimated_price: z
    .object({
      amount: z
        .number()
        .min(0, 'Price amount cannot be negative'),
      currency: z
        .string()
        .length(3, 'Currency code must be 3 characters (e.g., ZAR, USD)')
        .toUpperCase(),
    })
    .optional(),
});

// ============================================================================
// Update Quote Request Status Schema (Property Owner)
// ============================================================================

export const updateQuoteStatusSchema = z.object({
  status: quoteRequestStatusSchema.optional(),
  priority: z
    .number()
    .int('Priority must be a whole number')
    .min(0, 'Priority cannot be negative')
    .max(10, 'Priority cannot exceed 10')
    .optional(),
  owner_response: z
    .string()
    .max(2000, 'Owner response is too long')
    .trim()
    .optional(),
  expires_at: z
    .string()
    .datetime('Invalid expiration datetime format')
    .optional(),
});

// ============================================================================
// List Query Parameters Schema
// ============================================================================

export const quoteRequestListParamsSchema = z.object({
  property_id: z.string().uuid('Invalid property ID').optional(),
  company_id: z.string().uuid('Invalid company ID').optional(),
  status: quoteRequestStatusSchema.optional(),
  group_type: quoteGroupTypeSchema.optional(),
  search: z.string().max(100, 'Search query is too long').trim().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  sortBy: z
    .enum(['created_at', 'group_size', 'budget_max', 'expires_at'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// Quote Request ID Param Schema
// ============================================================================

export const quoteRequestIdParamSchema = z.object({
  id: z.string().uuid('Invalid quote request ID'),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type CreateQuoteRequestInput = z.infer<typeof createQuoteRequestSchema>;
export type RespondToQuoteInput = z.infer<typeof respondToQuoteSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;
export type QuoteRequestListParams = z.infer<typeof quoteRequestListParamsSchema>;
export type QuoteRequestIdParam = z.infer<typeof quoteRequestIdParamSchema>;
