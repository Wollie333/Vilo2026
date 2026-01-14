/**
 * Onboarding Validators
 *
 * Zod validation schemas for onboarding requests
 */

import { z } from 'zod';

// Step number validation
export const onboardingStepSchema = z.number().int().min(0).max(4);

// Update step request
export const updateOnboardingStepSchema = z.object({
  step: onboardingStepSchema,
});

// Profile step data
export const onboardingProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .transform((val) => val.trim()),
  phone: z
    .string()
    .max(20, 'Phone number too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  avatar_url: z
    .string()
    .url('Invalid URL')
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, 'Bio too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

// Company step data
export const onboardingCompanySchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long')
    .transform((val) => val.trim()),
  email: z
    .string()
    .email('Invalid email')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  phone: z
    .string()
    .max(20, 'Phone number too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  website: z
    .string()
    .url('Invalid URL')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_street: z
    .string()
    .max(200, 'Street address too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_city: z
    .string()
    .max(100, 'City name too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_state: z
    .string()
    .max(100, 'State/Province too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_postal_code: z
    .string()
    .max(20, 'Postal code too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_country: z
    .string()
    .max(100, 'Country name too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

// Property step data
export const onboardingPropertySchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(100, 'Property name too long')
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(1000, 'Description too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  property_type: z
    .enum(['house', 'apartment', 'villa', 'cabin', 'cottage', 'condo', 'townhouse', 'other'])
    .optional()
    .default('house'),
  address_street: z
    .string()
    .max(200, 'Street address too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_city: z
    .string()
    .max(100, 'City name too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_state: z
    .string()
    .max(100, 'State/Province too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_postal_code: z
    .string()
    .max(20, 'Postal code too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
  address_country: z
    .string()
    .max(100, 'Country name too long')
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

// Skip step request
export const skipStepSchema = z.object({
  current_step: onboardingStepSchema,
});

// Set selected plan request
export const setSelectedPlanSchema = z.object({
  plan_id: z.string().uuid('Invalid plan ID'),
  billing_interval: z.enum(['monthly', 'annual']).default('monthly'),
});

// Export types
export type UpdateOnboardingStepInput = z.infer<typeof updateOnboardingStepSchema>;
export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;
export type OnboardingCompanyInput = z.infer<typeof onboardingCompanySchema>;
export type OnboardingPropertyInput = z.infer<typeof onboardingPropertySchema>;
export type SkipStepInput = z.infer<typeof skipStepSchema>;
export type SetSelectedPlanInput = z.infer<typeof setSelectedPlanSchema>;
