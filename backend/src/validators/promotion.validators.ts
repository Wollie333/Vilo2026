/**
 * Promotion Validators (Zod Schemas)
 * Validation schemas for promotion-related operations
 */

import { z } from 'zod';

// ============================================================================
// Claim Promotion Schema
// ============================================================================

export const claimPromotionSchema = z.object({
  promotion_id: z.string().uuid('Invalid promotion ID'),
  property_id: z.string().uuid('Invalid property ID'),
  guest_name: z.string().min(1, 'Guest name is required').max(255, 'Name is too long'),
  guest_email: z.string().email('Invalid email address'),
  guest_phone: z.string().min(1, 'Phone number is required').max(50, 'Phone number is too long'),
});
