import { z } from 'zod';

// ============================================================================
// Invoice Settings Validation
// ============================================================================

export const updateInvoiceSettingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255).optional(),
  company_address: z.string().max(500).optional().nullable(),
  company_email: z.string().email('Invalid email address').optional().nullable(),
  company_phone: z.string().max(50).optional().nullable(),
  vat_number: z.string().max(50).optional().nullable(),
  registration_number: z.string().max(50).optional().nullable(),
  logo_url: z.string().url('Invalid URL').optional().nullable(),
  footer_text: z.string().max(1000).optional().nullable(),
  invoice_prefix: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z]+$/, 'Invoice prefix must be uppercase letters only')
    .optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
});

export type UpdateInvoiceSettingsInput = z.infer<typeof updateInvoiceSettingsSchema>;

// ============================================================================
// Invoice List Query Validation
// ============================================================================

export const invoiceListQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'paid', 'void']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'invoice_number', 'total_cents']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type InvoiceListQueryInput = z.infer<typeof invoiceListQuerySchema>;

// ============================================================================
// Invoice ID Param Validation
// ============================================================================

export const invoiceIdParamSchema = z.object({
  id: z.string().uuid('Invalid invoice ID'),
});

export type InvoiceIdParamInput = z.infer<typeof invoiceIdParamSchema>;
