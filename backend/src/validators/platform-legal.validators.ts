/**
 * Platform Legal Documents Validators
 *
 * Zod schemas for validating platform legal document requests
 */

import { z } from 'zod';

export const platformLegalDocumentTypeSchema = z.enum([
  'terms_of_service',
  'privacy_policy',
  'cookie_policy',
  'acceptable_use',
]);

export const createPlatformLegalDocumentSchema = z.object({
  document_type: platformLegalDocumentTypeSchema,
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must not exceed 200 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, 'Version must be in format X.Y or X.Y.Z (e.g., 1.0, 1.1, 2.0.1)'),
  is_active: z.boolean().optional(),
  effective_date: z.string().datetime().optional(),
});

export const updatePlatformLegalDocumentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must not exceed 200 characters').optional(),
  content: z.string().min(50, 'Content must be at least 50 characters').optional(),
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, 'Version must be in format X.Y or X.Y.Z').optional(),
  is_active: z.boolean().optional(),
  effective_date: z.string().datetime().optional(),
});
