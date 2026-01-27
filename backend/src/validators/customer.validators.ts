import { z } from 'zod';
import { validateBody } from '../middleware';

/**
 * Customer Validators
 *
 * Defines separate validation schemas for customer updates based on who is updating:
 * - Property owners can only update property-owned fields (notes, tags, preferences)
 * - Guests can update their own contact fields (name, phone, marketing consent)
 */

/**
 * Schema for property owner updates
 * Restricts to property-owned fields only - NO contact details
 */
export const updateCustomerByPropertyOwnerSchema = z.object({
  // Property-owned fields - editable by property owner
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  internal_notes: z.string().optional(),
  preferred_room_types: z.array(z.string()).optional(),
  special_requirements: z.string().optional(),
  status: z.enum(['lead', 'active', 'past_guest', 'inactive', 'blocked']).optional(),
  status_mode: z.enum(['auto', 'manual']).optional(),
  last_contact_date: z.string().datetime().optional(),
});

/**
 * Schema for guest updates
 * Allows both contact fields and property-owned fields (for their own record)
 */
export const updateCustomerByGuestSchema = z.object({
  // Guest-owned fields - only guest can update these
  full_name: z.string().min(1, 'Name must not be empty').max(255).optional(),
  phone: z.string().max(50).optional(),
  marketing_consent: z.boolean().optional(),

  // Property-owned fields - guest can also update these for their own record
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  preferred_room_types: z.array(z.string()).optional(),
  special_requirements: z.string().optional(),
});

/**
 * Type exports
 */
export type UpdateCustomerByPropertyOwner = z.infer<typeof updateCustomerByPropertyOwnerSchema>;
export type UpdateCustomerByGuest = z.infer<typeof updateCustomerByGuestSchema>;

/**
 * Validation middleware exports
 */
export const validatePropertyOwnerCustomerUpdate = validateBody(updateCustomerByPropertyOwnerSchema);
export const validateGuestCustomerUpdate = validateBody(updateCustomerByGuestSchema);
