/**
 * Onboarding Validators
 *
 * Zod validation schemas for onboarding requests
 */

import { z } from 'zod';
import { propertyTypeSchema, PropertyType } from '../types/property.types';

// ============================================================================
// Helpers - Convert empty strings to undefined for optional fields
// ============================================================================

// Helper to handle empty strings for URL fields
const optionalUrl = (maxLength = 500) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().url().max(maxLength).optional().nullable()
  );

// Helper to handle empty strings for email fields
const optionalEmail = (maxLength = 255) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().email().max(maxLength).optional().nullable()
  );

// Helper to handle empty strings for regular string fields
const optionalString = (maxLength: number) =>
  z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().max(maxLength).optional().nullable()
  );

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
  email: optionalEmail(255),
  phone: optionalString(20),
  website: optionalUrl(500),
  default_currency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .optional()
    .nullable()
    .transform((val) => val?.toUpperCase() || null),
  address_street: optionalString(200),
  address_city: optionalString(100),
  address_state: optionalString(100),
  address_postal_code: optionalString(20),
  address_country: optionalString(100),
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
  property_type: propertyTypeSchema
    .optional()
    .default(PropertyType.HOUSE),
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
