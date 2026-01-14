import { z } from 'zod';

// ============================================================================
// Initialize Checkout
// ============================================================================

export const initializeCheckoutSchema = z.object({
  subscription_type_id: z.string().uuid('Invalid subscription type ID'),
  billing_interval: z.enum(['monthly', 'annual'], {
    errorMap: () => ({ message: 'Billing interval must be monthly or annual' }),
  }),
});

// ============================================================================
// Select Provider
// ============================================================================

export const selectProviderSchema = z.object({
  checkout_id: z.string().uuid('Invalid checkout ID'),
  provider: z.enum(['paystack', 'paypal', 'eft'], {
    errorMap: () => ({ message: 'Invalid payment provider' }),
  }),
});

// ============================================================================
// Verify Payment
// ============================================================================

export const verifyPaymentSchema = z.object({
  checkout_id: z.string().uuid('Invalid checkout ID'),
  provider: z.enum(['paystack', 'paypal', 'eft'], {
    errorMap: () => ({ message: 'Invalid payment provider' }),
  }),
  payment_reference: z.string().optional(),
  paystack_reference: z.string().optional(),
  paypal_order_id: z.string().optional(),
});

// ============================================================================
// Cancel Checkout
// ============================================================================

export const cancelCheckoutSchema = z.object({
  checkout_id: z.string().uuid('Invalid checkout ID'),
});

// ============================================================================
// Confirm EFT Payment (Admin)
// ============================================================================

export const confirmEFTSchema = z.object({
  checkout_id: z.string().uuid('Invalid checkout ID'),
  payment_reference: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// List Checkouts Query (Admin)
// ============================================================================

export const checkoutListQuerySchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'expired', 'cancelled']).optional(),
  payment_provider: z.enum(['paystack', 'paypal', 'eft']).optional(),
  user_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'amount_cents']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// Checkout ID Param
// ============================================================================

export const checkoutIdParamSchema = z.object({
  id: z.string().uuid('Invalid checkout ID'),
});
