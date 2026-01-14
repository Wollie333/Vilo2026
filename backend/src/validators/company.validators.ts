import { z } from 'zod';

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

// ============================================================================
// Company Schemas
// ============================================================================

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  display_name: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  logo_url: optionalUrl(),
  website: optionalUrl(),
  contact_email: optionalEmail(),
  contact_phone: z.string().max(50).optional().nullable(),
  default_currency: z.string().max(3).optional().nullable(),
  address_street: z.string().max(255).optional().nullable(),
  address_city: z.string().max(100).optional().nullable(),
  address_state: z.string().max(100).optional().nullable(),
  address_postal_code: z.string().max(20).optional().nullable(),
  address_country: z.string().max(100).optional().nullable(),
  vat_number: z.string().max(100).optional().nullable(),
  registration_number: z.string().max(100).optional().nullable(),
  linkedin_url: optionalUrl(),
  facebook_url: optionalUrl(),
  instagram_url: optionalUrl(),
  twitter_url: optionalUrl(),
  youtube_url: optionalUrl(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  display_name: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  logo_url: optionalUrl(),
  website: optionalUrl(),
  contact_email: optionalEmail(),
  contact_phone: z.string().max(50).optional().nullable(),
  default_currency: z.string().max(3).optional().nullable(),
  address_street: z.string().max(255).optional().nullable(),
  address_city: z.string().max(100).optional().nullable(),
  address_state: z.string().max(100).optional().nullable(),
  address_postal_code: z.string().max(20).optional().nullable(),
  address_country: z.string().max(100).optional().nullable(),
  vat_number: z.string().max(100).optional().nullable(),
  registration_number: z.string().max(100).optional().nullable(),
  linkedin_url: optionalUrl(),
  facebook_url: optionalUrl(),
  instagram_url: optionalUrl(),
  twitter_url: optionalUrl(),
  youtube_url: optionalUrl(),
  is_active: z.boolean().optional(),
});

export const companyIdParamSchema = z.object({
  id: z.string().uuid('Invalid company ID'),
});

export const propertyIdParamSchema = z.object({
  id: z.string().uuid('Invalid company ID'),
  propertyId: z.string().uuid('Invalid property ID'),
});
